# Sanchivue — Technical Guide (Hindi + English)

> **Sanchivue** — Live Technical Interview & AI Assessment Platform
> **Creator:** Sanchit Singhal
> **Stack:** React + Vite + Node.js + Express + MongoDB + Mongoose + Socket.IO + WebRTC + AI

यह document पूरे project की architecture, design decisions, और advanced engineering concepts को Hindi + English mix में explain करता है — ताकि एक developer इसे padhकर समझ सके और interview में explain कर सके।

---

## 1. Project Overview — परिचय

**Sanchivue** एक live technical interview platform है जो CoderPad, HackerRank, और LeetCode की best capabilities को combine करता है। Interviewer और candidate एक real-time collaborative IDE में code लिखते हैं, AI co-pilot interviewer को assist करता है, और session के बाद एक evidence-based rubric report बनता है।

**Core features:**
- Collaborative Monaco editor (live code sync < 250ms)
- WebRTC audio/video + screen share
- Sandboxed code execution (node:vm + optional Judge0)
- AI interviewer co-pilot (complexity analysis, follow-up questions)
- Anti-cheat proctoring (tab switch, paste anomaly, fullscreen exit)
- Code replay (keystroke-level timeline)
- Structured rubric scorecard + radar chart
- Question bank with 54 questions across 16 categories
- Organization-scoped RBAC + JWT in httpOnly cookies

---

## 2. Frontend Architecture — Frontend का Design

**Technology:** React 18 + Vite + Tailwind CSS + React Router DOM + Axios + Socket.IO-client + Monaco Editor + Recharts + React Hook Form + Zod + lucide-react + framer-motion + react-hot-toast

**Folder structure:**
```
frontend/src/
├── api/              → Axios instance + per-module API wrappers
├── assets/branding/  → Sanchivue logo SVGs
├── components/        → Reusable UI (common, layout, forms, interview, editor, dashboard)
├── pages/             → Route-level pages (public, auth, dashboard, interviews, questions, reports, settings)
├── context/           → React Context (Auth, Organization, Notification, InterviewRoom)
├── hooks/             → Custom hooks (useAuth, useSocket, useProctoring, usePresence)
├── routes/            → AppRoutes.jsx (lazy-loaded + protected + role-based)
├── constants/         → Roles, statuses, rubric criteria, languages
├── validations/       → Zod schemas
├── utils/             → formatters, storage
└── styles/            → Tailwind directives + custom scrollbar
```

**Key design patterns:**
- **Lazy loading**: हर page `React.lazy()` से load होती है ताकि initial bundle छोटा रहे (LandingPage 41KB, LiveInterviewRoom 51KB — code-split per route).
- **Protected routes**: `ProtectedRoute` component `useAuth()` से check करता है; unauthenticated users को `/login?from=` पर redirect करता है। Role-based routes (`roles={['interviewer','admin']}`) extra gating करते हैं।
- **Axios interceptor with refresh**: `axiosInstance.js` में response interceptor 401 पर **एक** refresh attempt करता है; concurrent 401s एक queue में wait करते हैं (isRefreshing + failedQueue pattern) ताकि infinite loop न हो। New visitors (no token) को spurious "session expired" toast नहीं दिखता।
- **Context providers**: `AuthProvider` (top) → `OrganizationProvider` → `NotificationProvider` → `InterviewRoomProvider` → `AppRoutes`. Order important — Auth सबसे outer क्योंकि बाकी contexts `useAuth()` करते हैं।

**Responsive design:**
- Mobile-first Tailwind: `flex-col lg:flex-row` stacking, `grid-cols-2 lg:grid-cols-3`, `overflow-x-auto` on tables, `min-w-0` on flex children to prevent overflow.
- Live Interview Room: split panes mobile पर vertically stack हो जाते हैं; drag handle `hidden lg:block`; AI co-pilot full-width sheet बन जाता है।

---

## 3. Backend Architecture — Backend का Design

**Technology:** Node.js + Express (ES modules) + MongoDB + Mongoose + Socket.IO + JWT + bcrypt + Cloudinary + Nodemailer + BullMQ (optional) + Helmet + express-rate-limit + z-ai-web-dev-sdk

**Folder structure:**
```
backend/src/
├── config/           → env.js, constants.js, corsOptions.js, cookieOptions.js
├── db/               → index.js (connectDB), seed.js (auto-seed)
├── models/           → 17 Mongoose models (.model.js)
├── controllers/      → auth, user, organization, interview, question, submission, evaluation, notification, ai, template, bookmark, questionImport (.controller.js)
├── routes/           → index.routes.js + 11 route files, mounted at /api/v1
├── middlewares/      → auth (verifyJWT + authorizeRoles), orgAccess, error, rateLimit, validate, timeout
├── services/         → ai, codeExecution, token, email, audit (.service.js)
├── sockets/          → socketManager.js (Socket.IO rooms + WebRTC signaling)
├── queues/           → submissionQueue (in-memory + optional BullMQ)
├── workers/          → submissionWorker
├── utils/            → ApiError, ApiResponse, asyncHandler, generateTokens, pagination, aggregationPagination, cloudinary, auditLogger
├── validators/        → Zod schemas
├── app.js            → Express app (helmet, cors, compression, rate limit, timeout, routes, 404, error)
└── server.js         → HTTP + Socket.IO server, connectDB, auto-seed, graceful shutdown
```

**Standardized response format:**
```json
{ "success": true, "message": "...", "data": {}, "pagination": null }
```
Errors:
```json
{ "success": false, "message": "...", "errors": [], "statusCode": 400 }
```

**Key design patterns:**
- **Controller → Service → Model** layering: controllers thin रहते हैं; business logic services में; data access Mongoose models में।
- **asyncHandler wrapper**: `Promise.resolve(fn(req,res,next)).catch(next)` — हर controller को try/catch से मुक्त करता है।
- **Centralized error middleware**: `error.middleware.js` सभी errors को `{success:false, message, statusCode}` shape में format करता है; production में stack trace hide।
- **Dual JWT**: access (15m) + refresh (7d), दोनों httpOnly cookies में AND JSON response में (Bearer header भी काम करे)। Refresh sessions `Session` collection में hashed refresh token के साथ store — revocation possible।

---

## 4. Database Design — MongoDB Schema

**17 Mongoose models** — सभी org-scoped (multi-tenant isolation):

| Model | Purpose | Key indexes |
|---|---|---|
| `User` | email (unique), bcrypt password, role enum | email unique |
| `Organization` | name, slug (unique), ownerId | slug unique |
| `OrganizationMember` | orgId, userId, role, status | compound unique `(orgId, userId)` |
| `Invitation` | orgId, email, high-entropy token, role, expiresAt | token, expiresAt TTL |
| `Session` | userId, refreshTokenHash, expiresAt | userId, expiresAt TTL (revocation) |
| `Interview` | orgId, title, candidateUserId, interviewerIds[], questionIds[], status, roomCode (unique), proctoringLogs[], chatLog[], snapshots[] | compound `(orgId, status, scheduledAt)`; roomCode unique |
| `InterviewTemplate` | reusable question sets + rubric | orgId |
| `Question` | orgId, title, slug, difficulty, tags[], statement, starterCode{}, publicTests[], hiddenTests[], hints[], isArchived | compound unique `(orgId, slug)`; `(orgId, tags)`; `(orgId, title)` text |
| `TestCase` | questionId, input, expectedOutput, isHidden, weight | questionId |
| `Submission` | candidateId, interviewId, questionId, code, language, status, passedCount, totalCount, score, executionTimeMs, memoryKb | compound `(candidateId, questionId)` |
| `CodeSnapshot` | interviewId, code, language, eventType, timestamp | interviewId |
| `InterviewNote` | interviewId, authorId, questionId, content, isPrivate | interviewId |
| `Evaluation` | interviewId (unique), rubricScores{}, aiSummary, recommendation enum | interviewId unique |
| `Notification` | userId, type, title, body, read, meta | userId |
| `AuditLog` | action, actorId, targetType, targetId, meta, ip | createdAt TTL (90d) |
| `AiInteraction` | interviewId, userId, kind, prompt, response, model | interviewId |
| `Bookmark` | userId, questionId, orgId | compound unique `(userId, questionId)` |

**Multi-tenant isolation:** हर org-scoped query `req.orgId` (server-derived from `req.membership`) से filter होती है — कभी client-supplied orgId से नहीं। यह IDOR (Insecure Direct Object Reference) को prevent करता है।

**Pagination:** `mongoose-aggregate-paginate-v2` plugin + custom `aggregatePaginate` utility (`$facet` for data + totalCount)। Dashboard, question bank, submissions सभी server-side paginated हैं।

---

## 5. Authentication & Security

**Flow:**
1. **Register/Login** → bcrypt verify → `generateAccessAndRefreshTokens(userId)` → access JWT (15m) + refresh JWT (7d) → `Session` collection में **hashed** refresh token store → दोनों tokens httpOnly cookies में set AND JSON response में return।
2. **Every request** → `verifyJWT` middleware cookie या `Authorization: Bearer` header से access token पढ़ता है → verify → `req.user` set।
3. **authorizeRoles(...roles)** → RBAC check।
4. **requireOrgMember** → `OrganizationMember.exists({orgId, userId, status:'ACTIVE'})` → `req.membership` set।
5. **Token expiry** → frontend interceptor 401 पर **एक** `/auth/refresh` call करता है → नया access token → original request retry।
6. **Logout** → `Session.deleteOne({refreshTokenHash})` + cookie clear।

**Security controls:**
- **bcrypt** password hashing (cost 10, pre-save Mongoose hook) — plaintext कभी store नहीं होता।
- **httpOnly + secure + sameSite** cookies — XSS से token steal नहीं हो सकता।
- **Helmet** security headers (CSP, HSTS, X-Frame-Options)।
- **express-rate-limit** — auth (5/min), submissions (30/min), AI (10/min), global (600/min)।
- **Request timeout middleware** — 30s deadline; slow requests को abort करके mongoose connection release।
- **Input validation** — हर create/update पर Zod schema validate।
- **Hidden test protection** — `listQuestions` controller `hiddenTests` को projection से strip करता है; candidates कभी raw hidden tests नहीं देखते।
- **Audit logging** — privileged actions (org invite, role change, interview state transition) `AuditLog` collection में log होते हैं।

---

## 6. Real-Time Communication — Socket.IO + WebRTC

**Socket.IO server** (`backend/src/sockets/socketManager.js`):
- Authenticated handshake (JWT from `socket.handshake.auth.token`) — unauthorized sockets reject हो जाते हैं।
- Per-room authorization: join से पहले verify कि user उस interview का participant है।
- Events: `join-room`, `code:change`, `language:change`, `cursor:move`, `chat:message`, `whiteboard:draw`, `whiteboard:clear`, `proctoring:violation`, `snapshot:save`, `snapshot:request`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`।
- In-memory presence map + per-room snapshot buffer (capped 200)।
- Proctoring/chat/snapshots throttled-write से interview document में persist।

**WebRTC** (frontend `components/interview/VideoCallGrid.jsx`):
- `getUserMedia` से camera/mic access।
- `RTCPeerConnection` per remote participant — offer/answer exchange + trickle ICE।
- Signaling Socket.IO से relay होता है (`webrtc:offer/answer/ice-candidate` events)।
- Mute/cam toggle + screen share (`getDisplayMedia`) via `replaceTrack` per sender।
- STUN/TURN env vars से (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`)। Production में restrictive NATs पर TURN आवश्यक।

**Horizontal scaling note:** multi-instance deployment के लिए `@socket.io/redis-adapter` + Redis चाहिए — ताकि socket instance A पर emit किया event instance B के sockets तक भी पहुँचे। Single-instance Render इसके बिना काम करता है।

---

## 7. Code Execution & Sandbox Isolation

**`backend/src/services/codeExecution.service.js`** — candidate code कभी भी Express process में directly नहीं चलता।

**JavaScript execution** (default, out-of-the-box):
- `node:vm.createContext()` से एक **stripped sandbox** बनता है — सिर्फ safe globals (`Math`, `JSON`, `Map`, `Set`, `Date`, `parseInt`, etc.)। **No `require`, no `process`, no `fs`, no `child_process`, no network access।**
- `vm.runInContext({ timeout: timeLimitMs })` — strict timeout; TLE verdict।
- Capped stdout (256KB) — memory bombs prevent।
- Heap delta memory tracking (`process.memoryUsage().heapUsed` before/after) — MLE verdict।
- Per-test verdicts: ACCEPTED / Wrong Answer / TLE / MLE / Runtime Error।

**Python/Java/C++ execution** (optional):
- Host पर toolchain हो तो `child_process.execFileSync` temp directory में।
- या configured **Judge0** instance (`JUDGE0_BASE_URL`) via REST adapter।
- Hidden tests server-side ही evaluate होते हैं — कभी client को raw नहीं भेजे जाते।

---

## 8. AI Integration

**`backend/src/services/ai.service.js`** — `z-ai-web-dev-sdk` का use करता है:
```js
import ZAI from 'z-ai-web-dev-sdk';
const zai = await ZAI.create();
const completion = await zai.chat.completions.create({ messages, thinking: { type: 'disabled' } });
```

**Three AI capabilities:**
1. **JD → Assessment Blueprint** (`generateAssessmentFromJD`) — JD paste करो → AI returns recommended topics + 3 tailored questions + rubric weights।
2. **Live AI Co-Pilot** (`analyzeCandidateCode`) — candidate का current code analyze करके complexity (Big-O), potential bugs, edge cases, follow-up questions return करता है। Interviewer-only — candidate कभी नहीं देखता।
3. **Evidence Summary** (`generateEvaluationSummary`) — rubric + proctoring logs + passedRatio से evidence-based summary generate करता है। AI कभी autonomous hiring decision नहीं लेता — human-in-the-loop।
4. **AI Question Generation** (`generateQuestion`) — topic + difficulty + type देकर एक structured question generate करता है (strict JSON output + validation + duplicate detection via slug)।

**Deterministic local fallback:** अगर LLM unavailable है या API key नहीं है, तो हर function एक heuristic local analyzer से rich output return करता है — ताकि UI buttons कभी empty न लौटाएं।

**Usage limits:** `aiLimiter` (10/min) लगा है। AI interactions `AiInteraction` collection में log होते हैं (audit)।

---

## 9. Caching, Queues, Scalability

**Compression:** `compression({threshold:1024})` — सभी JSON responses gzip/brotli होते हैं; list endpoints पर bandwidth आधी।

**MongoDB connection pool** (`db/index.js`):
- `maxPoolSize: 25` (default 5 बहुत छोटा high-concurrency के लिए)
- `minPoolSize: 5` — warm connections तैयार रखता है
- `heartbeatFrequencyMS: 10000` — stale connections detect + recycle
- `bufferCommands: false` — DB disconnect पर fail-fast (indefinite buffering नहीं)

**Submission queue** (`queues/submissionQueue.js`):
- In-memory concurrency queue (default; single-process)
- Optional **BullMQ + Redis** (`REDIS_URL` set हो तो) — multi-instance horizontal scaling के लिए

**Health/Readiness probes:**
- `/health` — liveness (process alive, no DB dependency) — load balancer liveness probe
- `/ready` — readiness (returns 503 जब DB disconnected) — k8s readiness probe ताकि DB-losing instance traffic न ले

**Graceful shutdown:** `SIGTERM`/`SIGINT` पर HTTP server close → mongoose disconnect → process exit। Zero-downtime deploy के लिए essential।

**Load test results** (`backend/tests/loadtest.mjs`, autocannon, single process):
- `/health`: 10,877 req/s avg, p50=11ms, p99=61ms, 0 errors
- `/ready`: 11,810 req/s avg, p50=6ms, p99=34ms, 0 errors
- `/register`: 8,236 req/s avg, p50=4ms, p99=32ms, 0 errors

**Honest note:** ये numbers single-process के हैं। 100k concurrent users के लिए horizontal scaling (N replicas + sized Atlas cluster + Redis Socket.io adapter + TURN farm) चाहिए।

---

## 10. Cloudinary Uploads

**`backend/src/utils/cloudinary.js`** — `uploadOnCloudinary(localPath)` + `deleteFromCloudinary(publicId)`:
- Multer `public/temp/` में file save करता है → Cloudinary पर upload → local temp file `fs.unlinkSync` से delete।
- अगर `CLOUDINARY_CLOUD_NAME` set नहीं है, `null` gracefully return — बाकी app काम करती है।

**Endpoints:** `POST /users/me/avatar` (multipart `avatar`), `POST /users/me/resume` (multipart `resume`)। Frontend `ProfilePage.jsx` में file picker से wired।

**Free-plan limits:** 25 GB storage + 25 GB/month bandwidth — avatars + PDF resumes के लिए plenty।

---

## 11. Local Setup

```bash
# 1. Clone + install
git clone <repo> sanchivue && cd sanchivue
cd backend  && bun install && cd ..
cd frontend && bun install && cd ..

# 2. Configure env
cp backend/.env.example  backend/.env      # fill MONGODB_URI, JWT secrets, FRONTEND_URL
cp frontend/.env.example frontend/.env     # VITE_API_URL (defaults work for local)

# 3. Start MongoDB (local or Atlas)
mongod --dbpath ./data    # or use Atlas connection string

# 4. Run both (two terminals)
cd backend  && bun run dev    # http://localhost:5000
cd frontend && bun run dev    # http://localhost:5173

# 5. First boot auto-seeds: interviewer@demo.dev / interviewer123
```

---

## 12. Vercel + Render Deployment

**Frontend → Vercel:**
- Root Directory: `frontend`
- Build: `bun run build`, Output: `dist`
- Env: `VITE_API_URL=https://your-backend.onrender.com/api/v1`, `VITE_SOCKET_URL=https://your-backend.onrender.com`

**Backend → Render:**
- Blueprint: repo root का `render.yaml` read करता है
- Start: `node src/server.js`, Health: `/ready`
- Env vars: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `COOKIE_SAME_SITE=none`, + optional Cloudinary/AI/Redis/TURN

Full steps: `docs/DEPLOYMENT.md`

---

## 13. What makes this more than a basic MERN CRUD app?

यह project एक typical CRUD application से कहीं ज्यादा advanced है। Real engineering challenges:

1. **Real-time collaboration** — Socket.IO rooms + multi-cursor presence + WebRTC P2P signaling (offer/answer/ICE relay)। यह simple REST CRUD नहीं; stateful bidirectional communication है।
2. **Sandboxed code execution** — candidate code कभी Express process में नहीं चलता; `node:vm` isolated context + strict timeout + capped stdout + memory tracking + per-test verdicts। Security-critical untrusted code handling।
3. **AI integration with fallback** — LLM call + strict JSON validation + deterministic local heuristic analyzer ताकि AI buttons बिना API key के भी rich output दें। Production resilience pattern।
4. **Multi-tenant data isolation** — हर query org-scoped; IDOR prevention via server-derived orgId।
5. **Dual JWT + refresh rotation** — httpOnly cookies + Bearer header + refresh session revocation।
6. **Code replay / time-travel** — keystroke snapshots + timeline scrubber।
7. **Proctoring telemetry** — browser event listeners (visibility/blur/paste/fullscreen) → real-time socket stream + persisted log।
8. **Production scalability** — connection pooling, compression, rate limiting, request timeouts, health/readiness probes, graceful shutdown, BullMQ-ready queue, load-test characterized।
9. **Evidence-based evaluation** — structured rubric + radar chart + AI summary that distinguishes observed facts from inference; human-in-the-loop hiring decision।
10. **54-question bank across 16 categories** — not a hardcoded array; MongoDB-backed, indexed, paginated, with bookmarks + import/export + AI generation।

ये सब genuine engineering challenges हैं जो एक basic MERN CRUD app में नहीं मिलते।

---

**Built by Sanchit Singhal.** Original product — no fabricated credentials, customers, or benchmarks.
