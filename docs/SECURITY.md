# Security — Sanchivue

## Authentication & sessions

- **bcrypt** password hashing (cost 10) in a Mongoose pre-save hook. Plain-text passwords are never stored or logged.
- **Dual JWT**: 15-minute access token + 7-day refresh token. Both stored in **httpOnly cookies** (`httpOnly`, `secure` in production, `sameSite` from env, optional `domain`).
- Refresh sessions persisted in the `session` collection with the **hashed** refresh token, a TTL, and revocation support — so a stolen refresh token can be invalidated.
- `verifyJWT` reads the token from the cookie **or** the `Authorization: Bearer` header.
- Logout revokes the refresh session and clears the cookie.

## Authorization

- `authorizeRoles(...roles)` gates every protected endpoint.
- `requireOrgMember` verifies the user belongs to the target org (via the `organizationMember` collection) and sets `req.membership`. **All org-scoped queries filter by the server-derived `orgId`** — never a client-supplied id — preventing IDOR.

## CSRF

- Cookies use `sameSite=lax` by default (configurable). For same-origin browser + API deployments, this mitigates CSRF.
- For cross-origin cookie deployments, document the need for a CSRF token (double-submit or synchronizer token). CORS is **not** CSRF protection.

## Request validation & rate limiting

- Zod schemas validate every auth/interview/question/submission request body.
- `express-rate-limit` caps auth attempts (5/min) and submissions (30/min per user).
- Request body-size limits enforced (`express.json({ limit: '1mb' })`).

## Security headers & CORS

- `helmet` sets CSP, HSTS, X-Frame-Options, etc.
- CORS origin is restricted to `FRONTEND_URL` (configurable). Credentials allowed.

## Code execution isolation

- Candidate JavaScript runs in `node:vm.createContext` with a **sanitized sandbox** — no `require`, `process`, `fs`, `child_process`, or network access.
- Strict `timeout`, capped stdout (256KB), and memory tracking.
- Python/Java/C++ run via `child_process` in a temp dir (if the toolchain is present) **or** via Judge0 when configured.
- **Hidden test cases never leave the server** — only pass/fail verdicts are returned.
- Submitted code can never read application secrets, env vars, or the database.

## Hidden-test & reference-solution protection

- `question.controller.js` projects `hiddenTests` out of responses for candidates.
- Reference solutions are not stored in the question document in v1; if added later, they must be interviewer-only.

## File uploads

- `multer` saves to `public/temp/` with file-type + size validation, then uploads to **Cloudinary**, then deletes the local temp file (`fs.unlinkSync`).
- Upload authorization requires an authenticated session + ownership checks.

## Secrets management

- All secrets live in `backend/.env` (git-ignored). `.env.example` is committed with empty values + English comments.
- **Never** place backend secrets in `VITE_` variables.
- Stack traces are not leaked to clients in production (`NODE_ENV=production`).

## Audit logging

- `auditLogger.js` records privileged actions (org invite, role change, interview state transition, evaluation upsert) to the `auditLog` collection with actor, target, IP, and meta.

## Data retention

- `session` and `invitation` TTL indexes auto-expire.
- `auditLog` expires after 90 days.
- Per-interview proctoring/chat capped at 500 entries; snapshots at 300.

## Known limitations

- CSRF: same-origin deployments are covered by `sameSite=lax`; cross-origin cookie deployments need an explicit CSRF token (documented).
- Self-hosted code execution (Python/Java/C++) needs host hardening; a basic container is not a sufficient security boundary for hostile code — prefer Judge0 for production multi-language execution.
