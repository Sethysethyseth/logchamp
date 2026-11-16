# LogChamp

LogChamp (formerly WorkoutDB) is a mobile-first, **analytics-first** weightlifting tracker for intermediate lifters: weekly volume per muscle, PR detection, estimated 1RM and progressive-overload trends, on top of fast logging, reusable workouts and multi-week blocks.

The rename is display-layer only: service names, env vars, package names, cookies and storage keys keep the `workout-db` / `workoutdb` names (see `AGENTS.md`, "Rename boundary").

Agent and contributor context lives in `AGENTS.md` (conventions, command gate) and `docs/HANDOFF.md` (current state).

## Tech stack

- **Client**: React + Vite (`client/`)
- **Server**: Express + sessions (`server/`)
- **DB**: Postgres (Neon) via Prisma 6 (config in `server/prisma.config.ts`)
- **Analytics engine**: pure functions in `server/src/analytics/` (no DB)

## Repo structure

- `client/`: frontend app
- `server/`: API, auth, Prisma schema/migrations

## Local development

You run **two** processes (server + client).

### 1) Server

From `server/`:

- `npm install`
- Create `server/.env` from `server/.env.example`
- Run migrations/generate:
  - `npm run prisma:generate`
  - `npm run prisma:migrate`
- Start the API:
  - `npm run dev`

By default the API runs on `http://localhost:3000`.

### 2) Client

From `client/`:

- `npm install`
- `npm run dev`

Desktop dev defaults to calling the API at `http://localhost:3000` (do **not** set `VITE_API_URL` unless you need mobile/LAN or prod).

## Mobile dev (phone on same Wi‑Fi)

1. Find your PC’s LAN IPv4 (Windows: `ipconfig`).
2. Create `client/.env.local` (not committed):

   `VITE_API_URL=http://<your-ip>:3000`

3. In `server/.env`, set:

   `CLIENT_ORIGIN_MOBILE=http://<your-ip>:5173`

4. Run Vite on the LAN from `client/`:

   `npm run dev:mobile`

5. On your phone, open `http://<your-ip>:5173`.

When your LAN IP changes, update `client/.env.local` and `CLIENT_ORIGIN_MOBILE`. Desktop dev stays on localhost.

## Environment variables

- **Client**: see `client/.env.example`
- **Server**: see `server/.env.example`

### Vercel previews + this API (CORS + cookies)

Vite bakes `VITE_API_URL` at **build** time, so set it per Vercel environment (Production vs Preview) as needed. The API only allows browser origins listed in `CLIENT_ORIGIN` / `CLIENT_ORIGIN_MOBILE` (comma-separated). Add each preview hostname you use, or previews will fail CORS before auth runs.

## Scripts (common)

- `client`: `npm run dev`, `npm run dev:mobile`, `npm run build`
- `server`: `npm run dev`, `npm run start`, `npm run prisma:studio`
- `server`: `npm run test:unit` (pure-function lane, no DB, runs in CI) and `npm test` (both lanes; the integration lane migrates and resets the STAGING DB)
