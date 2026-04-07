const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    authUser, 
    getUserProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', authUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile data
 * @access  Private
 * @note    The 'protect' middleware ensures only logged-in users reach the controller
 */
router.get('/profile', protect, getUserProfile);

module.exports = router;