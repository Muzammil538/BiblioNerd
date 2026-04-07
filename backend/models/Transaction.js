const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    orderId: { type: String, required: true, unique: true },
    paymentSessionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
        type: String, 
        enum: ['PENDING', 'SUCCESS', 'FAILED'], 
        default: 'PENDING' 
    },
    planName: { 
        type: String, 
        enum: ['monthly', 'half-yearly', 'yearly'], 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);