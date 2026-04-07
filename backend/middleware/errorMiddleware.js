/**
 * @desc    Handles 404 Not Found errors
 * @used_by Triggered when a user hits a route that doesn't exist
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * @desc    Centralized Error Handler
 * @used_by Catching all errors (DB errors, Auth errors, Payment errors)
 */
const errorHandler = (err, req, res, next) => {
    // Sometimes a failed request doesn't have a 200 status, 
    // but if it's still 200, we force it to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode);

    res.json({
        message: err.message,
        // Only show the error stack trace if we are in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };