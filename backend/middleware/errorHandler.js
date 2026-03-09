/**
 * Global Error Handling Middleware
 * Provides centralized error handling with standardized responses
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class CronJobError extends AppError {
  constructor(message = 'Cron job failed', jobId = null) {
    super(message, 500, 'CRON_JOB_ERROR');
    this.jobId = jobId;
  }
}

/**
 * Handle MongoDB/Mongoose errors
 */
const handleDatabaseError = (error) => {
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyValue)[0];
    return new ConflictError(`${field} already exists`);
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return new ValidationError('Validation failed', errors);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid data format');
  }

  return new DatabaseError('Database operation failed', error);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }

  return new AuthenticationError('Token verification failed');
};

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (error) => {
  const errors = error.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));
  
  return new ValidationError('Validation failed', errors);
};

/**
 * Structured logging utility
 */
const logger = {
  error: (message, error = null, context = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error.errorCode && { errorCode: error.errorCode })
        }
      }),
      context,
      ...(process.env.NODE_ENV === 'development' && { 
        requestId: context.requestId 
      })
    };

    console.error(JSON.stringify(logEntry, null, 2));
  },

  warn: (message, context = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context
    };

    console.warn(JSON.stringify(logEntry, null, 2));
  },

  info: (message, context = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context
    };

    console.info(JSON.stringify(logEntry, null, 2));
  },

  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context
      };

      console.debug(JSON.stringify(logEntry, null, 2));
    }
  }
};

/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, _next) => {
  let err = error;

  // Convert non-operational errors to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name === 'ValidationError' && error.errors) {
      err = handleValidationErrors(error);
    } else if (error.name && error.name.includes('JsonWebToken')) {
      err = handleJWTError(error);
    } else if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') {
      err = handleDatabaseError(error);
    } else {
      err = new AppError(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

  // Log the error
  logger.error('Request error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.id
  });

  // Build error response
  const errorResponse = {
    success: false,
    message: err.message,
    ...(err.errorCode && { errorCode: err.errorCode }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      ...(err.originalError && { originalError: err.originalError.message })
    })
  };

  // Add validation errors if present
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  // Add rate limit info if present
  if (err.statusCode === 429) {
    errorResponse.retryAfter = err.retryAfter || 60;
  }

  res.status(err.statusCode).json(errorResponse);
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request ID middleware for tracking
 */
const requestIdMiddleware = (req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  CronJobError,

  // Middleware
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  asyncHandler,

  // Utilities
  logger
};
