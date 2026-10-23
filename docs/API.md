# API Reference — Sanchivue

Base URL: `http://localhost:5000/api/v1`

All responses follow this shape:

```json
{ "success": true, "message": "Operation completed successfully", "data": {}, "pagination": null }
```

Errors:

```json
{ "success": false, "message": "Human-readable message", "errors": [], "statusCode": 400 }
```

Auth: JWT in an **httpOnly cookie** (`sanchivue_session`) **or** `Authorization: Bearer <accessToken>`.

---

## Auth (`/auth`)

| Method | Path | Body | Auth | Permission |
|---|---|---|---|---|
| POST | `/auth/register` | `{name,email,password,role}` | — | public |
| POST | `/auth/login` | `{email,password}` | — | public |
| POST | `/auth/logout` | — | yes | self |
| POST | `/auth/refresh` | — | refresh cookie | self |
| GET | `/auth/me` | — | yes | self |
| POST | `/auth/forgot-password` | `{email}` | — | public |
| POST | `/auth/reset-password` | `{token,password}` | — | public |
| POST | `/auth/change-password` | `{oldPassword,newPassword}` | yes | self |
| POST | `/auth/verify-email` | `{token}` | — | public |

## Users (`/users`)

| Method | Path | Auth | Permission |
|---|---|---|---|
| GET | `/users/me` | yes | self |
| PATCH | `/users/me` | yes | self |
| POST | `/users/me/avatar` (multipart `avatar`) | yes | self |
| POST | `/users/me/resume` (multipart `resume`) | yes | self |

## Organizations (`/organizations`)

| Method | Path | Body | Permission |
|---|---|---|---|
| GET | `/organizations` | — | authed |
| POST | `/organizations` | `{name,slug}` | authed (becomes owner) |
| GET | `/organizations/:id` | — | member |
| POST | `/organizations/:id/members` | `{userId,role}` | orgAdmin+ |
| POST | `/organizations/:id/invite` | `{email,role}` | orgAdmin+ |
| POST | `/organizations/invitations/:token/accept` | — | authed |

## Interviews (`/interviews`)

| Method | Path | Body / Query | Permission |
|---|---|---|---|
| GET | `/interviews` | `?page&limit&status&search` | authed (org-scoped) |
| POST | `/interviews` | full interview config | interviewer+ |
| GET | `/interviews/:id` | — | participant |
| PATCH | `/interviews/:id` | partial update | interviewer+ |
| POST | `/interviews/:id/join` | — | candidate (via invitation) |
| POST | `/interviews/:id/snapshots` | `{code,language,eventType}` | participant |
| POST | `/interviews/:id/proctoring` | `{type,detail,severity}` | participant |
| POST | `/interviews/:id/chat` | `{content}` | participant |
| POST | `/interviews/:id/end` | — | interviewer+ |

Interview statuses: `DRAFT`, `SCHEDULED`, `READY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `EXPIRED`.

## Questions (`/questions`)

| Method | Path | Permission |
|---|---|---|
| GET | `/questions?page&limit&difficulty&tag&search` | org member (hidden tests stripped for candidates) |
| POST | `/questions` | interviewer+ |
| GET | `/questions/:id` | org member (hidden tests stripped for candidates) |
| PATCH | `/questions/:id` | interviewer+ |

## Submissions (`/submissions`)

| Method | Path | Body | Permission |
|---|---|---|---|
| POST | `/submissions/run` | `{questionId,code,language}` | authed (public tests only) |
| POST | `/submissions/submit` | `{questionId,code,language,interviewId?}` | authed (public + hidden; queued) |
| GET | `/submissions/history?questionId&userId` | — | self or interviewer |

Submission status: `ACCEPTED`, `WRONG_ANSWER`, `TLE`, `MLE`, `RUNTIME_ERROR`, `PENDING`.

## Evaluations (`/evaluations`)

| Method | Path | Body | Permission |
|---|---|---|---|
| GET | `/evaluations/:interviewId` | — | interviewer of that org (candidate sees own) |
| POST | `/evaluations/:interviewId` | `{rubricScores,interviewerNotes,passedRatio}` | interviewer+ |

## Notifications (`/notifications`)

| Method | Path | Permission |
|---|---|---|
| GET | `/notifications` | self |
| PATCH | `/notifications/:id/read` | self |
| PATCH | `/notifications/preferences` | self |

## AI (`/ai`)

| Method | Path | Body | Permission |
|---|---|---|---|
| POST | `/ai/copilot` | `{code,questionStatement}` | interviewer+ |
| POST | `/ai/assessment` | `{jd}` | interviewer+ |
| POST | `/ai/summary` | `{interviewId,rubricScores,interviewerNotes,passedRatio}` | interviewer+ |
| POST | `/ai/followups` | `{code}` | interviewer+ |

## Socket.io events

Client → server (all carry `{ roomCode, ... }`): `join-room`, `code:change`, `language:change`, `cursor:move`, `chat:message`, `whiteboard:draw`, `whiteboard:clear`, `whiteboard:sync-request`, `whiteboard:state`, `proctoring:violation`, `snapshot:save`, `snapshot:request`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`.

Server → client: `presence:update`, `code:change`, `language:change`, `cursor:move`, `chat:message`, `whiteboard:draw`, `whiteboard:clear`, `whiteboard:state`, `proctoring:violation`, `snapshot:saved`, `snapshot:list`, `webrtc:*` (relayed), `server:shutdown`.
