# Troubleshooting — Sanchivue

## Backend won't start

| Symptom | Fix |
|---|---|
| `MONGODB_URI` not set | Copy `backend/.env.example` to `backend/.env` and paste your Atlas connection string |
| `ECONNREFUSED 127.0.0.1:27017` | Start a local `mongod`, or use MongoDB Atlas |
| `JwtStrategy: secretOrKey is undefined` | Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (run `openssl rand -hex 32`) |
| Port 5000 in use | Change `PORT` in `.env` |
| `Cloudinary ... not configured` | Optional — uploads return `null`. Set Cloudinary creds to enable. |

## Frontend won't start

| Symptom | Fix |
|---|---|
| `EADDRINUSE :5173` | Change `server.port` in `vite.config.js` |
| 401 on every API call | The httpOnly cookie isn't being sent — ensure `withCredentials:true` and that `FRONTEND_URL` in the backend `.env` matches the Vite origin exactly (scheme+host+port) |
| CORS error in browser | Set `FRONTEND_URL` to the Vite dev URL; restart the backend |
| Socket.io `xhr poll error` | The Vite proxy for `/socket.io` → `http://localhost:5000` must be present in `vite.config.js` |

## Auth / cookies

- Cookies are `httpOnly` + `sameSite=lax` + `secure` (in production). Local dev over `http://` works because `NODE_ENV !== production`.
- If you deploy the frontend and backend on **different origins**, set `COOKIE_SAME_SITE=none` and serve both over HTTPS, and set `COOKIE_DOMAIN` appropriately. Cross-origin cookies also need a real CSRF strategy (see `docs/SECURITY.md`).

## WebRTC

- No remote video? Check browser console for ICE failures. On restrictive NATs you need a TURN server (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`).
- Camera/mic permission denied? The candidate waiting room shows a clear device-readiness check; users must grant `getUserMedia` permission.
- Screen share not working? Requires an explicit user gesture + HTTPS.

## Code execution

- JavaScript always runs out-of-the-box via `node:vm`.
- Python/Java/C++ need the toolchain installed on the host **or** a configured Judge0 instance.
- If you see "Time Limit Exceeded" on a fast solution, the question's `timeLimitMs` may be too low for the host — bump it in the question editor.

## AI

- Every AI button returns output even without `AI_API_KEY` (deterministic local fallback).
- To use the real LLM, set `AI_API_KEY` (and optionally `AI_PROVIDER`/`AI_MODEL`).
- If AI responses are empty/unexpected, check the backend logs — the LLM JSON parse is defensive and falls back.

## Database

- Auto-seed runs only on an **empty** database. To re-seed, drop the `sanchivue` database and restart the backend.
- Slow queries? Ensure the compound indexes (`(orgId, status, scheduledAt)`, `(candidateId, questionId)`) are created. Mongoose creates them on startup; run `db.collection.getIndexes()` in the Mongo shell to verify.

## Build / lint

- `cd frontend && bun run build` must succeed before deploying. If it fails, fix JSX errors (the build does a full type-free compile of all `.jsx` files).
- `bun run lint` reports both workspaces. Context-provider files may emit `react-refresh/only-export-components` warnings — these are intentional (hook co-located with Provider) and safe.
