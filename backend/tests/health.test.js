// tests/health.test.js
// Smoke test — boots the Express app (no DB required) and asserts /health
// returns 200 with the expected Sanchivue brand fields.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns 200 with the Sanchivue brand fields', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.app).toBe('Sanchivue');
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSec).toBe('number');
    expect(res.body.db).toBeDefined();
  });
});

describe('404 handler', () => {
  it('returns a structured 404 for unknown routes', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
  });
});
