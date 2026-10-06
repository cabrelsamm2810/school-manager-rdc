# School Manager RDC — dev environment notes

## How it runs here

- `docker compose -f docker-compose.base44.yml up -d` is the whole setup: Postgres 16 (`db`), a one-shot
  `migrate` service (`npm install` + `prisma migrate deploy`), then `web` running `next dev` on port 3000
  from the bind-mounted source.
- The `migrate` service must exit successfully before `web` starts (`depends_on: service_completed_successfully`).
  Both app services run `npm install` on startup, and they never run concurrently — do not add a second
  installer against the shared `node_modules` bind mount.
- `DATABASE_URL` / `DIRECT_URL` point at the local `db` service. They are sandbox-local infrastructure
  credentials set inline in Compose, not user secrets. `prisma/schema.prisma` requires both.
- Node image must be `node:22-bookworm` (full), **not** `-slim`: Prisma's schema engine fails with
  `Schema engine error` when OpenSSL is missing. `openssl` is what makes `prisma migrate deploy` work.

## Sharp edges found on this branch

- Tailwind was declared in `package.json` and used everywhere, but on `main` the `tailwind.config.ts` and
  `postcss.config.mjs` files were missing. Without a PostCSS config Next.js skips PostCSS entirely, so the
  `@tailwind` directives in `app/globals.css` were never expanded and no utility classes were emitted.
- `app/dashboard/page.tsx` imports `@/components/AppShell`; that component was missing from `main`, which
  broke the `/dashboard` route with `Module not found`. The only real AppShell in the repo lives on
  `origin/base44/setup-4ce80f11` and pulls in `@/lib/navigation`, `@/components/ui/Icon`, etc., none of which
  exist on `main`; the local `components/AppShell.tsx` is a deliberately minimal shell that matches this
  branch's simplified dashboard.
- `app/globals.css` referenced `/school-background.png`, which does not exist in any branch. The public asset
  that exists is `public/school-background.svg`. Any change to that CSS must point at a file that is actually
  in `public/`, otherwise the login/register background silently renders empty.
- `lib/account-service.ts` only accepts `role: 'ELEVE'` (or no role) on public registration, while
  `components/auth/RegisterForm.tsx` offers every role in its select. Registering with any other role returns
  400 `Données invalides.` This is intentional business logic, not a build problem.
- `prisma/seed.ts` is not run by Compose; an empty database is normal, and accounts come from `/register`.

## Type errors that broke `next build`

`next build` type-checks every file matched by `tsconfig.json` (`**/*.ts`), so a test file can break the build.
Three problems were fixed on this branch:

- `lib/account-service.ts` returned bare object literals, so `ok` widened to `boolean` and callers could not
  narrow the union — `app/api/auth/login/route.ts` then failed on `'result.user' is possibly 'undefined'`.
  Both helpers are now annotated with an explicit `AccountResult` discriminated union.
- `bcryptjs` 2.x ships no type declarations, so `lib/auth.ts` failed with TS7016. `@types/bcryptjs` is now a
  devDependency (`npm install` is enough — there is no lockfile in the repo).
- `tests/auth.test.ts` imported `hasAtLeastRole` / `isSuperAdmin` from `lib/rbac.ts`; those are now exported
  there (the role ranking map simply moved to module scope). Nothing about the RBAC behaviour changed.

`vitest.config.ts` maps the `@/` alias, which Vitest does not read from `tsconfig.json` — without it every
test file fails with `Failed to load url @/lib/auth`.

## Verifying it works

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login     # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/register  # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/meta  # 200
# /dashboard is behind middleware: without a session cookie it 307s to /login,
# with one it must compile and return 200 (a 500 here means a missing import).
curl -s -o /dev/null -w "%{http_code}\n" -H "Cookie: school_manager_session=demo" http://localhost:3000/dashboard
```

Full flow: `POST /api/auth/register` (role `ELEVE`) → `POST /api/auth/login` (sets the session cookie) →
`GET /api/auth/session` → `GET /api/users/me`.

The generated stylesheet must contain real Tailwind output:
`curl -s http://localhost:3000/_next/static/css/app/layout.css | grep -c "min-h-screen"` should be ≥ 1.

## Tests

- `npm test` — vitest unit tests (`tests/auth.test.ts`), no database needed.
- `npm run test:db` — Postgres integration test; only runs when `RUN_DB_TESTS=true` and `DATABASE_URL` are set.
- `npx prisma validate` / `npm run build` for schema and production-build checks.

Never run `prisma migrate reset`, `db push --force-reset`, or anything that deletes tables or the `db_data` volume.
