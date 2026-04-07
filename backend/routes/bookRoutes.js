const express = require('express');
const router = express.Router();
const { 
    createBook, 
    getAllBooks, 
    getBookById, 
    deleteBook 
} = require('../controllers/bookController');
const { upload } = require('../config/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/books
 * @desc    Get all books (Metadata only)
 * @access  Public
 */
router.get('/', getAllBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get specific book details and PDF URL
 * @access  Private (Requires Login)
 */
router.get('/:id', protect, getBookById);

/**
 * @route   POST /api/books/upload
 * @desc    Upload new book (PDF and Cover Image)
 * @access  Private/Admin
 * @note    Uses 'fields' to handle multiple file types from the same form
 */
router.post(
    '/upload', 
    protect, 
    admin, 
    upload.fields([
        { name: 'bookFile', maxCount: 1 }, 
        { name: 'coverImage', maxCount: 1 }
    ]), 
    createBook
);

/**
 * @route   DELETE /api/books/:id
 * @desc    Remove a book from the library
 * @access  Private/Admin
 */
router.delete('/:id', protect, admin, deleteBook);

module.exports = router;