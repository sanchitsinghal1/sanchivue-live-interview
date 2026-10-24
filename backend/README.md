# Sanchivue Backend

> **Sanchivue** — Live Technical Interview & AI Assessment Platform.  
> Pure-JavaScript MERN backend with Socket.io for real-time collaboration.  
> Created by **Sanchit Singhal**.

This is the standalone Node.js + Express + MongoDB + Mongoose + Socket.io backend for the
Sanchivue platform. It is intentionally **separate** from the Next.js demo that lives in
`/src` — they share no code, no DB, and no runtime.

---

## Stack

| Concern              | Choice                                             |
| -------------------- | -------------------------------------------------- |
| Language             | **Pure JavaScript (ES modules, `.js`)**            |
| HTTP framework       | Express                                            |
| Database              | MongoDB via Mongoose                               |
| Real-time             | Socket.io (auth + per-room authorization)          |
| Auth                  | Dual JWT (access + refresh) in httpOnly cookies     |
| Validation            | Zod                                                 |
| Code execution        | Sandboxed `node:vm` (+ Judge0 / Python / Java / C++ if installed) |
| AI                    | `z-ai-web-dev-sdk` with deterministic local fallbacks |
| Queue                 | In-memory queue (or BullMQ + Redis if `REDIS_URL` set) |
| Uploads               | Multer → Cloudinary                                 |
| Email                 | Nodemailer (graceful no-op if SMTP not configured)  |

---

## Quick start

```bash
cd backend
cp .env.example .env       # then fill in MONGODB_URI + JWT secrets
bun install                # or npm install
bun run dev                # node --watch src/server.js
```

The server boots on `PORT` (default 5000). If MongoDB isn't running, the server still
starts and prints a clear error — but most endpoints will return 503 until DB is up.
On first boot against an empty DB, an auto-seed runs (1 demo org, 1 interviewer, 1
candidate, 5 classic DSA questions).

### Demo accounts (auto-seeded)

| Role        | Email                  | Password       |
| ----------- | ---------------------- | -------------- |
| Interviewer | `interviewer@demo.dev` | `interviewer123` |
| Candidate   | `candidate@demo.dev`   | `candidate123`   |

---

## Required `.env` values

These are the **only** values you must fill to run the server locally:

```
MONGODB_URI=mongodb://127.0.0.1:27017/sanchivue
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
FRONTEND_URL=http://localhost:5173
```

All other variables have safe dev fallbacks documented in `.env.example` and `src/config/env.js`.

---

## Routes

All routes are mounted under `/api/v1` (see `src/routes/index.routes.js`).

| Prefix            | Resource                              |
| ----------------- | ------------------------------------- |
| `/auth`           | register, login, logout, refresh, me, forgot/reset password, verify email, change password |
| `/users`          | profile, update profile, avatar, resume, list (admin) |
| `/organizations`  | CRUD, members, invite, accept-invite, revoke |
| `/interviews`    | CRUD, schedule, state transitions, join, snapshot, proctoring, chat, assign question, end |
| `/questions`      | CRUD, aggregate-paginate, AI generate |
| `/submissions`    | run, submit, history, get by id        |
| `/evaluations`    | get by interviewId, upsert (rubric + AI summary) |
| `/notifications`  | list, mark-read, preferences           |
| `/ai`             | copilot, assessment, summary, followups |

### Health check

`GET /health` → `{ status: "ok", app: "Sanchivue", ts: <ISO>, uptime, db: "connected" | "disconnected" }`

---

## Real-time socket events

Socket.io is mounted on the same HTTP server at path `/` with CORS from
`src/config/corsOptions.js`. Auth is via JWT in `socket.handshake.auth.token`.

Client → server: `join-room`, `code:change`, `language:change`, `cursor:move`,
`chat:message`, `whiteboard:draw`, `whiteboard:clear`, `whiteboard:sync-request`,
`whiteboard:state`, `proctoring:violation`, `snapshot:save`, `snapshot:request`,
`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`, `disconnect`.

Server → client: `presence:update`, `code:change`, `language:change`, `cursor:move`,
`chat:message`, `whiteboard:*`, `proctoring:violation`, `snapshot:saved`,
`snapshot:list`, `webrtc:*`, `error`.

---

## Folder structure

See the master spec in the project root — the layout under `src/` follows it exactly:
`config/`, `db/`, `models/`, `controllers/`, `routes/`, `middlewares/`, `services/`,
`sockets/`, `queues/`, `workers/`, `utils/`, `validators/`, plus `app.js` + `server.js`.

---

## Scripts

| Script           | What it does                              |
| ---------------- | ----------------------------------------- |
| `bun run dev`    | Start with `node --watch` (auto-restart). |
| `bun run start`  | Start in production mode.                  |
| `bun run lint`   | ESLint.                                    |
| `bun run format` | Prettier write.                            |
| `bun run test`   | Vitest (smoke test).                        |

---

## License

MIT © Sanchit Singhal.
