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
      // Fail fast (5s) if Atlas / local mongo is unreachable so the server
      // doesn't hang on boot waiting for a dead DB.
      serverSelectionTimeoutMS: 5000,
      // Build indexes in dev only — in production, run `node scripts/createIndexes.js`
      // (or `db.createIndex()`) to avoid blocking the event loop on first boot.
      autoIndex: env.isProd === false,
      // ── Connection pool tuning (production scalability) ──────────────────
      // Each backend instance maintains a pool of TCP connections to MongoDB.
      // Defaults (5) are too small for a high-concurrency API. 25 is a safe
      // ceiling per instance — going higher risks exhausting the DB's own
      // connection cap (Atlas M0 = ~100 connections; scale the cluster if
      // you run multiple backend instances beyond ~3-4).
      maxPoolSize: env.MONGO_MAX_POOL_SIZE || 25,
      minPoolSize: env.MONGO_MIN_POOL_SIZE || 5,
      // Heartbeat — detect a stale connection every 10s and recycle it.
      heartbeatFrequencyMS: 10000,
      // Don't buffer queries when the DB is disconnected — fail fast so the
      // request layer can return a clean 503 instead of queuing indefinitely.
      bufferCommands: false,
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
    mongoose.connection.on('reconnected', () => {
      connectionState = 'connected';
      console.log(`[${APP_NAME}] MongoDB reconnected`);
    });
    console.log(
      `[${APP_NAME}] MongoDB connected → ${conn.connection.host}/${conn.connection.name} (pool ${env.MONGO_MAX_POOL_SIZE || 25})`,
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
