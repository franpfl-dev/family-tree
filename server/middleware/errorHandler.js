/**
 * middleware/errorHandler.js
 * Global Express error handler.
 * Must be registered last (after all routes).
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Mongoose validation errors → 400
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: Object.values(err.errors).map((e) => e.message).join('; '),
    });
  }

  // Duplicate key (e.g. inserting same _id twice)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record',
      error: `A record with that ID already exists.`,
    });
  }

  // Log unexpected errors
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : message,
  });
}

module.exports = errorHandler;
