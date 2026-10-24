# Architecture — Sanchivue

## High-level diagram

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Frontend (React + Vite)    │        │  Backend (Express + MongoDB)│
│  http://localhost:5173       │        │  http://localhost:5000        │
│                              │ HTTPS  │                              │
│  - React Router DOM          │ ──────▶│  /api/v1/*  (REST)           │
│  - Axios (withCredentials)  │  JSON  │  - helmet, cors, rate-limit  │
│  - AuthContext (JWT cookie)  │        │  - cookieParser, json        │
│  - Socket.io-client ─────────┼──┐     │                              │
│  - Monaco editor             │  │     │  Socket.io (path /)          │
│  - WebRTC (P2P)              │  └────▶│  - authenticated handshake   │
│                              │        │  - per-room authorization    │
└──────────────────────────────┘        │                              │
                                        │  Services:                   │
                                        │  - ai.service (z-ai-sdk +    │
                                        │    local fallback)           │
                                        │  - codeExecution (node:vm /  │
                                        │    Judge0)                   │
                                        │  - token, email, audit       │
                                        │                              │
                                        │  Mongoose models (16)        │
                                        │  MongoDB (Atlas or local)    │
                                        └──────────────────────────────┘
```

## Request lifecycle

1. Browser sends a request with `withCredentials:true`.
2. Axios interceptor attaches `Authorization: Bearer <accessToken>` if present.
3. Express `verifyJWT` middleware reads the cookie **or** the Bearer header, verifies the JWT, loads the user, and sets `req.user`.
4. `authorizeRoles` / `requireOrgMember` enforce RBAC + org isolation.
5. The controller calls a service / Mongoose model, returns a standardized `ApiResponse`.
6. On error, the central `error.middleware.js` formats `{success:false, message, errors, statusCode}`.

## Real-time collaboration

Socket.io rooms are keyed by `interview.roomCode`. The server verifies the joining socket's JWT and that the user is a participant of the interview before letting them into the room. Events are documented in `docs/API.md`.

Code sync uses **diff-broadcast over Socket.io** (not a CRDT). This is intentionally simple and works well for a 1:1 interview; limitations (last-writer-wins on concurrent edits at the same position) are documented. Snapshots are persisted every 15s + on Run/Submit for the code-replay timeline.

## Code execution isolation

Candidate JavaScript runs inside `node:vm.createContext` with:

- A minimal sandbox (only `Math`, `JSON`, `Map`, `Set`, `Date`, etc. — no `require`, no `process`, no `fs`).
- A `timeout` matching the question's `timeLimitMs`.
- A capped stdout buffer (256KB) to prevent memory bombs.
- Memory tracking via `process.memoryUsage().rss`.

Python/Java/C++ are routed through `child_process.execFileSync` in a temp directory if the toolchain is present, or through a configured **Judge0** instance when `JUDGE0_BASE_URL` is set. Hidden test cases are evaluated server-side only — their inputs/expected outputs never reach the browser.

## AI integration

`ai.service.js` calls `z-ai-web-dev-sdk`'s `chat.completions.create`. If the SDK is unavailable or returns no content, a deterministic **local heuristic analyzer** produces rich, context-aware output (Big-O detection by AST-free pattern matching, a fixed question bank for JD blueprints, rubric-based evidence summaries). This guarantees every AI button in the UI returns useful output even before the user configures an API key.

## Scalability notes

- Mongoose compound indexes on `(orgId, status, scheduledAt)` and `(candidateId, questionId)` for the hot paths.
- `mongoose-aggregate-paginate-v2` for server-side search/filter/pagination.
- Socket.io rooms are isolated per interview; no cross-room leakage.
- Submission queue: in-memory by default; switch to **BullMQ + Redis** for multi-instance horizontal scaling (set `REDIS_URL`). When scaling Socket.io horizontally, add the `@socket.io/redis-adapter`.
