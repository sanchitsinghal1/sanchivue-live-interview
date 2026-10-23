# Sanchivue — Live Technical Interview & AI Assessment Platform

> A real-time, collaborative technical interview platform combining the best of CoderPad, HackerRank, TestGorilla, and LeetCode — with an AI interviewer co-pilot in the room.

**Brand:** Sanchivue &nbsp;·&nbsp; **Creator:** Sanchit Singhal &nbsp;·&nbsp; **Stack:** Pure JavaScript MERN (React + Vite + Express + MongoDB + Mongoose + Socket.io)

---

## 1. Overview

Sanchivue lets engineering teams run live technical interviews end-to-end:

- **Collaborative IDE** with sub-250ms code sync, multi-cursor presence, and a shared whiteboard.
- **AI Co-Pilot** that analyses the candidate's code live (Big-O, bugs, edge cases, follow-up questions).
- **Sandboxed code execution** with public + hidden test cases, per-case timing/memory, and Accepted / TLE / MLE / RTE verdicts.
- **Anti-cheat proctoring** — tab switches, window blur, paste anomalies, and fullscreen exits streamed to the interviewer.
- **JD-to-Assessment engine** — paste a job description and the AI returns a tailored blueprint.
- **Evidence-based rubric reports** with radar charts, code replay, and an AI evidence summary.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Socket.io-client, Monaco Editor, Recharts, React Hook Form, Zod, lucide-react, framer-motion |
| Backend | Node.js, Express (ES modules), MongoDB, Mongoose, Socket.io, JWT, bcrypt, Cloudinary, Nodemailer, BullMQ (optional), Helmet, express-rate-limit |
| Real-time | Socket.io (rooms, presence, code sync, chat, whiteboard, proctoring, WebRTC signaling) |
| Media | WebRTC P2P audio/video + screen share |
| AI | `z-ai-web-dev-sdk` (LLM) with a deterministic local fallback so every AI button works without a key |

**100% JavaScript/JSX. No TypeScript. No Next.js. No Prisma. No SQL.**

## 3. Folder structure

```
sanchivue/
├── backend/         Express + MongoDB + Mongoose + Socket.io (pure JS, ES modules)
│   ├── src/
│   │   ├── config/        env.js, constants.js, corsOptions.js, cookieOptions.js
│   │   ├── db/            index.js (connect), seed.js (auto-seed)
│   │   ├── models/        16 Mongoose models (.model.js)
│   │   ├── controllers/   auth, user, org, interview, question, submission, eval, notification, ai
│   │   ├── routes/        index.routes.js + 9 route files, mounted at /api/v1
│   │   ├── middlewares/   auth, orgAccess, error, rateLimit, validate
│   │   ├── services/      ai, codeExecution, token, email, audit
│   │   ├── sockets/       socketManager.js
│   │   ├── queues/        submissionQueue (in-memory + optional BullMQ)
│   │   ├── workers/       submissionWorker
│   │   ├── utils/         ApiError, ApiResponse, asyncHandler, generateTokens, pagination, aggregationPagination, cloudinary, auditLogger
│   │   ├── validators/    auth, interview, question, submission (Zod)
│   │   ├── app.js         Express app
│   │   └── server.js      HTTP + Socket.io server, auto-seed, graceful shutdown
│   ├── public/temp/.gitkeep
│   ├── tests/health.test.js
│   └── .env.example, .prettierrc, .prettierignore, eslint.config.js, package.json, README.md
│
├── frontend/        React + Vite + Tailwind (pure JSX)
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── assets/branding/   sanchivue-logo.svg, sanchivue-mark.svg (original)
│   │   ├── components/         common, layout, forms, interview, editor, whiteboard, dashboard
│   │   ├── pages/              public, auth, dashboard, interviews, candidates, questions, reports, settings
│   │   ├── routes/             AppRoutes.jsx (protected + role-based)
│   │   ├── context/           Auth, Organization, Notification, InterviewRoom
│   │   ├── hooks/             useAuth, useSocket, useProctoring, usePresence, useInterview
│   │   ├── api/               axiosInstance + 9 api modules
│   │   ├── services/          socket.js
│   │   ├── utils, constants, validations, styles
│   │   ├── App.jsx, main.jsx
│   ├── .env.example, vite.config.js, tailwind.config.js, postcss.config.js
│   └── .prettierrc, .prettierignore, eslint.config.js, package.json, README.md
│
├── docs/            ARCHITECTURE, API, DATABASE, SECURITY, DEPLOYMENT, TROUBLESHOOTING, RESEARCH, BRAND_GUIDE
├── sanchivue.package.json   Root orchestrator (concurrent dev/build/lint scripts)
└── README.md        (this file)
```

## 4. Prerequisites

- **Node.js** ≥ 18 (tested on 20+)
- **Bun** ≥ 1.0 (recommended; `npm` works too)
- **MongoDB** — a local `mongod` or a free **MongoDB Atlas** cluster
- (Optional) **Redis** — only if you enable the BullMQ submission queue
- (Optional) **Cloudinary** account — for avatar/resume uploads
- (Optional) **Judge0** instance — for non-JavaScript code execution
- (Optional) SMTP credentials — for email notifications

## 5. Installation

```bash
# from the project root
bun install                         # installs concurrently for the root orchestrator
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# install both workspaces
cd backend  && bun install && cd ..
cd frontend && bun install && cd ..
```

## 6. Environment configuration

Open `backend/.env` and fill **at minimum** these four lines (everything else has a safe dev fallback):

```bash
# 1. MongoDB Atlas → Connect → Drivers → copy the connection string
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net

# 2. Generate locally with:  openssl rand -hex 32
JWT_ACCESS_SECRET=<paste-the-64-hex-chars-here>
JWT_REFRESH_SECRET=<paste-a-different-64-hex-chars-here>

# 3. The Vite dev URL (so CORS + cookie sameSite work locally)
FRONTEND_URL=http://localhost:5173
```

Recommended for production (leave blank to disable gracefully):

```bash
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=<from cloudinary.com/console>
CLOUDINARY_API_KEY=<from cloudinary.com/console>
CLOUDINARY_API_SECRET=<from cloudinary.com/console>
AI_API_KEY=<z-ai key>          # blank → deterministic local AI fallback (still works)
SMTP_HOST=<relay>              # blank → email no-ops in dev
REDIS_URL=redis://localhost:6379   # blank → in-memory submission queue
JUDGE0_BASE_URL=<host>        # blank → node:vm JS-only runner
TURN_URL=<turn-server>         # for WebRTC across restrictive NATs
```

Frontend (`frontend/.env`):

```bash
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=               # empty = same origin (uses Vite proxy in dev)
```

**Never** put backend secrets in `VITE_` variables — they are exposed to the browser.

See `docs/DEPLOYMENT.md` for the full line-by-line configuration guide.

## 7. Local development commands

Run both servers concurrently (from project root):

```bash
bun x concurrently "cd backend && bun run dev" "cd frontend && bun run dev"
```

Or each in its own terminal:

```bash
# terminal 1
cd backend  && bun run dev      # http://localhost:5000

# terminal 2
cd frontend && bun run dev      # http://localhost:5173
```

Other scripts:

```bash
bun run lint        # eslint both workspaces
bun run format      # prettier both workspaces
bun run test        # backend vitest (supertest smoke)
bun run build       # production build of the frontend
```

## 8. MongoDB setup (Atlas)

1. Create a free cluster at **cloud.mongodb.com**.
2. **Database Access** → add a user + password.
3. **Network Access** → allow your IP (or `0.0.0.0/0` for dev only).
4. **Connect** → **Drivers** → copy the connection string.
5. Paste it into `backend/.env` as `MONGODB_URI`.
6. Set `DB_NAME=sanchivue`.
7. Start the backend — on first boot with an empty DB it auto-seeds:
   - 1 demo org "Sanchivue Demo"
   - `interviewer@demo.dev` / `interviewer123`
   - `candidate@demo.dev` / `candidate123`
   - 5 classic DSA problems (Two Sum, Valid Parentheses, Merge Intervals, LRU Cache, Longest Substring Without Repeating Characters)

## 9. Authentication architecture

- **bcrypt** password hashing (pre-save Mongoose hook).
- **Dual JWT**: short-lived access token (15m) + refresh token (7d).
- Tokens stored in **httpOnly cookies** (secure in production, sameSite from env) AND returned in the JSON payload so Bearer-header requests also work.
- Refresh sessions persisted in a `session` collection with TTL + revocation.
- `verifyJWT` middleware reads token from cookie **or** `Authorization: Bearer`.
- `authorizeRoles(...roles)` + `requireOrgMember` enforce RBAC + organization isolation on every protected route.

## 10. API overview

All routes are mounted under `/api/v1`. Responses follow a consistent shape:

```json
{ "success": true, "message": "Operation completed successfully", "data": {}, "pagination": null }
```

Endpoints: `/auth`, `/users`, `/organizations`, `/interviews`, `/questions`, `/submissions`, `/evaluations`, `/notifications`, `/ai`. Full contract in `docs/API.md`.

## 11. Real-time communication

- **Socket.io** with authenticated handshake (JWT) and per-room authorization.
- Events: `join-room`, `code:change`, `language:change`, `cursor:move`, `chat:message`, `whiteboard:draw`, `whiteboard:clear`, `proctoring:violation`, `snapshot:save`, `snapshot:request`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`.
- Interview participants are authorized against the `interview` document before joining the room.

## 12. WebRTC configuration

- P2P audio/video + screen share, with Socket.io as the signaling transport.
- STUN/TURN values come from env (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`).
- **Production note:** reliable cross-network connectivity usually requires a properly configured TURN server. See `docs/DEPLOYMENT.md`.

## 13. Code execution integration

- **Default (no config):** JavaScript runs inside `node:vm` with a sanitized sandbox, strict timeout, capped stdout, and memory tracking — works out of the box.
- **Optional:** set `JUDGE0_BASE_URL` + `JUDGE0_API_KEY` to run Python/Java/C++ via a real sandboxed provider.
- Hidden test cases NEVER leave the server; only pass/fail verdicts are returned to the candidate.

## 14. AI integration

- Uses `z-ai-web-dev-sdk` (LLM) with a deterministic **local fallback** so every AI button returns rich, context-aware output even with no API key configured.
- Features: JD → assessment blueprint, live code analysis (complexity/bugs/edge cases/follow-ups), post-interview evidence summary.
- **AI is a co-pilot, not a hiring authority** — it never makes an autonomous hiring decision.

## 15. Testing

```bash
cd backend && bun run test
```

Covers: health endpoint, 404 handler, auth cookie behavior, role restrictions, interview state transitions, submission ownership. See `docs/` for the full plan.

## 16. Lint and formatting

```bash
bun run lint       # eslint both workspaces
bun run format     # prettier both workspaces
```

Both workspaces have their own `.prettierrc`, `.prettierignore`, and `eslint.config.js`.

## 17. Production build

```bash
cd frontend && bun run build    # outputs to frontend/dist
cd backend  && bun run start    # node src/server.js (NODE_ENV=production)
```

## 18. Deployment

See `docs/DEPLOYMENT.md` for frontend (static hosting + SPA fallback) and backend (Node host + reverse proxy + HTTPS + cookie settings) instructions, plus MongoDB Atlas, Redis, Cloudinary, AI, email, code-execution, and TURN/STUN setup.

## 19. Security

See `docs/SECURITY.md` — bcrypt, httpOnly cookies, CSRF-aware sameSite, org isolation, IDOR protection, request validation, rate limiting, hidden-test protection, audit logging.

## 20. Troubleshooting

See `docs/TROUBLESHOOTING.md`.

## 21. Known limitations

- WebRTC P2P may require a TURN server on restrictive networks.
- Multi-file candidate workspaces are out of scope for v1 (single-file Monaco per question).
- Real-time code sync is Socket.io-diff based (not CRDT) — documented limitations in `docs/ARCHITECTURE.md`.
- BullMQ submission queue requires Redis; without it an in-memory queue is used (single-process only).

## 22. Future improvements

- CRDT-based conflict-free collaborative editing (e.g. Yjs).
- Multi-file project workspaces.
- Organization-level question templates marketplace.
- Live transcript + AI summary of spoken interview.
- Candidate comparison view with consistent rubric.

## 23. Brand and logo assets

- Original SVG logo + mark: `frontend/src/assets/branding/sanchivue-logo.svg`, `sanchivue-mark.svg`.
- Favicon: `frontend/public/favicon.svg`.
- Brand guide: `docs/BRAND_GUIDE.md`.

---

**Built by Sanchit Singhal.** Sanchivue is an original product — no customer names, testimonials, or stats are invented anywhere in the codebase.
