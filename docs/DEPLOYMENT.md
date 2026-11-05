# Deployment Guide — Sanchivue

> **Sanchivue** — Live Technical Interview & AI Assessment Platform
> by **Sanchit Singhal**
>
> This guide walks you through deploying Sanchivue to production:
> **Frontend → Vercel**, **Backend → Render**, **Database → MongoDB Atlas**.

---

## Architecture at a glance

```
┌─────────────────────┐     HTTPS     ┌──────────────────────┐
│  Vercel (frontend)  │ ─────────────▶│  Render (backend)    │
│  React + Vite SPA   │  /api/v1/*    │  Express + Socket.io │
│  vercel.app domain  │  cookies      │  onrender.com domain │
└─────────────────────┘               └──────────┬───────────┘
                                                 │
                                       ┌─────────▼──────────┐
                                       │ MongoDB Atlas      │
                                       │ (M10+ recommended) │
                                       └────────────────────┘
```

---

## Step 1 — MongoDB Atlas (database)

1. Sign up at **cloud.mongodb.com** (free M0 cluster for testing; M10+ for production).
2. **Database Access** → add a user (e.g. `sanchivue`) with a strong password.
3. **Network Access** → add your Render service's egress IP, or `0.0.0.0/0` (allow access from anywhere — Atlas requires auth anyway).
4. **Connect** → **Drivers** → **Node.js** → copy the connection string. It looks like:
   ```
   mongodb+srv://sanchivue:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. You'll paste this as `MONGODB_URI` on Render in Step 3.

---

## Step 2 — Deploy the frontend to Vercel

### Prerequisites
- A GitHub/GitLab/Bitbucket repo containing the Sanchivue project root.
- A [vercel.com](https://vercel.com) account.

### Steps
1. Push your code to GitHub (the repo root should contain `frontend/`, `backend/`, `docs/`, `render.yaml`).
2. On Vercel: **New Project** → import your repo.
3. **Root Directory** → set to **`frontend`** (so Vercel builds only the Vite app).
4. **Framework Preset** → Vite (auto-detected; `vercel.json` confirms it).
5. **Build Command** → `bun run build` (or `npm run build` if you prefer npm).
6. **Output Directory** → `dist` (auto-detected).
7. **Environment Variables** (set in Vercel dashboard → Settings → Environment Variables):

   | Variable | Value | Notes |
   |---|---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api/v1` | The Render backend URL from Step 3. |
   | `VITE_SOCKET_URL` | `https://your-backend.onrender.com` | Same origin as the API (Socket.io served by Express). |

8. **Deploy**. Vercel builds and gives you `https://sanchivue.vercel.app` (or your custom domain).

### Cookie + CORS note (important)
The backend issues JWT cookies with `httpOnly + secure + sameSite`. For Vercel (frontend) ↔ Render (backend) cross-origin cookies to work:
- Set `COOKIE_SAME_SITE=none` and `COOKIE_DOMAIN=` (blank, current host) on Render.
- Both Vercel and Render must serve over HTTPS (they do by default).
- `FRONTEND_URL` on Render must exactly match your Vercel origin (scheme + host, no trailing slash).

---

## Step 3 — Deploy the backend to Render

### Prerequisites
- A [render.com](https://render.com) account.
- Your MongoDB Atlas connection string from Step 1.

### Steps (using `render.yaml` — Blueprint)
1. Render dashboard → **New** → **Blueprint**.
2. Select your repo. Render reads `render.yaml` at the repo root.
3. It creates a Web Service named `sanchivue-backend` (rootDir = `backend`).
4. **Environment Variables** (set each in Render → your service → Environment):

   | Variable | Required? | Value | Notes |
   |---|---|---|---|
   | `NODE_ENV` | ✅ | `production` | |
   | `PORT` | ✅ | `5000` | Render injects its own port via `PORT` env; the app reads it. |
   | `MONGODB_URI` | ✅ | `mongodb+srv://...` | From Atlas Step 1. |
   | `DB_NAME` | ✅ | `sanchivue` | |
   | `JWT_ACCESS_SECRET` | ✅ | (random 64 hex) | Run `openssl rand -hex 32`. |
   | `JWT_REFRESH_SECRET` | ✅ | (different random 64 hex) | Run `openssl rand -hex 32` again. |
   | `ACCESS_TOKEN_EXPIRY` | optional | `15m` | |
   | `REFRESH_TOKEN_EXPIRY` | optional | `7d` | |
   | `FRONTEND_URL` | ✅ | `https://your-app.vercel.app` | Your Vercel URL (for CORS + cookies). |
   | `BACKEND_URL` | ✅ | `https://your-backend.onrender.com` | |
   | `COOKIE_DOMAIN` | optional | (blank) | Set to `.onrender.com` only if serving cookies across subdomains. |
   | `COOKIE_SAME_SITE` | ✅ | `none` | Required for cross-origin Vercel↔Render cookies. |
   | `CLOUDINARY_CLOUD_NAME` | optional | (from cloudinary.com/console) | For avatar/resume uploads. |
   | `CLOUDINARY_API_KEY` | optional | (from cloudinary.com/console) | |
   | `CLOUDINARY_API_SECRET` | optional | (from cloudinary.com/console) | |
   | `AI_API_KEY` | optional | (z-ai key) | Blank → deterministic local AI fallback still works. |
   | `JUDGE0_BASE_URL` | optional | (Judge0 host) | For Python/Java/C++ execution. |
   | `REDIS_URL` | optional | `redis://...` | For multi-instance BullMQ submission queue. |
   | `TURN_URL` | optional | `turn:host:3478` | For reliable WebRTC across NATs. |
   | `TURN_USERNAME` | optional | | |
   | `TURN_CREDENTIAL` | optional | | |
   | `SMTP_HOST` | optional | (relay) | For email notifications. |
   | `SMTP_PORT` | optional | `587` | |
   | `SMTP_USER` | optional | | |
   | `SMTP_PASS` | optional | | |

5. **Deploy**. Render runs `bun install` then `node src/server.js`.
6. **Health check**: Render uses `/ready` (returns 200 only when DB is connected). Once green, your backend is live at `https://sanchivue-backend.onrender.com`.

### First boot
On first boot with an empty database, the backend **auto-seeds**:
- 1 demo organization ("Sanchivue Demo")
- `interviewer@demo.dev` / `interviewer123`
- `candidate@demo.dev` / `candidate123`
- **54 questions** across 16 categories (DSA, JavaScript, React, Node.js, Express, MongoDB, REST, Authentication, Debugging, Testing, System Design, Scalability, Security, Architecture, Behavioral, Project-based)

---

## Step 4 — Cloudinary (avatar / resume uploads)

Sanchivue uses Cloudinary's **free plan** for user avatar and resume uploads. The backend saves the file locally via Multer, uploads it to Cloudinary, then deletes the local temp file.

### Free-plan setup
1. Sign up at **cloudinary.com** (free tier: 25 credits ≈ 25 GB storage + bandwidth).
2. Dashboard → copy **Cloud Name**, **API Key**, **API Secret**.
3. Paste them into Render env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
4. If left blank, uploads return `null` gracefully — the rest of the platform still works; users just don't get avatar/resume URLs.

### Free-plan limitations
- 25 GB storage + 25 GB monthly bandwidth — plenty for avatars + PDF resumes for a small team.
- No signed uploads required for our use case (server-side upload with the API key).
- For high-volume production, upgrade to a paid plan or move to S3.

### Verification
- `backend/src/utils/cloudinary.js` — `uploadOnCloudinary(localPath)` + `deleteFromCloudinary(publicId)`.
- `backend/src/middlewares/multer.middleware.js` — saves to `public/temp/`.
- `backend/src/controllers/user.controller.js` — `/users/me/avatar` + `/users/me/resume` endpoints.
- Frontend: `ProfilePage.jsx` → file picker → `POST /users/me/avatar` (multipart).

---

## Step 5 — Verify the deployment

1. Visit your Vercel URL → the landing page renders.
2. **Sign in** with `interviewer@demo.dev` / `interviewer123`.
3. **Dashboard** loads → shows the 54 seeded questions via search/filter/pagination.
4. **Question Bank** → bookmark a question, export JSON, import JSON, click "AI Question" → generate.
5. **Schedule Interview** → create a room → share the invitation link.
6. Open the invitation link in an incognito tab → join as candidate → live room (Monaco + video + chat + whiteboard + proctoring).
7. End the interview → evaluation report with rubric + radar + code replay.

If any step fails, check:
- Render logs (service → Logs).
- Browser console for CORS / cookie errors.
- `FRONTEND_URL` on Render matches your Vercel origin exactly.
- `COOKIE_SAME_SITE=none` is set (cross-origin cookies).

---

## Production checklist

- [ ] MongoDB Atlas: M10+ cluster, IP allowlist configured.
- [ ] Render: `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` set to unique random values.
- [ ] Render: `FRONTEND_URL` = your Vercel URL (no trailing slash).
- [ ] Render: `COOKIE_SAME_SITE=none`.
- [ ] Vercel: `VITE_API_URL` = `https://your-backend.onrender.com/api/v1`.
- [ ] Vercel: `VITE_SOCKET_URL` = `https://your-backend.onrender.com`.
- [ ] Cloudinary creds set (or accept graceful null fallback).
- [ ] TURN server configured (for reliable cross-network WebRTC).
- [ ] First-boot auto-seed completes (check Render logs for "MongoDB connected" + "question seeded").
- [ ] `/ready` returns 200 (Render health check green).
- [ ] Login + dashboard + question bank + live room all verified end-to-end.

---

## Known production gaps (honest)

- **WebRTC across restrictive NATs** requires a TURN server (`TURN_URL`/`TURN_USERNAME`/`TURN_CREDENTIAL`). Without it, P2P audio/video may fail on some networks.
- **Multi-instance Socket.io scaling** requires the `@socket.io/redis-adapter` + Redis. Single-instance Render is fine for moderate traffic; horizontal scaling needs Redis + the adapter.
- **Judge0** for Python/Java/C++ execution is optional. Without it, only JavaScript runs in the sandboxed VM.
- **100k concurrent users** has NOT been load-tested at production scale. The single-process baseline (~8-11k req/s on /health) characterizes HTTP headroom; production concurrency depends on Atlas tier + replica count + Redis + TURN.

---

Built by **Sanchit Singhal**. Original product — no fabricated credentials, customers, or benchmarks.
