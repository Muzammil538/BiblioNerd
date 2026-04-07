const { Cashfree } = require('cashfree-pg');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Direct String Assignment - Avoids the "undefined" Environment error
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
    ? "PRODUCTION" 
    : "SANDBOX";

console.log(`[Cashfree] Initialized in ${Cashfree.XEnvironment} mode`);

/**
 * @desc    Create a payment order
 */
const createOrder = async (req, res) => {
    try {
        const { amount, planName } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const orderId = `order_${Date.now()}_${user._id.toString().slice(-4)}`;

        const request = {
            order_amount: parseFloat(amount).toFixed(2),
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: user._id.toString(),
                customer_phone: "9999999999", 
                customer_email: user.email
            },
            order_meta: {
                return_url: `http://localhost:3000/payment-verify?order_id=${orderId}`
            }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        
        await Transaction.create({
            userId: user._id,
            orderId: orderId,
            paymentSessionId: response.data.payment_session_id,
            amount: amount,
            planName: planName,
            status: 'PENDING'
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Cashfree Error:", error.response?.data || error.message);
        res.status(500).json({ 
            message: error.response?.data?.message || "Could not create payment order" 
        });
    }
};

/**
 * @desc    Verify Payment Webhook
 */
const verifyWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-webhook-signature"];
        const timestamp = req.headers["x-webhook-timestamp"];
        const rawBody = req.rawBody; 

        Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

        const event = JSON.parse(rawBody);

        if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
            const orderId = event.data.order.order_id;
            const transaction = await Transaction.findOne({ orderId });

            if (transaction && transaction.status !== 'SUCCESS') {
                transaction.status = 'SUCCESS';
                await transaction.save();

                const startDate = new Date();
                let endDate = new Date();

                if (transaction.planName === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
                else if (transaction.planName === 'half-yearly') endDate.setMonth(endDate.getMonth() + 6);
                else if (transaction.planName === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

                await User.findByIdAndUpdate(transaction.userId, {
                    subscription: {
                        plan: transaction.planName,
                        startDate: startDate,
                        endDate: endDate,
                        isActive: true
                    }
                });
            }
        }

        res.status(200).send("Webhook Processed");
    } catch (err) {
        console.error("Webhook Verification Error:", err.message);
        res.status(400).send("Verification Failed");
    }
};

module.exports = {
    createOrder,
    verifyWebhook
};