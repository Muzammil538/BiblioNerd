const express = require('express');
const router = express.Router();
const { createOrder, verifyWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payments/create-order
 * @desc    Initialize a Cashfree payment session
 * @access  Private (Logged-in users only)
 */
router.post('/create-order', protect, createOrder);

/**
 * @route   POST /api/payments/webhook
 * @desc    Receive payment status updates from Cashfree
 * @access  Public (Called by Cashfree API)
 * @note    Security is handled via signature verification in the controller
 */
router.post('/webhook', verifyWebhook);

module.exports = router;