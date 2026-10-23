// src/server.js
// Server bootstrap: load env, connect to MongoDB, init Express + Socket.io,
// start the submission worker, listen, and handle graceful shutdown.
// Also auto-seeds the database if it's empty (idempotent).
import http from 'node:http';
import { env } from './config/env.js';
import { APP_NAME, APP_TAGLINE, CREATOR } from './config/constants.js';
import { connectDB, getDbState, disconnectDB } from './db/index.js';
import { runSeed } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketManager } from './sockets/socketManager.js';
import { startSubmissionWorker } from './workers/submissionWorker.js';

// Banner so users can see we booted.
console.log(`\n  ${APP_NAME} — ${APP_TAGLINE}`);
console.log(`  Created by ${CREATOR}\n`);

// Boot sequence — wrapped in an IIFE so we can `await` cleanly.
(async () => {
  // Connect to MongoDB first — models rely on it.
  await connectDB();

  // Auto-seed on an empty DB (or if FORCE_SEED=true).
  if (getDbState() === 'connected') {
    try {
      const anyUser = await (
        await import('./models/user.model.js')
      ).default
        .findOne()
        .limit(1)
        .lean();
      if (!anyUser || env.FORCE_SEED) {
        await runSeed();
      } else {
        console.log(`[${APP_NAME}] Database already has data — skipping seed.`);
      }
    } catch (err) {
      console.warn(`[${APP_NAME}] Seed skipped:`, err.message);
    }
  }

  // Build the Express app + HTTP server.
  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.io to the same HTTP server.
  initSocketManager(httpServer);

  // Start the submission queue worker (in-memory or BullMQ).
  startSubmissionWorker();

  // Listen.
  httpServer.listen(env.PORT, () => {
    console.log(`[${APP_NAME}] HTTP + Socket.io listening on :${env.PORT}`);
    console.log(`[${APP_NAME}] Health check → http://localhost:${env.PORT}/health`);
    console.log(`[${APP_NAME}] API base    → http://localhost:${env.PORT}/api/v1`);
    console.log(`[${APP_NAME}] DB state:   ${getDbState()}`);
  });

  // ---- Graceful shutdown -------------------------------------------------
  async function shutdown(signal) {
    console.log(`\n[${APP_NAME}] ${signal} received — shutting down...`);
    try {
      httpServer.close();
      await disconnectDB();
      console.log(`[${APP_NAME}] Shutdown complete.`);
      process.exit(0);
    } catch (err) {
      console.error(`[${APP_NAME}] Shutdown error:`, err);
      process.exit(1);
    }
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error(`[${APP_NAME}] Unhandled rejection:`, reason);
  });
  process.on('uncaughtException', (err) => {
    console.error(`[${APP_NAME}] Uncaught exception:`, err);
    // In dev we let the process keep running so the user can see the error.
    // In prod we exit and let the process manager restart us.
    if (env.isProd) process.exit(1);
  });
})();
