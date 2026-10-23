# Deployment — Sanchivue

## Frontend (React + Vite)

```bash
cd frontend && bun run build     # outputs to frontend/dist
```

Deploy `frontend/dist` to any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, nginx).

- **SPA fallback:** configure the host to rewrite all unknown routes to `/index.html` so React Router works.
- **Environment:** set `VITE_API_URL` to the production backend URL (e.g. `https://api.sanchivue.app/api/v1`). Leave `VITE_SOCKET_URL` empty if the backend serves the socket on the same origin, else set it.
- **HTTPS:** required so cookies with `secure:true` work.

## Backend (Node + Express)

```bash
cd backend && NODE_ENV=production bun run start   # node src/server.js
```

Host on Render, Railway, Fly.io, a VPS, or a container orchestration platform.

- Set **all** required env vars (see below).
- Put the backend behind a reverse proxy (nginx/Caddy) with HTTPS + WebSocket upgrade support for Socket.io.
- Health check: `GET /health` returns `{status:"ok", app:"Sanchivue"}`.
- Graceful shutdown handles `SIGTERM`/`SIGINT`.

## MongoDB Atlas setup

1. Sign up at **cloud.mongodb.com** and create a free **M0** cluster.
2. **Database Access** → add a user (e.g. `sanchivue`) + a strong password.
3. **Network Access** → add your IP (or `0.0.0.0/0` for development only).
4. **Connect** → **Drivers** → choose Node.js → copy the connection string.
5. Paste it into `backend/.env`:
   ```bash
   MONGODB_URI=mongodb+srv://sanchivue:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=sanchivue
   ```
6. Start the backend. On first boot with an empty DB it auto-seeds demo data.

Never commit `MONGODB_URI` to Git. Never paste it in chat.

## Redis (optional)

Only required if you enable the **BullMQ** submission queue (for multi-instance horizontal scaling).

```bash
REDIS_URL=redis://localhost:6379
```

- Local: install Redis via your package manager (`brew install redis` / `apt install redis`).
- Managed: Upstash, Redis Cloud, or your cloud provider's managed Redis.
- When scaling Socket.io horizontally, also add the `@socket.io/redis-adapter`.

## Cloudinary (image uploads)

1. Sign up at **cloudinary.com**.
2. Dashboard → copy **Cloud Name**, **API Key**, **API Secret**.
3. Paste into `backend/.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
   If left blank, uploads return `null` gracefully (the rest of the platform still works).

## AI provider

The backend uses `z-ai-web-dev-sdk`. If a key is configured the real LLM is used; otherwise a deterministic local fallback produces rich output (so AI buttons still work).

```bash
AI_PROVIDER=zai
AI_API_KEY=<your-key>
AI_MODEL=<optional>
```

## Email (Nodemailer)

```bash
SMTP_HOST=smtp.your-relay.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

If left blank, email sending no-ops in development (the platform logs the would-be email). In production, configure a real SMTP relay (Resend, Postmark, SendGrid, AWS SES).

## Code-execution provider (Judge0, optional)

```bash
JUDGE0_BASE_URL=https://your-judge0.example.com
JUDGE0_API_KEY=...
```

If left blank, candidate JavaScript runs in the built-in `node:vm` sandbox and Python/Java/C++ return a friendly "toolchain not installed" message.

## STUN/TURN (WebRTC)

For reliable cross-network audio/video:

```bash
TURN_URL=turn:your-turn-server.example.com:3478
TURN_USERNAME=...
TURN_CREDENTIAL=...
```

Use **coturn** (self-hosted) or a managed TURN (Twilio, Xirsys). For local/LAN testing the default Google STUN is enough.

## Required env vars summary (backend)

Minimum to boot meaningfully:

```bash
MONGODB_URI=...            # MongoDB Atlas connection string
JWT_ACCESS_SECRET=...      # openssl rand -hex 32
JWT_REFRESH_SECRET=...     # openssl rand -hex 32 (different value)
FRONTEND_URL=http://localhost:5173
```

Everything else has a safe dev fallback. See `backend/.env.example` for the full list with English comments.

## Docker Compose (optional, local)

A `docker-compose.yml` can be added to spin up MongoDB + Redis + the backend + the frontend. Not included by default to keep the repo lean — see `docs/TROUBLESHOOTING.md` for a sketch if you need it.
