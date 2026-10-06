# Base44 Dev Environment

## Stack
Next.js 14 (App Router) + Prisma + PostgreSQL + Tailwind. Session-cookie auth (same-origin, `sameSite: lax`).

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- `postgres` — local PostgreSQL (user/pass `school`/`schoolpass`, db `school`), healthchecked with `pg_isready`.
- `migrate` — one-shot: `npm install` → `prisma generate` → `prisma db push --accept-data-loss` → `tsx prisma/seed.ts`. Exits 0 when done. Uses `db push` (not `migrate deploy`) because the DB was created via `db push` and isn't baselined for migrations.
- `web` — `next dev -H 0.0.0.0 -p 3000` with the repo bind-mounted; live reload is active. Depends on `migrate` completing successfully. It runs `rm -rf .next` before starting: `/app/.next` is a persistent anonymous volume, and stale webpack chunks from an unclean shutdown otherwise cause `Cannot find module './NNNN.js'` 500s (`/_next/static/chunks/fallback/*`) until the cache is cleared.

Web entry point is on host port 3000. Single-origin wiring (API routes served by the same Next dev server).

## Notes / quirks
- **No lockfile** in the repo, so services run `npm install` (not `npm ci`) on startup. `postinstall` runs `prisma generate`.
- **Prisma needs OpenSSL** — the `node:22-bookworm-slim` image lacks it and `prisma migrate deploy` fails with an empty "Schema engine error". Services use `node:22-bookworm` (full Debian) instead.
- **CRUD pattern** — new modules use a shared factory: `lib/crud-factory.ts` (API handlers), `lib/crud-models.ts` (Prisma model configs), `lib/crud-configs.tsx` (frontend field/column/stat configs), `components/CrudManager.tsx` (reusable list+form+delete UI). Each API route file is a thin wrapper calling `createCrudHandlers()`. To add a new CRUD module: add a Prisma model, add entries to `crud-models.ts` + `crud-configs.tsx`, create the two API route files, and update the page to use `<CrudManager config={crudConfigs.xxx} />`.
- **Tailwind/PostCSS config was missing** from the repo (`tailwind.config.ts`, `postcss.config.mjs` were added so `@tailwind` directives in `app/globals.css` compile). Content paths cover `app/` and `components/`.
- `.env.example` lists Supabase and S3 settings, but those integrations are **not implemented** in code — only `DATABASE_URL`, `DIRECT_URL`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE`, `NODE_ENV` are actually read. No external credentials are required to boot; the DB runs locally in compose.
- `SESSION_SECRET` is declared in `.env.example` but not referenced anywhere in code; a placeholder lives in `.env.base44-defaults`.

## Verifying
- `docker compose -f docker-compose.base44.yml ps` → `web` healthy, `migrate` exited 0.
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200.
- Register a user at `/register`, then log in at `/login`; the session cookie gates `/dashboard` and `/profile` (see `middleware.ts`).

## Tests
`npm test` (vitest). `npm run test:db` requires `RUN_DB_TESTS=true` + a live `DATABASE_URL`; it self-skips otherwise.
