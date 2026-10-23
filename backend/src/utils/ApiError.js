// src/utils/ApiError.js
// Subclass of Error used to throw structured HTTP errors from controllers and
// middlewares. The central error middleware in src/middlewares/error.middleware.js
// reads these fields to build the response payload.
export class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    // `data` is reserved by Express conventions for "any non-error payload" — keep null.
    this.data = null;
    this.message = message;
    // success=false is what the frontend typically keys on for "is this an error".
    this.success = false;
    this.errors = errors;

    // Capture stack only if explicitly requested (avoids leaking it in prod logs).
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
