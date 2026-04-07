const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// 1. Load environment variables
dotenv.config();

// 2. Connect to MongoDB
connectDB();

const app = express();

/**
 * 3. Middleware Setup
 */
app.use(cors());

// Special Middleware for Cashfree: 
// We need the raw body to verify webhook signatures.
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.includes('/api/payments/webhook')) {
            req.rawBody = buf.toString();
        }
    }
}));

/**
 * 4. Routes
 */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Basic Root Route for API Status
app.get('/', (req, res) => {
    res.send('E-Book Subscription API is running...');
});

/**
 * 5. Error Handling Middleware
 * (Must be defined after all routes)
 */
app.use(notFound);
app.use(errorHandler);

/**
 * 6. Start Server
 */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g. DB connection issues)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});