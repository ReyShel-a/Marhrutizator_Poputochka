"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForbiddenError = exports.createUnauthorizedError = exports.createConflictError = exports.createNotFoundError = exports.createValidationError = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Error logger - logs errors with timestamp and request info
 */
const logError = (err, req, statusCode) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.socket.remoteAddress;
    console.error('='.repeat(80));
    console.error(`[${timestamp}] Error occurred`);
    console.error(`Request: ${method} ${url}`);
    console.error(`IP: ${ip}`);
    console.error(`Status: ${statusCode}`);
    if (err instanceof AppError) {
        console.error(`Error Code: ${err.code}`);
        console.error(`Message: ${err.message}`);
        if (err.details) {
            console.error('Details:', JSON.stringify(err.details, null, 2));
        }
    }
    else {
        console.error(`Error: ${err.name} - ${err.message}`);
        console.error('Stack:', err.stack);
    }
    console.error('='.repeat(80));
};
/**
 * Main error handler middleware
 * Handles all errors and returns standardized error responses
 * Requirements: 2.4, 3.4
 */
const errorHandler = (err, req, res, _next) => {
    // Handle AppError (expected errors)
    if (err instanceof AppError) {
        logError(err, req, err.statusCode);
        const response = {
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        };
        return res.status(err.statusCode).json(response);
    }
    // Handle database errors
    if (err.name === 'QueryFailedError' || err.code?.startsWith('23')) {
        logError(err, req, 400);
        const response = {
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database operation failed',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            },
        };
        return res.status(400).json(response);
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        logError(err, req, 400);
        const response = {
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
                details: err.details,
            },
        };
        return res.status(400).json(response);
    }
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
        logError(err, req, 400);
        const response = {
            error: {
                code: 'INVALID_JSON',
                message: 'Invalid JSON in request body',
            },
        };
        return res.status(400).json(response);
    }
    // Unexpected errors
    logError(err, req, 500);
    const response = {
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'development'
                ? err.message
                : 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development'
                ? { stack: err.stack }
                : undefined,
        },
    };
    return res.status(500).json(response);
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] 404 Not Found: ${req.method} ${req.originalUrl || req.url}`);
    const response = {
        error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            details: {
                path: req.originalUrl || req.url,
                method: req.method,
            },
        },
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Common error creators
 */
const createValidationError = (message, details) => {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
};
exports.createValidationError = createValidationError;
const createNotFoundError = (resource, id) => {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    return new AppError(404, 'NOT_FOUND', message, { resource, id });
};
exports.createNotFoundError = createNotFoundError;
const createConflictError = (message, details) => {
    return new AppError(409, 'CONFLICT', message, details);
};
exports.createConflictError = createConflictError;
const createUnauthorizedError = (message = 'Unauthorized') => {
    return new AppError(401, 'UNAUTHORIZED', message);
};
exports.createUnauthorizedError = createUnauthorizedError;
const createForbiddenError = (message = 'Forbidden') => {
    return new AppError(403, 'FORBIDDEN', message);
};
exports.createForbiddenError = createForbiddenError;
