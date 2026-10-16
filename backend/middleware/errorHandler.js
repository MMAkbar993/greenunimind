// Centralized error handler. Every controller used to end with its own
// `catch (err) { res.status(500).json({ success: false, message: err.message
// || '...' }) }` — 124 copies of it across 22 files, always 500 even for
// things like "invalid id" or "duplicate email" that aren't server errors.
// This keeps the exact same response shape (so no frontend code needs to
// change) but:
//   - uses the right status code for AppError / common Mongoose errors
//   - always logs server-side, which most of the old catch blocks didn't
export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  // Mongoose: invalid ObjectId in a route param (e.g. GET /courses/not-an-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  }

  // Mongoose/MongoDB: duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already in use.`;
  }

  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
