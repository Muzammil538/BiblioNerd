const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' // Default role for everyone who registers
    },
    subscription: {
        plan: { 
            type: String, 
            enum: ['none', 'monthly', 'half-yearly', 'yearly'], 
            default: 'none' 
        },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: false }
    }
}, { timestamps: true });

/**
 * PASSWORD ENCRYPTION LOGIC
 * This middleware runs before every "save" operation.
 */
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * PASSWORD VERIFICATION LOGIC
 * Used during Login to compare entered password with the hashed one.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);