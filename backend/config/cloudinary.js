const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with credentials from .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Storage configuration for E-Books (PDFs) and Cover Images.
 * We use 'raw' resource_type for PDFs to maintain their format.
 */
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder and type based on file extension
        const isPdf = file.mimetype === 'application/pdf';
        
        return {
            folder: isPdf ? 'ebook-system/pdfs' : 'ebook-system/covers',
            resource_type: isPdf ? 'raw' : 'image', // 'raw' is required for PDF files in Cloudinary
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            format: isPdf ? 'pdf' : undefined, // Cloudinary handles image formats automatically
        };
    },
});

// Create the Multer upload instance
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit files to 10MB
    fileFilter: (req, file, cb) => {
        // Accept only PDFs and common image formats
        if (
            file.mimetype === 'application/pdf' || 
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/png'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
        }
    }
});

module.exports = { cloudinary, upload };