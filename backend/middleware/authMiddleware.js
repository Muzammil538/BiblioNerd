const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    Verify JWT token and authenticate user
 * @used_by Most private routes (Profile, Book Details, Create Order)
 */
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the database (excluding password) and attach to request
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

/**
 * @desc    Verify if the user has Admin privileges
 * @used_by Admin-only routes (Upload Book, Delete Book)
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin permissions required' });
    }
};

/**
 * @desc    Verify if the user has an active, non-expired subscription
 * @used_by Book reading route (GET /api/books/:id)
 */
const checkSubscription = (req, res, next) => {
    const { subscription, role } = req.user;

    // Admins always have access
    if (role === 'admin') {
        return next();
    }

    // Check if subscription exists and is marked active
    if (!subscription || !subscription.isActive) {
        return res.status(403).json({ 
            message: 'Access Denied: You do not have an active subscription.' 
        });
    }

    // Check if the current date is past the end date
    const today = new Date();
    if (subscription.endDate && today > new Date(subscription.endDate)) {
        return res.status(403).json({ 
            message: 'Access Denied: Your subscription has expired. Please renew.' 
        });
    }

    next();
};

module.exports = { protect, admin, checkSubscription };