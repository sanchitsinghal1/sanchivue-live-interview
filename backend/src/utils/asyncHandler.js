// src/utils/asyncHandler.js
// Wraps an Express request handler so rejected promises are forwarded to next()
// instead of crashing the process. Lets every controller be written as plain
// async/await without try/catch boilerplate.
export const asyncHandler = (requestHandler) => (req, res, next) =>
  Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));

export default asyncHandler;
