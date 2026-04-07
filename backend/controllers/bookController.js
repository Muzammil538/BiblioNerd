const Book = require('../models/Book');
const { cloudinary } = require('../config/cloudinary');

/**
 * @desc    Create a new book (Admin Only)
 * @route   POST /api/books/upload
 * @access  Private/Admin
 */
const createBook = async (req, res) => {
    try {
        const { title, author, description, category, isPremium } = req.body;

        // req.files is populated by the multer/cloudinary middleware
        if (!req.files || !req.files.bookFile || !req.files.coverImage) {
            return res.status(400).json({ message: 'Please upload both a PDF and a cover image' });
        }

        const book = new Book({
            title,
            author,
            description,
            category,
            isPremium: isPremium === 'true', // Handle form-data string boolean
            pdfUrl: req.files.bookFile[0].path, // Cloudinary PDF link
            coverImage: req.files.coverImage[0].path // Cloudinary Image link
        });

        const createdBook = await book.save();
        res.status(201).json(createdBook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all books (Metadata only for gallery)
 * @route   GET /api/books
 * @access  Public
 */
const getAllBooks = async (req, res) => {
    try {
        // We select everything except the pdfUrl for the general list to save bandwidth
        const books = await Book.find({}).select('-pdfUrl');
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get book details and PDF link
 * @route   GET /api/books/:id
 * @access  Private (Subscription check will happen in middleware)
 */
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete a book
 * @route   DELETE /api/books/:id
 * @access  Private/Admin
 */
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (book) {
            // Note: In a production app, you'd also delete the file from Cloudinary here
            await book.deleteOne();
            res.json({ message: 'Book removed' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBook,
    getAllBooks,
    getBookById,
    deleteBook
};