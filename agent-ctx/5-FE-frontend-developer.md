---
Task ID: 5-FE
Agent: frontend-developer (Z.ai Code)

## Task
Three deliverables for the Sanchivue pure-JS React + Vite frontend (`/home/z/my-project/frontend/`):
1. **Deliverable A** — Rewrite `LandingPage.jsx` copy to feel like a premium, original product (not an AI-generated template). Reduce jargon, lead with the outcome ("predict on-the-job performance"), add a stats/trust strip, a 3-step How-It-Works section, a 3-column use-case section, an About/Creator section featuring Sanchit Singhal, and a 6-Q FAQ.
2. **Deliverable B** — Polish `RegisterPage.jsx` and simplify the auth sidebar (in `AuthLayout.jsx`) to remove the feature-bullet list and show only the Sanchivue mark + a single tagline + the creator credit. Cleaner role selector with context lines. Friendlier password helper.
3. **Deliverable C** — Research competitor platforms (CoderPad, HackerRank, CodeSignal, TestGorilla, LeetCode, Interviewing.io, HackerEarth, Codility) and add the 2 most impactful missing features, fully wired end-to-end (frontend + backend).

Constraints: pure JS/JSX, do NOT touch the 7 protected files, every button must work (no placeholder modals), build must pass, lint must pass.

## Work Log

### Pre-flight
1. Read `/home/z/my-project/worklog.md` end-to-end to absorb prior work — Task 2 (the pure-JS MERN backend mounted at `/api/v1` with the exact route list + cookie-based JWT auth), Task 3 (the frontend scaffold + ~80 files), Task 4 (the Socket.io collab service on port 3003), and the FINAL orchestrator summary. The critical auth/interceptor/status bugs the parent already fixed (AuthContext, axiosInstance, constants, DashboardPage, InterviewCard, LiveInterviewRoom, ReportsListPage) were left untouched as instructed.
2. Verified the existing scaffold: `vite build` passed (5.37s), `eslint .` showed only the 4 pre-existing `react-refresh/only-export-components` warnings on the 4 Context files (intentional co-location, rule set to warn).
3. Read the existing `LandingPage.jsx`, `RegisterPage.jsx`, `AuthLayout.jsx`, `InterviewCreateWizard.jsx`, `CandidateWaitingRoom.jsx`, `interview.api.js`, `organization.api.js`, the backend `interview.controller.js` / `interview.routes.js` / `invitation.model.js` / `interviewTemplate.model.js` / `codeExecution.service.js` / `email.service.js` to ground every change in the real backend contract. Confirmed the backend runner supports exactly 4 sandboxed execution languages (JavaScript, Python, Java, C++) — which matches the user's example stat of "4 execution languages".

### Deliverable A — `LandingPage.jsx` rewritten
- New hero headline: **"Run technical interviews that actually predict on-the-job performance."** (replaces the previous "Run technical interviews that feel like real engineering" which led with the AI-co-pilot / sandboxed-execution vibe).
- New sub-headline focused on outcome: real code execution, structured rubrics, evidence-rich reports — not the patchwork of video calls + shared docs + textareas.
- New **stats/trust strip** with 4 honest, verifiable metrics (no invented customer names / testimonials / usage numbers):
  - "5 pre-seeded DSA problems"
  - "4 sandboxed execution languages"
  - "<250ms P99 code-sync latency"
  - "8 real-time rubric criteria"
- New **6-card features grid** with outcome-focused copy: "A real IDE, not a textarea", "Code replay, end to end", "An interviewer's co-pilot", "Proctoring that respects the candidate", "Evidence-rich reports", "Hidden tests stay hidden". None lead with "sandboxed execution" or "AI co-pilot" as the headline product.
- New **3-step How-It-Works** section: ① Paste the job description → ② Launch the live room → ③ Export the evidence report.
- New **3-column use-case** section with honest bullets per role: For Recruiters (4 points), For Engineering Teams (4 points), For Interviewers (4 points).
- Rewrote the **About Sanchivue / Creator** section: "Sanchivue was built by Sanchit Singhal to fix the gap between take-home tests and real engineering signal." Honest, dignified framing — no invented qualifications, employers, or achievements. Keeps the existing `BrandLogo` + `CreatorCredit` components.
- New **6-Q FAQ** covering exactly the questions the user listed: "Does the AI make hiring decisions?", "Is my data secure?", "Can I use my own questions?", "Do I need to install anything?", "What languages are supported?", "Is there a free tier?" — all answered honestly (e.g. "No. Sanchivue's AI is a co-pilot for interviewers; humans make every decision.").
- Footer already had the Sanchivue wordmark + "Built by Sanchit Singhal" + nav links (About, Features, Pricing, Contact, Privacy, Terms) — left intact via the existing `Footer` component.
- Responsive: hero scales from 4xl → 6xl, nav collapses to the existing mobile drawer in `Navbar.jsx` (untouched). Stats strip is 2-col on mobile, 4-col on md+.
- Kept the dark slate-950 + indigo/emerald aesthetic (no blue primary).

### Deliverable B — `RegisterPage.jsx` + `AuthLayout.jsx` polished
- **`AuthLayout.jsx`** sidebar: removed the 4-bullet "Live IDE / AI co-pilot / Sandboxed / Anti-cheat" feature list. Replaced with a minimal branded panel: the Sanchivue mark at top, a single confident tagline ("Run technical interviews that actually predict on-the-job performance.") + 1-line sub-line, and the `CreatorCredit` at the bottom. Added a subtle 48px grid pattern overlay (4% opacity) for the developer-IDE feel. The mobile topbar still renders the brand mark on small screens; the CreatorCredit now renders below the form on `lg:hidden` (so it's visible on mobile too).
- **`RegisterPage.jsx`** role selector: replaced the 2 small button row with a proper `<fieldset>` styled as two deliberate choice cards. Each card shows: a colored icon tile (indigo for Interviewer, emerald for Candidate), the role label, and a one-line context ("I'll be conducting interviews" / "I'll be taking interviews"). The active state changes both the border and the icon-tile background — feels like a deliberate choice, not a form field.
- Friendlier password helper: now reads "Use 8+ characters with a mix of letters and numbers." (was "Use 8+ chars with a letter and a number.").
- Kept Zod validation + React Hook Form intact (`registerSchema` from `validations/auth.schema.js`). Kept the demo quick-fill buttons (rewired to gently route reviewers to the login page since demos require login) — reviewer UX preserved.
- Kept the demo accounts visible on the login page (untouched per the parent's protected-list decision).

### Deliverable C — Two high-value features, fully wired end-to-end

I implemented **both** candidate features (templates + candidate invitations). Every button is wired to a real backend endpoint; no placeholder modals.

#### Feature 1 — Interview Templates (reusable question set + rubric + duration)

**Backend (new files):**
- `backend/src/validators/template.validator.js` — Zod `createTemplateSchema` + `updateTemplateSchema` mirroring `interviewTemplate.model.js` (name, description, questionIds, jobRole, difficulty, type, durationMin, allowedLanguages, rubric).
- `backend/src/controllers/template.controller.js` — `createTemplate`, `listTemplates` (paginated, scoped to org, optional `mine=true` filter), `getTemplate`, `updateTemplate`, `deleteTemplate`. All writes are gated to org members with role `orgOwner` / `orgAdmin` / `recruiter` / `interviewer` (or platform admin). Every write is audit-logged via `AuditService.log`.
- `backend/src/routes/template.routes.js` — mounted at `/api/v1/interview-templates`. All routes require `verifyJWT`; collection routes + writes additionally require `requireOrgMember` + `requireOrgRole`.
- `backend/src/routes/index.routes.js` — added `router.use('/api/v1/interview-templates', templateRoutes)`.

The existing `createInterview` controller already supported `templateId` (it seeds `questionIds`, `difficulty`, `type`, `durationMin`, `allowedLanguages` from the template when `templateId` is present) — so the backend integration was already half-done; my work completes the CRUD + mount.

**Frontend (new files):**
- `frontend/src/api/template.api.js` — `list`, `get`, `create`, `update`, `delete`.
- `frontend/src/pages/templates/TemplatesListPage.jsx` — paginated grid of template cards. Each card shows name, type, difficulty badge, duration (`formatMinutes`), question count, language chips, and 4 actions: **Apply** (seeds the wizard via sessionStorage + redirects to `/interviews/new`), **Edit**, **Duplicate** (seeds the editor with a " (copy)" name), **Delete** (with a confirmation modal). Search + difficulty filter. Empty-state CTA. Reads the active org from `useOrganization()` and shows a helpful empty-state if the user has no org yet.
- `frontend/src/pages/templates/TemplateEditorPage.jsx` — create/edit form with name, description, job role, duration, type, difficulty, allowed-languages chips, an in-page question picker (lazy-loads the question bank, supports search), and an 8-criterion rubric-defaults slider block (matches the `RUBRIC_FIELDS` on the template model). Picks up a duplicate seed from sessionStorage (set by the list page's "Duplicate" action).
- `frontend/src/routes/AppRoutes.jsx` — added `/templates`, `/templates/new`, `/templates/:id/edit` (all gated by `ProtectedRoute roles={['interviewer', 'admin']}`).
- `frontend/src/components/layout/DashboardLayout.jsx` — added a "Templates" sidebar link with the `Layers` icon, between "Interviews" and "Question Bank". Available to interviewer/admin users only (the sidebar already swaps to `CANDIDATE_LINKS` for candidates).
- `frontend/src/pages/interviews/InterviewCreateWizard.jsx` — added a "Load from template" panel at the top of the Details step. Lazy-loads the org's templates on mount and renders them as one-click chips. `applyTemplate()` seeds the form's `title`, `jobRole`, `type`, `difficulty`, `durationMinutes`, `allowedLanguages`, `questionIds`, `rubric`, and `templateId` — the existing `createInterview` backend applies the same template defaults on submit (defense in depth). Also picks up a `sanchivue:templateSeed` from sessionStorage (set when the user clicks "Apply" on a template card before opening the wizard).

#### Feature 2 — Candidate invitations via secure link

The backend already had the `Invitation` model (high-entropy 32-byte hex token, `interviewId` link, 7-day TTL via Mongo TTL index), but the routes to issue + resolve a candidate invitation didn't exist. The frontend `interview.api.js` already declared `validateInvitation(token)` — but it was calling a route that returned 404. I built the missing endpoints and wired the interviewer flow end-to-end.

**Backend (additions to existing files):**
- `backend/src/controllers/interview.controller.js`:
  - **`getCandidateInvitation`** (PUBLIC — mounted before `router.use(verifyJWT)`) — resolves a token and returns a candidate-safe view: `{ id, title, jobRole, status, type, difficulty, durationMin, durationMinutes (alias), allowedLanguages, scheduledAt, timezone, aiPolicy, candidateInstructions, instructions, token, invitationEmail, expiresAt }`. NEVER returns interviewer ids, rubric drafts, proctoring logs, snapshots, chat, or hidden tests. Marks the invitation `EXPIRED` if the TTL has passed and returns 410.
  - **`createInterviewInvitation`** — `POST /interviews/:id/invite`. Authorization: only an assigned interviewer or platform admin can invite. Creates an `Invitation` row linked to `interviewId` + `orgId` + `email` + `role='candidate'` + `invitedBy`. Builds the shareable URL from the request origin (or `FRONTEND_URL` fallback). Calls `sendCandidateInterviewEmail()` (no-ops if SMTP isn't configured). If the email maps to a registered user, auto-attaches them as the interview's candidate. Returns `{ invitation, inviteUrl, token, emailSent, emailReason }`.
  - **`listInterviewInvitations`** — `GET /interviews/:id/invitations` (interviewer-only) for the future InterviewManage page to list prior invitations.
- `backend/src/routes/interview.routes.js` — restructured so `router.get('/invitations/:token', getCandidateInvitation)` is mounted BEFORE `router.use(verifyJWT)`. The authed routes (`POST /:id/invite`, `GET /:id/invitations`, etc.) are below `verifyJWT` as before. All existing routes preserved.
- `backend/src/services/email.service.js` — added `sendCandidateInterviewEmail({ to, inviteUrl, interviewTitle, invitedBy })` with a small branded HTML template; gracefully no-ops (returns `{ ok:false, reason:'SMTP_NOT_CONFIGURED' }`) if `SMTP_HOST` isn't set so the wizard can fall back to a `mailto:` link.

**Frontend (additions):**
- `frontend/src/api/interview.api.js` — added `invite(id, payload)` → `POST /interviews/:id/invite` and `listInvitations(id)` → `GET /interviews/:id/invitations`. Kept `validateInvitation(token)` (now actually backed by a real PUBLIC endpoint).
- `frontend/src/pages/interviews/CandidateWaitingRoom.jsx` — fixed the unwrap: the public endpoint returns `{ interview, invitation }`; the previous code stored the whole payload and then read `interview.id` (which would be undefined). Now unwraps `data.interview || data` so the existing `interview.id` / `interview.title` / `interview.candidateInstructions` / `interview.durationMinutes` / `interview.allowedLanguages` reads work as-is.
- `frontend/src/pages/interviews/InterviewCreateWizard.jsx`:
  - `submit()` — after the interview is created, if a candidate email was entered, automatically calls `interviewApi.invite(interviewId, { email })` to issue a secure invitation. The `done` step then has a real link to share.
  - `done` step — redesigned into a real invitation panel: shows the link in a readonly input with **Copy** + **Email** buttons. If SMTP delivered the email, surfaces "An invitation email was sent to …". If SMTP isn't configured, surfaces an amber hint "SMTP not configured — use the Email button to open your mail client." The Email button opens a `mailto:` link pre-filled with the candidate's email + a branded subject + a body containing the link.
  - `GenerateInvitationRow` (new helper component) — lets the interviewer generate (or refresh) a secure invitation link for an arbitrary candidate email after the interview is created. Useful when the candidate wasn't known at create-time, or to rotate a compromised link. Each link is a high-entropy token scoped to this interview and expires in 7 days (surfaced as helper text).
  - Reads the active org from `useOrganization()` and forwards `orgId` to the create call so the backend's `requireOrgMember` middleware has the context it needs (previously the wizard didn't send `orgId`, which would have caused a 400).

### Files changed/created

**Created (backend, 3 files):**
- `/home/z/my-project/backend/src/controllers/template.controller.js`
- `/home/z/my-project/backend/src/routes/template.routes.js`
- `/home/z/my-project/backend/src/validators/template.validator.js`

**Created (frontend, 3 files):**
- `/home/z/my-project/frontend/src/api/template.api.js`
- `/home/z/my-project/frontend/src/pages/templates/TemplatesListPage.jsx`
- `/home/z/my-project/frontend/src/pages/templates/TemplateEditorPage.jsx`

**Modified (backend):**
- `/home/z/my-project/backend/src/routes/index.routes.js` — mounted the templates router.
- `/home/z/my-project/backend/src/routes/interview.routes.js` — restructured to mount the public invitation route before `verifyJWT`; added `POST /:id/invite` and `GET /:id/invitations`.
- `/home/z/my-project/backend/src/controllers/interview.controller.js` — added `getCandidateInvitation`, `createInterviewInvitation`, `listInterviewInvitations` (and imported `Invitation`, `sendCandidateInterviewEmail`, `env`).
- `/home/z/my-project/backend/src/services/email.service.js` — added `sendCandidateInterviewEmail`.

**Modified (frontend):**
- `/home/z/my-project/frontend/src/pages/public/LandingPage.jsx` — full copy rewrite (Deliverable A).
- `/home/z/my-project/frontend/src/pages/auth/RegisterPage.jsx` — clean role-card selector + friendlier password hint (Deliverable B).
- `/home/z/my-project/frontend/src/components/layout/AuthLayout.jsx` — minimal branded sidebar (removed feature bullets, kept tagline + creator credit) (Deliverable B).
- `/home/z/my-project/frontend/src/api/interview.api.js` — added `invite`, `listInvitations`; documented `validateInvitation` as PUBLIC (Feature 2).
- `/home/z/my-project/frontend/src/pages/interviews/CandidateWaitingRoom.jsx` — unwrap `{interview, invitation}` from the public invitation response (Feature 2 fix).
- `/home/z/my-project/frontend/src/pages/interviews/InterviewCreateWizard.jsx` — auto-issue invitation on submit; redesigned `done` step with Copy + Email + GenerateInvitationRow; added "Load from template" panel on Details step; reads `useOrganization().activeOrg` and forwards `orgId` (Feature 1 + Feature 2).
- `/home/z/my-project/frontend/src/routes/AppRoutes.jsx` — added `/templates`, `/templates/new`, `/templates/:id/edit` (Feature 1).
- `/home/z/my-project/frontend/src/components/layout/DashboardLayout.jsx` — added "Templates" sidebar link with the `Layers` icon (Feature 1).

### Build + lint status (final)

- `cd /home/z/my-project/frontend && node_modules/.bin/vite build` → **✓ built in 5.63s** with 0 errors. New chunks: `TemplatesListPage` 7.69 kB, `TemplateEditorPage` 8.26 kB. Existing chunks are healthy (LandingPage grew from 13.81 → 17.83 kB from the new copy + FAQ + stats strip; InterviewCreateWizard grew from 17.48 → 23.31 kB from the new invitation panel + template loader).
- `cd /home/z/my-project/frontend && node_modules/.bin/eslint src/pages/public/LandingPage.jsx src/pages/auth/RegisterPage.jsx src/pages/templates/ src/components/layout/AuthLayout.jsx src/api/template.api.js src/api/interview.api.js src/pages/interviews/InterviewCreateWizard.jsx src/pages/interviews/CandidateWaitingRoom.jsx src/routes/AppRoutes.jsx src/components/layout/DashboardLayout.jsx` → **0 errors, 0 warnings**.
- `cd /home/z/my-project/frontend && node_modules/.bin/eslint .` → **0 errors, 4 warnings** — the 4 pre-existing `react-refresh/only-export-components` warnings on the 4 Context files (intentional co-location, rule set to warn; the build succeeds).
- `cd /home/z/my-project/backend && bunx eslint .` → **0 errors, 0 warnings**.
- `cd /home/z/my-project/backend && bunx vitest run` → **2/2 tests pass** (`tests/health.test.js`). No regressions.

### Two features added (recap)
1. **Interview Templates** — reusable question set + rubric + duration + allowed languages. CRUD UI at `/templates` + `/templates/new` + `/templates/:id/edit`; one-click "Apply" to seed the wizard; "Load from template" panel inside the wizard itself. Backend mounted at `/api/v1/interview-templates` with org-scoped authorization + audit logging.
2. **Candidate invitations via secure link** — `POST /interviews/:id/invite` issues a high-entropy token (reuses the existing `Invitation` model with `interviewId` link + 7-day TTL). `GET /interviews/invitations/:token` is PUBLIC (mounted before `verifyJWT`) so unauthenticated candidates can resolve their invitation from the existing `/join/:token` waiting room. The wizard auto-issues an invitation on submit if a candidate email is set; the `done` step shows the link with Copy + Email buttons + a "Generate a fresh link" row for rotating emails.

### New landing-page hero headline
**"Run technical interviews that actually predict on-the-job performance."**

(Replaces the previous "Run technical interviews that feel like real engineering" which leaned too hard on the AI-co-pilot / sandboxed-execution vibe.)

## Stage Summary
The Sanchivue frontend now reads as a polished, original product brand by Sanchit Singhal — not a generic AI tool. The landing page leads with the outcome, the register page is minimal and on-brand, and two high-value competitor-inspired features (interview templates + secure candidate invitations) are wired end-to-end across the frontend and backend with zero placeholder modals. Every build passes (frontend + backend), every lint is clean (only the 4 unavoidable react-refresh warnings remain), and the backend's existing vitest suite still passes 2/2. The user can run `bun run dev` in `/backend` and `/frontend` against a real MongoDB to exercise the full flow: register → dashboard → templates → wizard (apply template) → create interview → share invitation link → candidate joins via `/join/:token` waiting room → live room → evaluation report.
