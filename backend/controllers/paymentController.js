const { Cashfree } = require('cashfree-pg');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Initialize Cashfree SDK
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === 'PRODUCTION' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;

/**
 * @desc    Create a payment order
 * @route   POST /api/payments/create-order
 * @access  Private
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
            order_amount: amount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: user._id.toString(),
                customer_phone: "9999999999", // Replace with user.phone if added to model
                customer_email: user.email
            },
            order_meta: {
                // The URL user is redirected to after payment completion
                return_url: `http://localhost:3000/payment-verify?order_id=${orderId}`
            }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        
        // Save the pending transaction in our database
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
 * @desc    Verify Payment Webhook (Security)
 * @route   POST /api/payments/webhook
 * @access  Public (Called by Cashfree)
 */
const verifyWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-webhook-signature"];
        const timestamp = req.headers["x-webhook-timestamp"];
        const rawBody = req.rawBody; // Captured in server.js middleware

        // 1. Verify the signature to ensure request is from Cashfree
        Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

        const event = JSON.parse(rawBody);

        if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
            const orderId = event.data.order.order_id;
            const transaction = await Transaction.findOne({ orderId });

            if (transaction && transaction.status !== 'SUCCESS') {
                // Update Transaction Status
                transaction.status = 'SUCCESS';
                await transaction.save();

                // 2. Calculate Expiry Date based on planName
                const startDate = new Date();
                let endDate = new Date();

                if (transaction.planName === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
                else if (transaction.planName === 'half-yearly') endDate.setMonth(endDate.getMonth() + 6);
                else if (transaction.planName === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);

                // 3. Update User Subscription
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