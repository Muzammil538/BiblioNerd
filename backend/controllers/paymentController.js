import crypto from "crypto";
import { getCashfreeClient } from "../config/cashfree.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const PLAN_PRICES_INR = {
  monthly: 299,
  yearly: 2499,
};

function computeSubscriptionWindow(user, plan) {
  const now = new Date();
  const prev = user.subscription || {};
  const days = plan === "yearly" ? 365 : 30;
  const currentEnd = prev.endDate ? new Date(prev.endDate) : null;
  const base =
    prev.isActive && currentEnd && currentEnd > now ? currentEnd : now;
  const endDate = new Date(base);
  endDate.setDate(endDate.getDate() + days);
  const startDate =
    prev.startDate && prev.isActive && currentEnd && currentEnd > now
      ? prev.startDate
      : now;
  return {
    plan,
    startDate,
    endDate,
    isActive: true,
  };
}

function getOrderIdFromPayload(data) {
  return (
    data?.order?.order_id ||
    data?.payment?.order_id ||
    data?.order_id ||
    data?.transaction?.order_id ||
    data?.orderId ||
    null
  );
}

function normalizeProviderStatus(provider) {
  const status =
    provider?.order_status ||
    provider?.order?.order_status ||
    provider?.order?.status ||
    provider?.status ||
    provider?.payment_status ||
    provider?.order?.payment_status ||
    provider?.transaction?.order_status ||
    provider?.transaction?.status ||
    provider?.data?.order_status ||
    provider?.data?.payment_status ||
    "";
  return String(status).trim().toUpperCase();
}

function providerIsPaid(provider) {
  const status = normalizeProviderStatus(provider);
  return ["PAID", "SUCCESS", "COMPLETED"].includes(status);
}

function providerIsFailed(provider) {
  const status = normalizeProviderStatus(provider);
  return ["FAILED", "DECLINED", "CANCELLED", "ERROR"].includes(status);
}

async function syncPaidTransaction(transaction, providerSource) {
  transaction.status = "paid";
  transaction.cfPaymentId =
    providerSource?.payment?.cf_payment_id ||
    providerSource?.payment?.payment_id ||
    providerSource?.payment_id ||
    providerSource?.transaction?.payment_id ||
    providerSource?.transaction?.cf_payment_id ||
    transaction.cfPaymentId ||
    null;
  transaction.rawWebhook = transaction.rawWebhook || { providerOrder: providerSource };
  await transaction.save();

  const user =
    transaction.user && transaction.user._id
      ? transaction.user
      : await User.findById(transaction.user);
  if (user) {
    user.subscription = computeSubscriptionWindow(user, transaction.plan);
    await user.save();
  }
}

export const createOrder = asyncHandler(async (req, res) => {
  const cf = getCashfreeClient();
  const { plan, customerPhone } = req.body;
  if (plan !== "monthly" && plan !== "yearly") {
    return res.status(400).json({ message: "Plan must be monthly or yearly" });
  }
  const amount = PLAN_PRICES_INR[plan];
  const orderId = `bn_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const frontend = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const returnUrl = `${frontend}/payment/return?order_id={order_id}`;
  const notifyHost = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  const notifyUrl = `${notifyHost}/api/payments/webhook`;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await Transaction.create({
    orderId,
    amount,
    currency: "INR",
    status: "created",
    user: user._id,
    plan,
  });

  const phone =
    (customerPhone && String(customerPhone).replace(/\D/g, "").slice(-10)) ||
    (user.phone && user.phone.replace(/\D/g, "").slice(-10)) ||
    "9999999999";

  const request = {
    order_amount: amount,
    order_currency: "INR",
    order_id: orderId,
    customer_details: {
      customer_id: user._id.toString(),
      customer_email: user.email,
      customer_phone: phone.length === 10 ? phone : "9999999999",
      customer_name: user.name,
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
    },
  };

  try {
    const response = await cf.PGCreateOrder(request);
    const data = response.data || response;
    const paymentSessionId =
      data.payment_session_id || data.paymentSessionId || data?.payment_session?.id;
    if (!paymentSessionId) {
      return res.status(502).json({
        message: "Payment provider did not return a session",
        provider: data,
      });
    }
    return res.status(201).json({
      orderId,
      paymentSessionId,
      amount,
      currency: "INR",
      plan,
    });
  } catch (err) {
    await Transaction.findOneAndUpdate(
      { orderId },
      { status: "failed", rawWebhook: { message: err?.message, body: err?.response?.data } }
    );
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Unable to create payment order";
    return res.status(502).json({ message: msg });
  }
});

export const webhook = asyncHandler(async (req, res) => {
  const cf = getCashfreeClient();
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  const rawBody =
    typeof req.body === "string"
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : JSON.stringify(req.body);

  if (!signature || !timestamp) {
    return res.status(400).json({ message: "Missing webhook signature headers" });
  }

  let event;
  try {
    event = cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
  } catch (e) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const payload = event.object;
  const type = payload?.type || payload?.event || "";
  const data = payload.data || payload || {};
  const orderId = getOrderIdFromPayload(data);

  if (!orderId) {
    return res.status(200).json({ received: true, ignored: true });
  }

  const transaction = await Transaction.findOne({ orderId });
  if (!transaction) {
    return res.status(200).json({ received: true, unknownOrder: orderId });
  }

  const isSuccessEvent =
    type === "PAYMENT_SUCCESS_WEBHOOK" ||
    type === "ORDER_PAYMENT_SUCCESS" ||
    type === "PAYMENT_COMPLETED" ||
    providerIsPaid(data);

  const isFailureEvent =
    type === "PAYMENT_FAILED_WEBHOOK" ||
    type === "ORDER_PAYMENT_FAILED" ||
    type === "PAYMENT_FAILED" ||
    providerIsFailed(data);

  if (isSuccessEvent) {
    if (transaction.status !== "paid") {
      await syncPaidTransaction(transaction, data);
      transaction.rawWebhook = payload;
      await transaction.save();
    }
    return res.status(200).json({ received: true, idempotent: true });
  }

  if (isFailureEvent) {
    await Transaction.findOneAndUpdate(
      { orderId },
      { status: "failed", rawWebhook: payload }
    );
  }

  return res.status(200).json({ received: true });
});

export const getOrderStatus = asyncHandler(async (req, res) => {
  const cf = getCashfreeClient();
  const { orderId } = req.params;
  const transaction = await Transaction.findOne({ orderId }).populate(
    "user",
    "name email subscription"
  );
  if (!transaction) {
    return res.status(404).json({ message: "Order not found" });
  }
  const ownerId =
    transaction.user?._id?.toString() || transaction.user?.toString();
  if (ownerId !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed to view this order" });
  }
  let provider = null;
  try {
    const response = await cf.PGFetchOrder(orderId);
    provider = response.data || response;
  } catch {
    provider = null;
  }

  if (provider && transaction.status !== "paid" && providerIsPaid(provider)) {
    await syncPaidTransaction(transaction, provider);
  }

  return res.json({
    transaction,
    provider,
  });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json({ transactions });
});

