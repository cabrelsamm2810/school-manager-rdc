# School Manager RDC — dev environment notes

## Stack

Next.js 14 (App Router) + Prisma + PostgreSQL + Tailwind. Session-cookie auth (same-origin, `sameSite: lax`).

## How it runs here

```bash
docker compose -f docker-compose.base44.yml up -d
```

- `postgres` — local PostgreSQL (user/pass `school`/`schoolpass`, db `school`), healthchecked with `pg_isready`.
- `migrate` — one-shot, must exit 0 before `web` starts (`depends_on: service_completed_successfully`):
  `npm install` → `prisma generate` → `prisma db push --accept-data-loss` → `tsx prisma/seed.ts`.
  It uses `db push`, not `migrate deploy`, because the database was created with `db push` and is not baselined
  for migrations.
- `web` — `next dev -H 0.0.0.0 -p 3000` from the bind-mounted repo; live reload is active. `node_modules` and
  `.next` live in container volumes, so installs do not spill into the host working tree.

Web entry point is host port 3000; the API is served by the same Next dev server (single-origin wiring).
`/run/base44/app.env` (the platform-managed secrets file) is the only `env_file` — it carries the SMTP
credentials. Nothing external is required to boot.

## Sharp edges

- **Prisma needs OpenSSL.** `node:22-bookworm-slim` lacks it and Prisma fails with an empty "Schema engine error".
  Both app services use `node:22-bookworm` (full Debian) — do not switch them to `-slim`.
- **`migrate` and `web` each run `npm install`.** They never run concurrently, so they do not race each other;
  do not add a third installer against the same `node_modules` volume.
- **`package-lock.json` is tracked**, but the service commands still use `npm install` (not `npm ci`), so a
  dependency change should be followed by an install to keep the lockfile in sync.
- **Tailwind/PostCSS config must exist.** Without `postcss.config.mjs` Next.js skips PostCSS entirely, so the
  `@tailwind` directives in `app/globals.css` are never expanded and no utility classes are emitted. Content
  paths cover `app/`, `components/` and `lib/`.
- **CSS backgrounds must point at a real asset.** `.login-background` (used by `app/verify/page.tsx`) uses
  `public/school-background.svg`; there is no `school-background.png` in any branch, so pointing back at a `.png`
  makes the background render empty.
- **`lib/account-service.ts` returns an explicit `AccountResult` discriminated union.** That annotation is
  load-bearing: without it `ok` widens to `boolean`, callers cannot narrow the union, and
  `app/api/auth/login/route.ts` fails `next build` on `'result.user' is possibly 'undefined'`. Public
  registration accepts every role listed in `validRoles`, and new accounts start inactive until the email code
  is verified.
- **CRUD pattern** — modules share one factory: `lib/crud-factory.ts` (API handlers), `lib/crud-models.ts`
  (Prisma model configs), `lib/crud-configs.tsx` (frontend field/column/stat configs) and
  `components/CrudManager.tsx` (list + form + delete UI). Route files are thin wrappers around
  `createCrudHandlers()`. To add a module: add the Prisma model, add entries to `crud-models.ts` and
  `crud-configs.tsx`, add the two route files, and render `<CrudManager config={crudConfigs.xxx} />`.
- `.env.example` lists Supabase and S3 settings, but those integrations are **not implemented** — only
  `DATABASE_URL`, `DIRECT_URL`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE` and `NODE_ENV` are read. `SESSION_SECRET`
  is declared there but referenced nowhere in the code.

## Verifying it works

```bash
docker compose -f docker-compose.base44.yml ps                           # web healthy, migrate exited 0
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login     # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/register  # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/meta  # 200
# /dashboard is behind middleware: without a session cookie it 307s to /login,
# with one it must compile and return 200 (a 500 here means a missing import).
curl -s -o /dev/null -w "%{http_code}\n" -H "Cookie: school_manager_session=demo" http://localhost:3000/dashboard
```

The generated stylesheet must contain real Tailwind output:
`curl -s http://localhost:3000/_next/static/css/app/layout.css | grep -c "min-h-screen"` should be ≥ 1.

Full flow: register at `/register` (the account starts inactive and a 6-digit code is emailed) →
activate with `POST /api/auth/verify` → log in at `/login` (sets the session cookie) →
`GET /api/auth/session` → `GET /api/users/me`.

## Tests

- `npm test` — vitest unit tests (`tests/auth.test.ts`), no database needed. `vitest.config.ts` maps the `@/`
  alias, which Vitest does not read from `tsconfig.json`.
- `npm run test:db` — Postgres integration test; only runs when `RUN_DB_TESTS=true` and `DATABASE_URL` are set.
- `npx prisma validate` / `npm run build` for schema and production-build checks.

Never run `prisma migrate reset`, `db push --force-reset`, or anything that deletes tables or the
`postgres_data` volume.
