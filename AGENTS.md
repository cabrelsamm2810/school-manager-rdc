# AGENTS.md

## How this app runs here

School Manager RDC is a Next.js 14 (App Router) + Prisma + PostgreSQL application. It runs through
`docker-compose.base44.yml`, which mounts the cloned source (no prebuilt image) and starts `next dev`.

- Web entry point: host port **3000** (container port 3000).
- `db` (postgres:16-alpine) is internal only, not published on a host port.
- `setup` is a one-shot service: `npm install` + `npx prisma migrate deploy`, then exits.
- `web` waits for `setup` to complete and runs `npm install` + `npm run dev` with polling enabled
  for the bind mount.

Start / rebuild: `docker compose -f docker-compose.base44.yml up -d --build`
Logs: `docker compose -f docker-compose.base44.yml logs -f web`
Health: the `web` healthcheck calls `GET /api/meta` (a real app route, no DB access).

## Non-obvious findings

- There is **no lockfile** in the repository, so the compose services run `npm install` (not `ci`).
  `node_modules` lives in the named volume `node-modules`, never on the host.
- `postinstall` runs `prisma generate`, so `DATABASE_URL`/`DIRECT_URL` must be present at install
  time — the compose services supply them from `.env.base44-defaults`.
- `prisma/schema.prisma` declares both `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`.
  Both must be set for any Prisma command, including `prisma generate` and `prisma validate`.
- Local database credentials are development placeholders committed in `.env.base44-defaults`.
  Dashboard secrets land in `/run/base44/app.env`, which compose loads **after** that file, so a real
  `DATABASE_URL`/`DIRECT_URL` (e.g. Supabase) overrides the local Postgres without editing compose.
- Sessions are unsigned cookies holding the user id (`SESSION_COOKIE_NAME`), so same-origin serving
  on port 3000 is enough; no CORS or cross-site cookie settings are needed.
- `prisma/seed.ts` creates no accounts — it only counts roles. To log in, register a user through
  `/register` (this creates the first row in `users`).
- `lib/prisma.ts` caches the Prisma client on `globalThis` in development; route handlers are standard
  Next API routes (no server actions), so no `allowedDevOrigins` config is required.

## Verification commands

- Type/route sanity: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/meta` → `200`
- Registration flow (creates a real user): POST `/api/auth/register` with
  `{ nom, prenom, email, password, role, ... }`, then `GET /api/users/me` with the session cookie.
- Tests: `docker compose -f docker-compose.base44.yml exec web npm test`
  (`npm run test:db` additionally needs `RUN_DB_TESTS=true`).

## Do not

- Do not run `prisma migrate reset` or `prisma db push --force-reset`; the README forbids destructive
  database commands and the data volume is shared across branches.
