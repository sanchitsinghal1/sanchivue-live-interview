// src/app.js
// Express app composition: helmet, cors, cookieParser, json, urlencoded, rate limit,
// routes, 404, error middleware, health check.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { corsOptions } from './config/corsOptions.js';
import { APP_NAME, APP_TAGLINE } from './config/constants.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { requestTimeout } from './middlewares/timeout.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.routes.js';
import { getDbState } from './db/index.js';

export function createApp() {
  const app = express();

  // Trust the first proxy so req.ip / secure cookies work behind Caddy / nginx.
  app.set('trust proxy', 1);

  // Security headers. `crossOriginResourcePolicy` relaxed so the Next.js app can
  // load resources cross-origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS — config from src/config/corsOptions.js.
  app.use(cors(corsOptions));

  // gzip / brotli compression for all JSON responses. Halves bandwidth on list
  // endpoints (interviews, questions, submissions) and is essentially free CPU
  // for typical response sizes. Threshold 1KB so tiny 204/304 responses skip it.
  app.use(compression({ threshold: 1024 }));

  // Body parsers. We cap JSON body at 5MB to absorb large code submissions.
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Cookies.
  app.use(cookieParser());

  // HTTP request logger — dev format includes method/url/status/latency.
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Global rate limit — loose, just for runaway clients.
  app.use(globalLimiter);

  // Per-request deadline (30s). Aborts slow requests so they can't starve the
  // event loop or hold a mongoose connection hostage under load.
  app.use(requestTimeout(30000));

  // Liveness probe — returns 200 as long as the process is alive and can
  // accept connections. Used by load balancers / k8s liveness probes.
  // Does NOT depend on the database.
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      app: APP_NAME,
      tagline: APP_TAGLINE,
      ts: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      db: getDbState(),
      env: env.NODE_ENV,
    });
  });

  // Readiness probe — returns 200 ONLY when the DB is connected. Use this
  // for k8s readiness probes / load-balancer health checks so a backend
  // instance that lost its DB connection stops receiving traffic.
  app.get('/ready', (_req, res) => {
    const dbState = getDbState();
    const ready = dbState === 'connected';
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not-ready',
      app: APP_NAME,
      db: dbState,
      ts: new Date().toISOString(),
    });
  });

  // Mount all API routes under /api/v1.
  app.use(routes);

  // 404 → central error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
