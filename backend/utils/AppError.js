// A known, "operational" error with an intentional HTTP status code —
// throw this anywhere a controller currently does
//   return res.status(400).json({ success: false, message: '...' })
// and the centralized error handler (middleware/errorHandler.js) will
// produce the exact same response shape. Anything that isn't an AppError
// (a genuine bug, a driver error, etc.) still reaches the same handler and
// falls back to 500 — nothing is silently swallowed either way.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
