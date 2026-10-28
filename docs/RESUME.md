# Sanchit Singhal — Resume (Sanchivue Project)

> ATS-friendly resume content for a **Software Development Engineer / Software Engineer** role.
> Project: **Sanchivue — Live Technical Interview & AI Assessment Platform**
> This is resume-ready content based strictly on the verified implementation. No fabricated metrics, users, or business impact.

---

## Project Heading (for resume)

### **Sanchivue — Live Technical Interview & AI Assessment Platform**
*(React, Node.js, Express, MongoDB, Mongoose, Socket.IO, WebRTC, Monaco Editor, AI Integration)*

**Solo-built full-stack platform** for conducting live technical interviews with a collaborative IDE, AI interviewer co-pilot, sandboxed code execution, anti-cheat proctoring, and evidence-based rubric reports.

---

## Resume Bullets (technically specific, evidence-backed)

- **Architected and built** a real-time collaborative interview platform on the MERN stack (React + Vite frontend, Node.js + Express + MongoDB backend) with role-based access control (interviewer / candidate / admin), JWT auth in httpOnly cookies with refresh-token rotation, and multi-tenant (organization-scoped) data isolation preventing IDOR across tenants.

- **Implemented real-time collaboration** via Socket.IO with authenticated room authorization — live code synchronization with multi-cursor presence, shared whiteboard (HTML5 canvas with pen/shapes/lines synced over sockets), persisted chat, and WebRTC peer-to-peer audio/video with offer/answer/ICE-candidate signaling relayed over Socket.IO; mute/camera toggle and screen share via `replaceTrack`.

- **Built a secure code-execution engine** that runs candidate JavaScript inside a hardened `node:vm` sandbox (stripped globals — no `require`/`process`/`fs`/network), with strict per-test timeouts, capped stdout (256 KB), and heap-delta memory tracking — returning per-test verdicts (Accepted / Wrong Answer / TLE / MLE / Runtime Error); optional Judge0 adapter for Python/Java/C++; hidden test cases evaluated server-side only and never serialized to the client.

- **Integrated an AI interviewer co-pilot** via the z-ai-web-dev-sdk LLM with strict JSON-output validation and a deterministic local heuristic fallback so every AI button (JD→assessment blueprint, live complexity/bug/edge-case analysis, follow-up question generation, evidence-based evaluation summary) returns rich output even without an API key — with rate limiting and audit logging of every AI interaction; AI explicitly assists the interviewer and never makes autonomous hiring decisions.

- **Designed a 17-model MongoDB schema** with compound unique indexes (e.g. `(orgId, slug)` for questions, `(userId, questionId)` for bookmarks), TTL indexes for session/invitation/audit-log expiry, Mongoose aggregation pipelines with `$facet`-based server-side pagination, and a 54-question seed library across 16 categories (DSA, JavaScript, React, Node.js, Express, MongoDB, REST, Authentication, Debugging, Testing, System Design, Scalability, Security, Architecture, Behavioral, Project-based).

- **Implemented anti-cheat proctoring** that attaches browser event listeners (visibilitychange, window blur, large paste, fullscreen exit) on the candidate side, streams violations over Socket.IO to the interviewer's live feed, and persists them with severity levels; paired with keystroke-level code-replay snapshots (every 15 s + on Run/Submit) scrubable via a timeline player in the evaluation report.

- **Engineered production-readiness features**: gzip/brotli response compression, MongoDB connection-pool tuning (`maxPoolSize` 25, heartbeat, `bufferCommands: false` for fail-fast), per-request 30 s timeout middleware, distinct `/health` (liveness) and `/ready` (DB-gated readiness) endpoints, Helmet security headers, express-rate-limit on auth/submissions/AI, graceful shutdown on SIGTERM, and an in-memory submission queue with optional BullMQ + Redis for horizontal scaling.

- **Load-tested the backend** (autocannon) measuring single-process throughput of ~10,800 req/s on `/health` (p50=11 ms, p99=61 ms, 0 errors) and ~8,200 req/s on auth register — characterizing HTTP-layer headroom and documenting the horizontal-scaling path (N replicas + sized MongoDB Atlas cluster + Redis Socket.IO adapter + TURN farm) for higher concurrency.

- **Deployed** the frontend to Vercel (Vite SPA with rewrites for client-side routing) and the backend to Render (Node.js web service with `/ready` health check), with cross-origin httpOnly JWT cookies (`sameSite=none`, secure) and Cloudinary free-tier integration for avatar/resume uploads with graceful null fallback.

- **Authored full documentation**: 9 docs files (Architecture, API, Database, Security, Deployment, Troubleshooting, Research, Brand Guide, Technical Guide in Hindi + English), environment-variable setup guides, and a comprehensive README — plus a Hindi + English technical guide explaining MERN architecture, real-time collaboration, sandbox isolation, AI integration, scalability techniques, and what distinguishes the project from a basic CRUD app.

---

## Skills demonstrated (verified by the codebase)

**Frontend:** React 18, Vite, Tailwind CSS, React Router DOM, Axios (with 401-refresh interceptor), Socket.IO-client, Monaco Editor, Recharts, React Hook Form, Zod, lucide-react, framer-motion, react-hot-toast, lazy-loaded code-split routes, responsive mobile-first design.

**Backend:** Node.js, Express (ES modules), MongoDB, Mongoose (17 models, compound + TTL indexes, aggregation pipelines), Socket.IO (authenticated rooms, WebRTC signaling relay), JWT (access + refresh, httpOnly cookies, refresh rotation), bcrypt, Cloudinary (uploads with local cleanup), Nodemailer, BullMQ (optional queue), Helmet, express-rate-limit, compression, request-timeout middleware, centralized error handling, Zod validation.

**Real-time & Media:** Socket.IO event design (code sync, presence cursors, chat, whiteboard, proctoring, snapshots), WebRTC P2P (getUserMedia, RTCPeerConnection, ICE trickle, screen share via replaceTrack).

**Security:** Multi-tenant data isolation, RBAC, IDOR prevention, sandboxed untrusted-code execution (node:vm with stripped globals + timeout + stdout cap + memory tracking), hidden-test protection, audit logging, CSRF-aware sameSite cookies, rate limiting, security headers.

**DevOps & Production:** Vercel + Render deployment, MongoDB Atlas, health/readiness probes, graceful shutdown, load testing (autocannon), connection-pool tuning, compression, `.env.example` documentation.

**AI Engineering:** LLM integration (z-ai-web-dev-sdk), strict JSON-output prompting, structured-output validation, deterministic local fallback, rate limiting, audit logging, human-in-the-loop design (AI assists, never decides).

---

## What makes this project more advanced than a basic MERN CRUD app

1. **Stateful real-time collaboration** (Socket.IO rooms + multi-cursor + WebRTC P2P) — not request/response CRUD.
2. **Secure sandboxed code execution** of untrusted candidate code (node:vm isolation + timeout + memory caps) — a security-critical workload absent from CRUD apps.
3. **AI integration with graceful degradation** (LLM + deterministic local fallback + structured-output validation + audit logging) — production AI resilience, not a toy call.
4. **Multi-tenant data isolation** with server-derived org scoping (IDOR prevention) — not a flat single-user data model.
5. **Dual-JWT auth with refresh rotation + revocation** — not a single stateless token.
6. **Keystroke-level code replay** + timeline scrubber — time-series snapshot storage and playback.
7. **Browser-event proctoring telemetry** streamed in real time — not a server-only log.
8. **Production scalability engineering**: connection pooling, compression, rate limiting, request timeouts, distinct liveness/readiness probes, graceful shutdown, BullMQ-ready queue, load-test characterized.
9. **Evidence-based evaluation** (rubric + radar + AI summary distinguishing facts from inference + human-in-the-loop) — not a simple numeric score.
10. **54-question indexed library across 16 categories** with bookmarks, import/export, and AI generation — not a hardcoded array.

---

*All technical claims above are verifiable against the project source code. No fabricated users, performance benchmarks, feature-completion percentages, or business impact metrics have been invented. Load-test numbers reflect a single-process measurement on localhost, not a production deployment.*
