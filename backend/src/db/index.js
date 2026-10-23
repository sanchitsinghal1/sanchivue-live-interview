// src/db/index.js
// Mongoose connection helper. We export a connectDB() function that the server
// can call at boot. If MongoDB isn't reachable, we log clearly and resolve so the
// Express process keeps booting — the health endpoint still reports "disconnected"
// and DB-dependent endpoints return 503 via the notFound / error middleware chain.
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { APP_NAME, DB_NAME } from '../config/constants.js';

let connectionState = 'disconnected';

// Read-only accessor so health check / middleware can read the current state
// without exposing the raw mongoose connection.
export function getDbState() {
  return connectionState;
}

// Connect to MongoDB. Resolves (never throws) — see comment above.
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    connectionState = 'connected';
    return mongoose.connection;
  }
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.DB_NAME || DB_NAME,
      serverSelectionTimeoutMS: 5000, // fail fast if Atlas / local mongo unreachable
      autoIndex: env.isProd === false, // build indexes in dev only
    });
    connectionState = 'connected';
    mongoose.connection.on('disconnected', () => {
      connectionState = 'disconnected';
      console.warn(`[${APP_NAME}] MongoDB disconnected`);
    });
    mongoose.connection.on('error', (err) => {
      connectionState = 'error';
      console.error(`[${APP_NAME}] MongoDB error:`, err.message);
    });
    console.log(
      `[${APP_NAME}] MongoDB connected → ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn;
  } catch (err) {
    connectionState = 'error';
    console.error(`[${APP_NAME}] MongoDB connection failed: ${err.message}`);
    console.error(`       The server will still boot, but DB-dependent endpoints will return 503.`);
    return null;
  }
}

// Graceful disconnect for SIGTERM handlers.
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    connectionState = 'disconnected';
  } catch (err) {
    console.error(`[${APP_NAME}] Error closing mongoose connection:`, err.message);
  }
}

export default { connectDB, disconnectDB, getDbState };
