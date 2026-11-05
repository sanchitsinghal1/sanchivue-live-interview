// src/config/corsOptions.js
// CORS configuration used by both Express and Socket.io. We allow any origin
// from env.ALLOWED_ORIGINS and forward credentials (cookies) on every request.
import { env } from './env.js';

// Express cors takes an object; Socket.io takes a similar object but a function
// is also allowed. We export a function so the same config works for both.
export function corsOptionsDelegate(origin, cb) {
  // Allow same-origin / no-origin requests (e.g. server-to-server, curl).
  if (!origin) return cb(null, true);
  const allowed = env.ALLOWED_ORIGINS;
  // In dev, "*" bypasses the strict allow-list so users can hit the API from any port.
  if (allowed.includes('*') || allowed.includes(origin)) {
    return cb(null, true);
  }
  return cb(new Error(`CORS: origin ${origin} not allowed`), false);
}

// Plain object form for libraries that just want a static config.
export const corsOptions = {
  origin: env.ALLOWED_ORIGINS.includes('*') ? true : env.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};

export default corsOptions;
