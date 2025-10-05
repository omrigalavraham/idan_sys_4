export class CustomError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
    const errorId = Math.random().toString(36).substring(7);
    // Log error details
    console.error('Error occurred:', {
        id: errorId,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
    // Default error
    let error = { ...err };
    error.message = err.message;
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new CustomError(message, 404);
    }
    // Mongoose duplicate key
    if (err.name === 'MongoError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new CustomError(message, 400);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new CustomError(message, 400);
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new CustomError(message, 401);
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new CustomError(message, 401);
    }
    // Database connection errors
    if (err.message?.includes('ECONNREFUSED')) {
        const message = 'Database connection failed';
        error = new CustomError(message, 503);
    }
    // Send error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    if (process.env.NODE_ENV === 'production') {
        res.status(statusCode).json({
            success: false,
            error: message,
            errorId
        });
    }
    else {
        res.status(statusCode).json({
            success: false,
            error: message,
            stack: err.stack,
            errorId
        });
    }
};
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
export const notFound = (req, res, next) => {
    const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
    next(error);
};
