const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String, required: true }, // Cloudinary Image URL
    pdfUrl: { type: String, required: true },     // Cloudinary PDF URL
    category: { type: String, default: 'General' },
    isPremium: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);