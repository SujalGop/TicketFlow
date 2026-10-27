// ---------------------------------------------------------------------------
// Centralized Error Handler Middleware
// Catches all errors forwarded via next(err) or asyncHandler
// ---------------------------------------------------------------------------
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    statusCode = 400;
    message = `Duplicate value for field: ${field}. Please use a different value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    statusCode = 400;
    message = messages.join('. ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
