// src/middlewares/error.middleware.js
// Central error handler. Converts ApiError instances into structured JSON
// responses and falls back to a generic 500 for unexpected errors. Stack traces
// are NEVER leaked in production.
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

// Convert thrown values to a uniform ApiError-like object.
function toApiError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose duplicate-key error → 409
  if (err?.name === 'MongoServerError' && err?.code === 11000) {
    const key = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    return new ApiError(409, `Duplicate value for: ${key}.`, [err.keyValue]);
  }
  // Mongoose validation error → 400 with field-level messages
  if (err?.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e) => ({
      message: e.message,
      path: e.path,
    }));
    return new ApiError(400, 'Validation failed.', errors);
  }
  // Mongoose cast error (bad ObjectId etc.) → 400
  if (err?.name === 'CastError') {
    return new ApiError(400, `Invalid value for "${err.path}": ${err.value}`);
  }
  // JSON parse error from express body-parser
  if (err?.type === 'entity.parse.failed') {
    return new ApiError(400, 'Malformed JSON body.');
  }
  // Express-jwt style "UnauthorizedError"
  if (err?.name === 'UnauthorizedError') {
    return new ApiError(401, 'Invalid or missing token.');
  }
  // Fallback — never leak details in production.
  return new ApiError(500, 'Internal server error.', []);
}

// `_next` is intentionally unused — Express requires the 4-arg signature for
// error handlers. Our eslint config ignores args matching ^_.
export function errorHandler(err, req, res, _next) {
  const apiErr = toApiError(err);
  const statusCode = apiErr.statusCode || 500;

  // Log only non-trivial errors — 404s and validation errors are routine.
  if (statusCode >= 500) {
    console.error('[errorHandler]', err);
  } else if (statusCode >= 400 && env.isProd === false) {
    console.warn(`[errorHandler] ${statusCode} ${apiErr.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: apiErr.message,
    errors: apiErr.errors || [],
    statusCode,
    // Stack only in non-production for quick debugging.
    ...(env.isProd === false ? { stack: err?.stack } : {}),
  });
}

// 404 handler — runs when no route matched. Calls next() so the error handler
// above converts it to the standard JSON shape.
export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export default { errorHandler, notFoundHandler };
