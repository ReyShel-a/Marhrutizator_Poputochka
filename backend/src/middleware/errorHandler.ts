import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error logger - logs errors with timestamp and request info
 */
const logError = (
  err: Error | AppError,
  req: Request,
  statusCode: number
): void => {
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
  } else {
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
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle AppError (expected errors)
  if (err instanceof AppError) {
    logError(err, req, err.statusCode);
    
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    return res.status(err.statusCode).json(response);
  }

  // Handle database errors
  if (err.name === 'QueryFailedError' || (err as any).code?.startsWith('23')) {
    logError(err, req, 400);
    
    const response: ErrorResponse = {
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
    
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: (err as any).details,
      },
    };
    return res.status(400).json(response);
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    logError(err, req, 400);
    
    const response: ErrorResponse = {
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    };
    return res.status(400).json(response);
  }

  // Unexpected errors
  logError(err, req, 500);
  
  const response: ErrorResponse = {
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

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] 404 Not Found: ${req.method} ${req.originalUrl || req.url}`);
  
  const response: ErrorResponse = {
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

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Common error creators
 */
export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(400, 'VALIDATION_ERROR', message, details);
};

export const createNotFoundError = (resource: string, id?: string): AppError => {
  const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
  return new AppError(404, 'NOT_FOUND', message, { resource, id });
};

export const createConflictError = (message: string, details?: any): AppError => {
  return new AppError(409, 'CONFLICT', message, details);
};

export const createUnauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return new AppError(401, 'UNAUTHORIZED', message);
};

export const createForbiddenError = (message: string = 'Forbidden'): AppError => {
  return new AppError(403, 'FORBIDDEN', message);
};
