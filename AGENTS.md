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
  `.next` live in container volumes, so installs do not spill into the host working tree. It clears the contents
  of `.next` on startup, so a stale dev cache from an unclean shutdown cannot break the boot.

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
- **`tsconfig.tsbuildinfo` is not tracked** (`.gitignore` has `*.tsbuildinfo`). It is a TypeScript
  incremental cache, and committing it made stale `TS2802` diagnostics replay for files that were already
  fixed. To type-check from scratch: `npx tsc --noEmit --incremental false`.
- `.env.example` lists Supabase and S3 settings, but those integrations are **not implemented** — only
  `DATABASE_URL`, `DIRECT_URL`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE` and `NODE_ENV` are read. `SESSION_SECRET`
  is declared there but referenced nowhere in the code.
- **Le modèle `Enseignant` n'a aucun champ territorial.** `etablissement` y est un simple libellé (pas de FK),
  et il n'existe ni province ni `etablissementId`. `crud-models.ts` marque donc `provinceField: false` pour ce
  module : sans cela `buildScopeWhere()` ajoutait un `where.province` inexistant et `/api/enseignants` répondait
  500 (`PrismaClientValidationError`) à tout rôle non national — y compris le compte de démonstration
  DIRECTION_ECOLE. Conséquence assumée : la liste des enseignants n'est pas filtrée par périmètre. Les autres
  modules déclarant `institutionField: false` sans `provinceField` ont le même défaut latent.

## Ouverture de l'application

`components/StartupGate.tsx` (monté sur `/`) enchaîne : splash → `GET /api/auth/session` → destination du
rôle, définie dans `lib/role-destination.ts` (ELEVE → `/profile`, ENSEIGNANT → `/enseignant/dashboard`,
tous les autres → `/dashboard`, qui adapte son périmètre à la portée du rôle). Aucun rôle ni permission
n'est modifié ; la décision vient de la session serveur (cookie httpOnly), jamais d'une valeur du
navigateur. La déconnexion (`components/AppShell.tsx`, `app/profile/page.tsx`) renvoie vers `/`.

## Building (`npm run build`)

`next build` only works with `NODE_ENV=production` **and** dev dependencies installed. Inside the `web`
service `NODE_ENV=development` (correct for `next dev`), and that breaks the build in two ways that look
unrelated to each other:

- `npm install` under `NODE_ENV=production` skips devDependencies. Without `typescript`, Next cannot read
  `tsconfig.json`, so the `@/*` alias plugin gets empty paths and every aliased import fails with
  `Module not found: Can't resolve '@/…'`.
- With `NODE_ENV=development` the build uses the development React server bundle and every page prerender
  dies with `<Html> should not be imported outside of pages/_document`.

**Never build into the dev server's `.next`.** `exec`-ing the build into `web` while `next dev` is running
fails non-deterministically (`PageNotFoundError: Cannot find module for page: /api/auth/…` during
"Collecting page data"), and even a build that finishes leaves production chunks in the shared volume: the
next `next dev` boot then dies with `Error: Cannot find module './7787.js'` and serves `/` as 404/500 until it
has finished recompiling.

Verified command (`✓ Compiled successfully`, type-check step passed, exit 0) — a throwaway container that
reuses `web`'s `node_modules` but gets its **own** `.next` volume, so `next dev` keeps running untouched:

```bash
NODE_VOL=$(docker inspect school-manager-rdc-web-1 -f '{{range .Mounts}}{{if eq .Destination "/app/node_modules"}}{{.Name}}{{end}}{{end}}')
NET=$(docker inspect school-manager-rdc-web-1 -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
docker run --rm -v "$PWD:/app" -v "$NODE_VOL:/app/node_modules" -v /app/.next \
  --network "$NET" --env-file /run/base44/app.env \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgresql://school:schoolpass@postgres:5432/school?schema=public' \
  -e DIRECT_URL='postgresql://school:schoolpass@postgres:5432/school?schema=public' \
  -w /app node:22-bookworm npm run build
```

Reusing `node_modules` avoids a reinstall; the network name lets the build resolve `postgres`; `-v /app/.next`
creates a fresh volume used only by that run. `next build` type-checks every file, so this is also the type
gate. Verified with `web` up: exit 0, `web` kept answering 200, and `web`'s `.next` entry count was unchanged.

From a clean checkout, keep devDependencies in the install step too:

```bash
docker compose -f docker-compose.base44.yml run --rm -T --no-deps -e NODE_ENV=production web \
  sh -c 'npm install --include=dev --no-audit --no-fund && npx prisma generate && npm run build'
```

`docker compose run` gets its own `node_modules`/`.next` anonymous volumes, so that form never disturbs the
running dev server.

`tsconfig.json` uses `"target": "ES2017"`; `es5` made every `[...new Set(...)]` / `Map.entries()` a
`TS2802` error.

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

## Recherche du menu latéral mobile

`components/dashboards/MobileNavDrawer.tsx` (drawer sombre, mobile uniquement — la barre latérale desktop
reste dans `AppShell.tsx`) filtre les entrées du menu, puis interroge `/api/eleves` et `/api/enseignants`
quand la saisie atteint 2 caractères. Ces deux API exigent `DIRECTION_ECOLE` : la recherche n'est proposée
qu'aux rôles qui peuvent déjà ouvrir ces modules.

## Tests

- `npm test` — vitest unit tests (`tests/auth.test.ts`), no database needed. `vitest.config.ts` maps the `@/`
  alias, which Vitest does not read from `tsconfig.json`.
- `npm run test:db` — Postgres integration test; only runs when `RUN_DB_TESTS=true` and `DATABASE_URL` are set.
- `npx prisma validate` / `npm run build` for schema and production-build checks.

Never run `prisma migrate reset`, `db push --force-reset`, or anything that deletes tables or the
`postgres_data` volume.
