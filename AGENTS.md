# School Manager RDC — dev environment notes

## Stack

Next.js 14 (App Router) + Prisma + PostgreSQL + Tailwind. Session-cookie auth (same-origin, `sameSite: lax`).
Fichiers stockés dans un bucket privé Cloudflare R2 via le SDK S3 (`lib/storage.ts`) ; Supabase/PostgreSQL
reste la base de données et la source d'authentification.

## How it runs here

```bash
docker compose -f docker-compose.base44.yml up -d
```

- `postgres` — local PostgreSQL (user/pass `school`/`schoolpass`, db `school`), healthchecked with `pg_isready`.
- `s3mock` — bucket S3 local (développement) sur le port interne 9090, données persistées dans le volume
  `s3mock_data`. R2 est compatible S3 : le même code sert le bucket local et le bucket R2 de production.
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
- `.env.example` lists Supabase settings, but that integration is **not implemented** — the database is reached
  through Prisma (`DATABASE_URL`, `DIRECT_URL`). `SESSION_SECRET` is declared there but referenced nowhere in the
  code. Read at runtime: `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE`, `NODE_ENV`, `BASE44_PUBLIC_HOST_SUFFIX`,
  `SMTP_*` and the `S3_*` storage settings.
- **Stockage de fichiers : Cloudflare R2 via le SDK S3** (`lib/storage.ts`, `lib/file-validation.ts`,
  `lib/file-access.ts`). Le bucket est privé ; ce qui est stocké en base est une référence `/api/files/<clé>`.
  La lecture passe par `app/api/files/[...key]/route.ts`, qui authentifie l'appelant puis applique la règle du
  dossier propriétaire de la clé : `profile-photos/` et `dossiers-eleves/` → tout utilisateur connecté,
  `etablissements/<id>/` → `DIRECTION_ECOLE`, `bulletins/` → `ENSEIGNANT`, `chat-files/` → participant de la
  conversation ou membre du groupe (vérifié en base), tout le reste → 404.
- **`.env.base44-defaults`** contient les valeurs de développement (endpoint `http://s3mock:9090`). Il est listé
  en PREMIER `env_file`, avant `/run/base44/app.env` : les vrais secrets R2 fournis par l'utilisateur écrasent
  toujours ces valeurs. Ne jamais mettre un `S3_*` sous `environment:` (cela écraserait définitivement R2).
- **Repli sans R2** : si `S3_ENDPOINT`/`S3_BUCKET`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` sont absents,
  `saveUploadedFile()` réécrit dans `public/uploads` (comportement historique) et les fichiers déjà servis en
  `/uploads/...` restent accessibles — `parseFileUrl()` gère les deux formes, la migration est progressive.
- **Validation d'upload** : `validateUploadedFile()` (type MIME autorisé + extension cohérente avec ce type +
  taille) remplace les listes de types dispersées dans les routes. Limites : 5 Mo (photos), 10 Mo
  (documents/pièces jointes), plafonnées par `FILE_MAX_SIZE` si la variable est définie.
- **`S3_PUBLIC_ENDPOINT`** (facultatif) : quand il est défini, `/api/files/<clé>` répond 302 vers une URL signée
  temporaire au lieu de servir les octets. À définir sur Vercel, dont les fonctions serverless limitent la taille
  des réponses ; laisser vide en local (le navigateur ne peut pas résoudre `s3mock`).
- **`Bulletin.pdfUrl`** (colonne nullable ajoutée au schéma) référence le PDF archivé dans R2 au premier
  téléchargement ; le téléchargement suivant est servi depuis R2, en-têtes et format inchangés.

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

Stockage de fichiers (le cookie de session contient simplement l'identifiant de l'utilisateur actif) :

```bash
# 1. upload → renvoie {"profilePhotoUrl":"/api/files/profile-photos/<clé>"}
curl -s -H "Cookie: school_manager_session=<id>" -F "photo=@public/logo.png;type=image/png" \
  http://localhost:3000/api/users/me/photo
# 2. lecture authentifiée → 200 ; anonyme → 401 ; clé inconnue/dossier inconnu → 404
curl -s -o /dev/null -w "%{http_code}\n" -H "Cookie: school_manager_session=<id>" http://localhost:3000/api/files/<clé>
# 3. objet réellement écrit dans le bucket (aucun fichier dans public/uploads)
docker compose -f docker-compose.base44.yml exec -T web sh -c \
  "curl -s 'http://s3mock:9090/school-manager-rdc?list-type=2' | tr '<' '\n' | grep '^Key>'"
```

## Tests

- `npm test` — vitest unit tests (`tests/auth.test.ts`), no database needed. `vitest.config.ts` maps the `@/`
  alias, which Vitest does not read from `tsconfig.json`.
- `npm run test:db` — Postgres integration test; only runs when `RUN_DB_TESTS=true` and `DATABASE_URL` are set.
- `tests/storage.test.ts` — validation des fichiers (MIME, extension, taille), construction/interprétation des
  clés et règles de lecture ; aucun accès réseau, exécuté par `npm test`.
- `RUN_STORAGE_TESTS=true npm test -- tests/storage-s3.integration.test.ts` — aller-retour réel
  téléversement → lecture → suppression → URL signée contre le stockage configuré (`s3mock` en local, R2 avec
  les vrais `S3_*`). Ignoré sans `RUN_STORAGE_TESTS=true`.
- `npx tsx scripts/migrate-uploads-to-r2.ts [--apply]` — migration progressive des fichiers
  `/uploads/...` vers R2 (dry-run par défaut, idempotent, ne supprime jamais rien).
- `npx prisma validate` / `npm run build` for schema and production-build checks.

Never run `prisma migrate reset`, `db push --force-reset`, or anything that deletes tables or the
`postgres_data` volume.
