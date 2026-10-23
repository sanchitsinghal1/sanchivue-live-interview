# Database — Sanchivue

**Engine:** MongoDB via Mongoose. **Database name:** `sanchivue` (configurable via `DB_NAME`).

## Connection

`backend/src/db/index.js` exports `connectDB()` which reads `MONGODB_URI` from env. On a successful connection it auto-seeds the database if it is empty (see `seed.js`).

## Models (16)

| Model | Key fields | Indexes |
|---|---|---|
| `user.model.js` | email (unique), name, password (bcrypt), role enum, avatarUrl, resumeUrl | email unique |
| `organization.model.js` | name, slug (unique), ownerId, settings | slug unique |
| `organizationMember.model.js` | orgId, userId, role, status | compound unique `(orgId, userId)` |
| `invitation.model.js` | orgId, email, token (high-entropy), role, invitedBy, expiresAt (TTL), status | token, expiresAt TTL |
| `session.model.js` | userId, refreshTokenHash, expiresAt (TTL), userAgent, ip | userId, expiresAt TTL |
| `interview.model.js` | orgId, title, jobRole, candidateUserId, interviewerIds[], questionIds[], status, type, difficulty, scheduledAt, durationMin, timezone, allowedLanguages[], aiPolicy, instructions, rubric, roomCode (unique), proctoringLogs[], chatLog[], snapshots[] | compound `(orgId, status, scheduledAt)`; roomCode unique |
| `interviewTemplate.model.js` | orgId, name, questionIds[], rubric, durationMin | orgId |
| `question.model.js` | orgId, title, slug (unique), difficulty, tags[], statement, constraints, examples[], starterCode{js,py,java,cpp}, publicTests[], hiddenTests[], optimalTime, optimalSpace, timeLimitMs, memoryLimitMb | slug unique; aggregate-paginate plugin |
| `testCase.model.js` | questionId, input, expectedOutput, isHidden, weight, explanation | questionId |
| `submission.model.js` | candidateId, interviewId, questionId, code, language, status enum, passedCount, totalCount, score, executionTimeMs, memoryKb, stdout, stderr | compound `(candidateId, questionId)`; aggregate-paginate |
| `codeSnapshot.model.js` | interviewId, code, language, eventType, timestamp | interviewId |
| `interviewNote.model.js` | interviewId, authorId, questionId, content, isPrivate, linkedSnapshotId | interviewId |
| `evaluation.model.js` | interviewId (unique), candidateId, interviewerId, rubricScores{}, aiSummary, interviewerNotes, recommendation enum | interviewId unique |
| `notification.model.js` | userId, type, title, body, read, meta, createdAt | userId |
| `auditLog.model.js` | action, actorId, targetType, targetId, meta, ip, createdAt | createdAt TTL (90d) |
| `aiInteraction.model.js` | interviewId, userId, kind, prompt, response, model, createdAt | interviewId |

## Aggregation usage

- Dashboard statistics (interviews grouped by status per org) use a `$group` pipeline.
- Leaderboards / candidate comparison use `$lookup` from submissions + evaluations.
- `aggregationPagination.js` wraps any pipeline with `$facet` for paginated `{items, total, totalPages}`.

## Data isolation

- Every org-scoped query filters by `orgId` derived from `req.membership` — never from the client.
- Hidden test cases are projected out of question responses for candidates at the controller layer.
- Private interviewer notes (`isPrivate:true`) are only returned to org members with the interviewer role.

## Retention

- `session` and `invitation` use TTL indexes to expire automatically.
- `auditLog` records auto-expire after 90 days.
- Proctoring logs and chat are capped at the last 500 per interview; snapshots at the last 300.
