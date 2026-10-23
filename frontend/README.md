# Sanchivue Frontend

> Live Technical Interview & AI Assessment Platform — frontend, built by **Sanchit Singhal**.

Pure JavaScript + React + Vite + Tailwind. Consumes the Sanchivue Express + MongoDB backend (mounted at `/api/v1`) and the Socket.io collab service.

## Stack

- React 18 + Vite 6 (pure JS / JSX — no TypeScript)
- Tailwind CSS 3 (dark developer-IDE theme; indigo + emerald accents)
- React Router DOM 6
- Axios (with 401 → `/auth/refresh` retry queue)
- Socket.io-client (collab service on the same origin)
- @monaco-editor/react (live collaborative editor)
- React Hook Form + Zod (form validation)
- Recharts (rubric radar)
- lucide-react (icons)
- react-hot-toast (notifications)
- framer-motion (subtle animations)
- date-fns (date helpers)

## Getting started

```bash
cp .env.example .env
bun install     # or npm install / pnpm install
bun run dev     # vite dev server on http://localhost:5173
```

In dev, Vite proxies `/api` and `/socket.io` to `http://localhost:5000` so the
Express backend's httpOnly cookies work without CORS configuration. In
production, set `VITE_API_URL` and `VITE_SOCKET_URL` accordingly.

## Scripts

- `bun run dev` — start the Vite dev server
- `bun run build` — production build (proves the JSX compiles cleanly)
- `bun run preview` — preview the production build locally
- `bun run lint` — ESLint (flat config)
- `bun run format` — Prettier

## Folder structure

See the master spec at the project root. Highlights:

- `src/api/` — axios instance + per-resource API modules (auth, user, interview, question, submission, evaluation, organization, ai, notification)
- `src/context/` — Auth, Organization, Notification, InterviewRoom contexts
- `src/hooks/` — `useAuth`, `useSocket`, `useProctoring`, `usePresence`, `useInterview`
- `src/components/` — common, layout, forms, editor, whiteboard, interview, dashboard
- `src/pages/` — public, auth, dashboard, interviews, questions, candidates, reports, settings
- `src/routes/AppRoutes.jsx` — protected + role-based routing
- `src/validations/` — Zod schemas for auth, interview, question
- `src/constants/` — languages, roles, rubricCriteria, difficulty

## Demo accounts

Wired into the login page as quick-fill buttons:

| Role         | Email                    | Password         |
|--------------|--------------------------|------------------|
| Interviewer  | `interviewer@demo.dev`  | `interviewer123` |
| Candidate    | `candidate@demo.dev`    | `candidate123`   |

## Branding

- `src/assets/branding/sanchivue-mark.svg` — standalone mark (16px+)
- `src/assets/branding/sanchivue-logo.svg` — mark + wordmark
- `public/favicon.svg` — favicon (the mark)

## License & credit

Built by **Sanchit Singhal**.
