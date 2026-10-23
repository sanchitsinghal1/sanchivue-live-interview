# Research — Sanchivue

## Research process

Before implementing Sanchivue, the following resources were reviewed to inform product design and technical decisions. This was a focused research process — not an exhaustive survey — and the implementation remains original.

## Products reviewed (public marketing + documented feature sets)

- **HackerRank Interview** — collaborative coding, multi-language execution, interview templates, candidate scorecards. Informed: question bank schema, submission history, rubric structure.
- **CodeSignal** — standardized coding environments, proctoring signals, candidate friendly UX. Informed: candidate waiting room, device readiness checks, proctoring event taxonomy (tab switch, window blur, paste anomaly, fullscreen exit).
- **CoderPad** — live collaborative IDE with multi-cursor presence. Informed: split-pane live room layout, language selector, run/submit controls.
- **TestGorilla** — JD-driven assessment generation. Informed: the JD-to-assessment blueprint feature and rubric-weight generation.
- **LeetCode** — problem bank UX, difficulty/tags filtering, public vs hidden test cases, verdicts (Accepted/WA/TLE/MLE/RTE). Informed: question model, test-case panel, submission verdicts.

No proprietary code, logos, exact page layouts, marketing copy, or assets were copied. Sanchivue's design system, branding, and codebase are original.

## Documentation consulted (official)

- **React** (react.dev) — functional components, hooks, Context API, Suspense.
- **Vite** (vitejs.dev) — dev server proxy, build, env vars (`VITE_` prefix).
- **Express** (expressjs.com) — middleware composition, routing, error handling.
- **Mongoose** (mongoosejs.com) — schemas, plugins (`mongoose-aggregate-paginate-v2`), pre-save hooks, TTL indexes.
- **Socket.io** (socket.io) — rooms, authenticated handshake, adapter for horizontal scaling.
- **WebRTC** (developer.mozilla.org + w3c.github.io/webrtc-pc) — `RTCPeerConnection`, offer/answer, ICE candidates, `getUserMedia`, screen capture (`getDisplayMedia`).
- **Monaco Editor** (microsoft.github.io/monaco-editor) — `@monaco-editor/react`, models, decorations, content widgets for collaborator cursors.
- **z-ai-web-dev-sdk** — `chat.completions.create` for the AI co-pilot and assessment generation.
- **OWASP** — authentication best practices, CSRF, secure cookies, IDOR prevention, code-execution isolation.

## Security guidance

- OWASP ASVS (Application Security Verification Standard) for cookie attributes, session management, and access-control patterns.
- Node.js `vm` module documentation — emphasised that `vm` is **not** a full security sandbox on its own; we mitigate by providing a minimal context (no `require`/`process`/`fs`) and a strict timeout. For production multi-language execution, Judge0 (containerised) is recommended and documented as the secure path.

## Patterns adopted

- **Standardized API response envelope** (`{success, message, data, pagination}`) — common across well-architected REST APIs.
- **Controller / service / model separation** — keeps Express handlers thin.
- **Dual JWT in httpOnly cookies + Bearer fallback** — balances browser-cookie security with API-client flexibility.
- **Deterministic local AI fallback** — guarantees the product is usable before paid AI keys are configured.

## Originality

- Brand name **Sanchivue** and creator **Sanchit Singhal** are used throughout. No invented customer names, testimonials, usage statistics, security certifications, or performance claims appear anywhere in the codebase or marketing copy.
- The Sanchivue logo (`sanchivue-mark.svg`, `sanchivue-logo.svg`) is an original abstract symbol (interlocking chevrons forming an "S") designed for this project.

## Brand-availability note

A formal trademark/domain registration search was not performed in this environment. Before commercial launch, run a formal trademark search (e.g. WIPO Global Brand Database, USPTO TESS) and register the `sanchivue.*` domains. This document records only that no obvious prior product named "Sanchivue" was encountered during the focused research above — it is **not** a guarantee of worldwide trademark availability.
