# Sanchivue — Deployment Checklist

> Prioritized blockers to fix **before** deploying Sanchivue to production.
> Verified against the actual source code. Each item says what's wrong, where it is, and the fix.

---

## 🔴 P0 — Must fix before any production deploy

### P0-1. Set `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` (different values)
- **Where:** `backend/.env` (on Render)
- **Why:** `config/env.js` falls back to insecure dev strings if blank. In `NODE_ENV=production` the fallback is empty → server should fail loud. If you deploy with dev secrets, anyone can forge JWTs.
- **Fix:** Run `openssl rand -hex 32` twice, paste each as a different secret.

### P0-2. Set `MONGODB_URI` to a real instance
- **Where:** `backend/.env`
- **Why:** The app boots without MongoDB (logs "DB-dependent endpoints will return 503"), but nothing persists — registration, interviews, questions all fail.
- **Fix:** MongoDB Atlas (M10+ for prod) or a local `mongod`. Connection string format: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`.

### P0-3. Set `FRONTEND_URL` to your exact Vercel origin
- **Where:** `backend/.env` on Render
- **Why:** `config/corsOptions.js` allowlists `FRONTEND_URL`. If it doesn't match your deployed frontend (scheme + host, no trailing slash), the browser blocks every API call with CORS errors.
- **Fix:** `FRONTEND_URL=https://your-app.vercel.app`

### P0-4. Set `COOKIE_SAME_SITE=none` for cross-origin (Vercel ↔ Render)
- **Where:** `backend/.env` on Render
- **Why:** Vercel (frontend) and Render (backend) are different origins. `sameSite=lax` (the default) blocks cross-origin cookie delivery → no auth.
- **Fix:** `COOKIE_SAME_SITE=none`. Both Vercel and Render serve HTTPS by default, so `secure:true` cookies work.

### P0-5. Verify first-boot auto-seed completes
- **Where:** Render logs after first deploy
- **Why:** `db/seed.js` runs on empty DB. If it fails (e.g., DB connection race), you have no demo accounts/questions.
- **Fix:** Check Render logs for `MongoDB connected` + `question seeded`. Login with `interviewer@demo.dev / interviewer123` to confirm.

### P0-6. Verify `/ready` returns 200
- **Where:** `https://your-backend.onrender.com/ready`
- **Why:** Render's health check uses this. If it returns 503 (DB disconnected), Render marks the service unhealthy and stops routing traffic.
- **Fix:** If 503, check `MONGODB_URI` + Atlas network-access allowlist.

---

## 🟡 P1 — Should fix before real traffic

### P1-1. Configure a TURN server for WebRTC
- **Where:** `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` in `backend/.env`
- **Why:** WebRTC P2P fails on symmetric NATs (corporate networks, mobile carriers). Signaling (Socket.IO) works, but media doesn't connect.
- **Fix:** Self-host coturn OR use Twilio/Xirsys managed TURN. Without it, ~10-20% of cross-network calls may fail.
- **Status:** Adapter present in `config/env.js`; not tested without a TURN instance.

### P1-2. Set up Redis + `@socket.io/redis-adapter` for multi-instance
- **Where:** `REDIS_URL` in `backend/.env`; install `@socket.io/redis-adapter`
- **Why:** Single Render instance is fine for low traffic. To scale horizontally (N replicas), socket events emitted on instance A must reach sockets connected to instance B. The current `socketManager.js` uses in-memory maps — they don't cross instances.
- **Fix:** Add Redis adapter to `socketManager.js` (`io.adapter(createAdapter({pubClient, subClient}))`). The `queues/submissionQueue.js` already has BullMQ support behind `REDIS_URL`.
- **Status:** BullMQ adapter present; Socket.io adapter NOT yet wired (would need a code change — flagged for your approval before editing).

### P1-3. Configure Cloudinary (or accept graceful null)
- **Where:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `backend/.env`
- **Why:** Avatar/resume uploads. `utils/cloudinary.js` returns `null` gracefully if blank — the rest works, users just don't get image URLs.
- **Fix:** Free plan at cloudinary.com → console → copy keys. 25 GB storage/bandwidth is plenty for avatars.

### P1-4. Configure SMTP (or accept no-email)
- **Where:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `backend/.env`
- **Why:** Password-reset emails + candidate-invitation emails. `services/email.service.js` logs + returns `{ok:false}` if blank — no crash, just no email delivery.
- **Fix:** Any SMTP relay (Resend, Postmark, SendGrid, Mailtrap for dev).

### P1-5. Run `createIndexes()` separately in production
- **Where:** `db/index.js` → `autoIndex: env.isProd === false`
- **Why:** In dev, Mongoose builds indexes on boot. In prod, that blocks the event loop on large collections.
- **Fix:** Run a one-off script (`node scripts/createIndexes.js`) after deploy, or use `db.collection.createIndex()` in the Mongo shell. (Script not yet written — would need your approval.)

### P1-6. Add CSRF protection IF you deploy cross-origin
- **Where:** `middlewares/` (new middleware) + frontend Axios
- **Why:** `sameSite=none` (required for P0-4) weakens CSRF protection. For same-origin deployments `sameSite=lax` is enough; cross-origin needs a CSRF token (double-submit or synchronizer).
- **Fix:** Add `csurf` or a custom double-submit-token middleware. NOT currently implemented.
- **Status:** Not implemented — flagged for your approval before adding.

---

## 🟢 P2 — Nice to have / hardening

### P2-1. Configure AI provider key
- **Where:** `AI_API_KEY` in `backend/.env`
- **Why:** The deterministic local fallback works, but the real LLM gives richer output.
- **Status:** Adapter present; fallback verified.

### P2-2. Configure Judge0 for Python/Java/C++
- **Where:** `JUDGE0_BASE_URL`, `JUDGE0_API_KEY` in `backend/.env`
- **Why:** JavaScript runs out-of-the-box in node:vm. Other languages need a real sandboxed runner.
- **Status:** Adapter present; not tested.

### P2-3. Add structured logging (pino/winston)
- **Where:** Replace `morgan` + `console.log` with a structured logger
- **Why:** `morgan('combined')` is fine for basic traffic logs, but production observability needs JSON logs with request IDs for tracing.
- **Status:** Not implemented.

### P2-4. Add metrics endpoint (Prometheus)
- **Where:** New `/metrics` route
- **Why:** For autoscaling decisions + SLO monitoring.
- **Status:** Not implemented.

### P2-5. Load test at target concurrency
- **Where:** `backend/tests/loadtest.mjs` (exists, single-process only)
- **Why:** Current numbers (~10.8k req/s single process) characterize HTTP headroom, not production concurrency.
- **Status:** Multi-replica load test NOT done (requires the infra from P1-2).

### P2-6. Add integration tests for authz
- **Where:** `backend/tests/`
- **Why:** Only `health.test.js` exists. No tests verify IDOR prevention, org isolation, or hidden-test masking.
- **Status:** Not implemented.

---

## Pre-deploy verification checklist

Run each of these before flipping traffic to production:

- [ ] `cd backend && bunx eslint .` → 0 errors
- [ ] `cd backend && bunx vitest run` → 2/2 pass
- [ ] `cd backend && node --check src/db/seed.js` → OK
- [ ] `cd frontend && vite build` → ✓ 0 errors
- [ ] `cd frontend && eslint .` → 0 errors
- [ ] `MONGODB_URI` set on Render
- [ ] `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` set (different values)
- [ ] `FRONTEND_URL` = your Vercel URL (no trailing slash)
- [ ] `COOKIE_SAME_SITE=none`
- [ ] Render logs show `MongoDB connected` + `question seeded` (54 questions)
- [ ] `https://your-backend.onrender.com/ready` returns 200
- [ ] `https://your-frontend.vercel.app` loads the landing page
- [ ] Login with `interviewer@demo.dev / interviewer123` → dashboard renders
- [ ] Question Bank shows 54 questions with search/filter/pagination
- [ ] Bookmark a question → toggle persists
- [ ] Schedule Interview → create room → invitation link works
- [ ] Open invitation link incognito → candidate waiting room → join
- [ ] Live room: type code → both see it; video connects; chat works
- [ ] End session → evaluation report renders (rubric + radar + replay)
- [ ] (If Cloudinary set) upload avatar → URL persists
- [ ] (If TURN set) cross-network video connects

---

Built by **Sanchit Singhal**. Honest about what's verified vs. what's an adapter awaiting external services.
