// src/middlewares/timeout.middleware.js
// Per-request timeout middleware.
//
// Why this exists: under heavy load (or a slow DB query), a single request
// can hold a Node event-loop slot + a mongoose connection for a long time,
// starving other clients. This middleware aborts a request after a fixed
// deadline and returns a clean 503 so the load balancer can retry elsewhere.
//
// It uses `req.setTimeout` (Node http) which fires `socket.destroy` under the
// hood. We pair it with an explicit timeout check via `res.headersSent` so we
// never try to write a response that's already mid-flight.
//
// Apply this AFTER body parsing (so the body is read first) but BEFORE routes.
// Default: 30s — generous enough for code execution, tight enough to protect
// the event loop.

export function requestTimeout(timeoutMs = 30000) {
  return (req, res, next) => {
    // Set the socket-level timeout. Node will emit 'timeout' on the socket.
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Request timed out. Please retry.',
          statusCode: 503,
        });
      }
      // Destroy the underlying socket so the connection is released back to
      // the pool instead of lingering until the client gives up.
      if (req.socket && !req.socket.destroyed) {
        req.socket.destroy();
      }
    });
    next();
  };
}

export default requestTimeout;
