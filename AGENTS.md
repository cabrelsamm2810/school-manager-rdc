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
- **Le modèle `Enseignant` n'a aucun champ territorial.** `ecole` y est un simple libellé (pas de FK),
  et il n'existe ni province ni `ecoleId`. `crud-models.ts` marque donc `provinceField: false` pour ce
  module : sans cela `buildScopeWhere()` ajoutait un `where.province` inexistant et `/api/enseignants` répondait
  500 (`PrismaClientValidationError`) à tout rôle non national — y compris le compte de démonstration
  DIRECTION_ECOLE. Conséquence assumée : la liste des enseignants n'est pas filtrée par périmètre.
- **Règle de périmètre (source d'un 500 récurrent).** `buildScopeWhere()` ajoute par défaut `province` et
  `institution`. Tout appelant doit donc déclarer `provinceField: false` / `institutionField: false` (ou un nom
  de champ réel) dès que le modèle Prisma visé n'a pas ces colonnes, sinon Prisma rejette le `where` :
  « Unknown argument `province` ». Les modules CRUD concernés (`bureaux-fonctions`, `grades`, `dossiers`,
  `visites`, `services`, `notifications`, `paiements`, `classes-rdc`, `matieres-rdc`, `options-rdc`, `notes`)
  portent désormais ces deux drapeaux. Les routes `cahier-de-cote` passent `institutionField: false` et
  utilisent `ecoleNom` (libellé réel) comme repli provincial ; `Eleve`, qui n'a ni `province` ni
  `institution`, passe par la relation `ecole` via le helper `buildEleveScopeWhere()` de
  `lib/territory-filter.ts` (utilisé par `/api/eleves` et `/api/cahier-de-cote/options`).
  Vérification : `GET /api/<module>` avec un compte DIRECTION_ECOLE actif doit répondre 200, jamais 500.

- **Service worker (`public/sw.js`) et `next dev`.** En dev, les fichiers `_next/static/chunks/app/<page>/page.js`
  ne sont pas hashés : un cache-first dessus servait d'anciens bundles indéfiniment (page « Ce module est en cours
  de développement » + erreur d'hydratation alors que le serveur rendait la bonne page). `sw.js` ne met donc en
  cache `_next/static` que les fichiers à nom hashé (`isImmutableAsset`). Si un symptôme « le navigateur montre
  du vieux code » réapparaît : bumper `CACHE_VERSION` dans `sw.js` (purge les anciens caches à l'activation) et
  recharger deux fois (la 1re installe le nouveau SW, la 2e charge du code frais).

- **Diagnostics SQL : rôle et base sont `school` / `school`, rien d'autre.** Un `psql -U schoolmanager …` ou
  `-U school_manager …` (noms devinés) ne touche pas l'application mais écrit `FATAL: role "…" does not exist`
  dans les logs `postgres`, que la validation de la plateforme remonte ensuite comme une panne de base. Commande
  exacte : `docker compose -f docker-compose.base44.yml exec -T postgres psql -U school -d school -c '…'`.
  Les colonnes Prisma sont en camelCase : en SQL brut il faut les guillemeter (`"ecoleId"`, `e."ecoleId"`),
  sinon PostgreSQL les passe en minuscules et répond `column "ecoleid" does not exist`. Pour une simple lecture,
  préférer le client Prisma (`prisma.eleve.findMany(…)`) à du SQL brut.

## Noms de provinces et cascade Province → Province éduc. → Coordination SP

- **Une seule source de noms : `lib/provinces-rdc.ts`** (`PROVINCE_NAMES`, `PROVINCES_EDUCATIONNELLES`,
  `PROVINCES_EDUC_BY_ADMIN`). Ce sont exactement les libellés de la base (« Kongo Central », « Kasaï Central »,
  « Kasaï Oriental » avec espace, pas de trait d'union). `lib/meta-data.ts` (`allProvinces`,
  `educationProvincesByAdmin`) en est dérivé : ne jamais y recopier une liste à la main — une variante
  (« Kongo-Central ») casse silencieusement les listes en cascade, l'inscription et les filtres de périmètre
  (`where.province = user.provinceAdministrative`).
- `CoordSousProvinciale` n'a **pas** de lien vers la province éducationnelle (seulement `province`). Le dernier
  niveau de la cascade (formulaire école, filtre enseignants) filtre donc par province administrative et reste
  désactivé tant que la province éducationnelle n'est pas choisie.
- Vérification : `GET /api/meta` → `educationProvincesByAdmin['Kongo Central']` = 3 entrées, `Kinshasa` = 5 ;
  `GET /api/ecoles?provinceEducationnelle=…` filtre la liste.
- `npx tsc --noEmit --incremental false` (dans `web`) doit rester à zéro erreur : des erreurs de type ignorées
  cachaient des routes cassées (`valider`, `pointage` PDF).

## Comptes de démonstration

- **Enseignant** : `enseignant.demo@schoolmanager-rdc.cd` / `Enseignant2026`, rattaché à l'« École de
  démonstration » (`ecoleId` du compte DIRECTION_ECOLE de démo). Créé et remis à jour par
  `npm run seed:demo-enseignant` (`scripts/seed-demo-enseignant.ts`) : le script est idempotent
  (upsert par email), force `role=ENSEIGNANT`, `isActive=true`, l'école de démo, et génère
  les présences des 30 derniers jours (jours ouvrables) **uniquement si la table `presences` est
  vide** — ce sont elles qui alimentent les taux de présence du tableau de bord. Sans ce seed, le
  tableau de bord enseignant n'affiche que les effectifs par classe (280 élèves, 10 classes).
  À relancer après une remise à zéro des données.
- Connexion : `POST /api/auth/login` avec `{email, password}` pose les cookies
  `school_manager_session` + `school_manager_role`, puis `GET /api/enseignant/dashboard` doit
  répondre 200 (403 pour tout autre rôle).

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

## Accès restreint par rôle exact

Quatre espaces sont propres à un rôle et ne doivent pas s'ouvrir aux rôles supérieurs (SUPER_ADMIN compris) :
`/enseignant/dashboard` → `ENSEIGNANT`, `/coordination-nationale` → `COORDINATION_NATIONALE`,
`/coordination-provinciale` → `COORDINATION_PROVINCIALE`, `/coordination-sous-provinciale` →
`COORDINATION_SOUS_PROVINCIALE`. Trois points les garantissent :

- `middleware.ts` — `ROUTE_EXACT_ROLE` impose le rôle exact côté route (toute autre valeur du cookie
  `school_manager_role` est redirigée vers `/dashboard`), car `ROUTE_MIN_ROLE` seul laisse passer les rangs
  supérieurs.
- `lib/navigation.ts` — un élément de menu peut porter `roles: ['ENSEIGNANT']` (rôles exacts, prioritaire sur
  `minRole`) ; `visibleNavigationGroups()` filtre dessus, donc la barre latérale, le drawer mobile et la grille
  de services suivent automatiquement.
- Les raccourcis codés en dur (`components/dashboards/QuickActions.tsx`, `BottomNav.tsx`, `SchoolDashboard.tsx`)
  filtrent leurs liens avec `canAccessPath(role, href)` : plus d'alignement manuel, un lien affiché est
  toujours ouvrable. `NationalDashboard`/`ProvincialDashboard` restent alignés à la main (leurs liens sont
  conditionnés par la portée du rôle) — à revérifier si vous les modifiez. L'API d'un espace réservé porte la
  même règle que sa page (`/api/enseignant/dashboard` → 403 si `user.role !== 'ENSEIGNANT'`, sinon un PARENT
  lit l'effectif par classe).

Ces règles vivent désormais dans `lib/route-access.ts` (`ROUTE_MIN_ROLE`, `ROUTE_EXACT_ROLE`,
`getExactRoleForPath`, `getMinRoleForPath`, `canAccessPath`), importé par `middleware.ts` (qui redirige) **et**
par les raccourcis de l'interface : les deux ne peuvent plus diverger. `ROLE_RANK`/`ROLE_LABELS` sont dans
`lib/roles.ts` (module pur, sans Prisma, importable par le middleware edge) et ré-exportés par `lib/rbac.ts`.

`ROUTE_MIN_ROLE` reprend le `minRole` du menu pour les modules qui n'étaient pas gardés côté route
(`/cahier-de-cote`, `/rappels-cotes`, `/recherche-eleves`, `/classes-rdc`, `/matieres-rdc`, `/options-rdc`,
`/import`, `/provinces-educationnelles`, `/sous-divisions`) : le menu les masquait déjà, la page s'ouvrait
quand même. `/rappels-cotes` est réservé à `DIRECTION_ECOLE` (menu, route et `/api/rappels-cotes`), et
`/recherche-eleves` aussi parce que la page ne lit que `/api/eleves` (DIRECTION_ECOLE).

Vérification : pour les 10 rôles × 28 routes, `canAccessPath(role, route)` doit être vrai **si et seulement si**
le curl avec `Cookie: school_manager_session=demo; school_manager_role=<ROLE>` répond 200 (307 = redirection).
Toute divergence = page ouverte à tort ou lien mort.

Le tableau de bord enseignant lit `/api/enseignant/eleves` (lecture seule, `user.role !== 'ENSEIGNANT'` → 403)
pour les listes de classes/élèves de `components/enseignant/PresenceManager.tsx` : `/api/eleves` reste fermé à
ENSEIGNANT (module de gestion `DIRECTION_ECOLE`) — ne pas y rebrancher ces composants, ils resteraient vides.
Le périmètre vient de `buildEleveScopeWhere()` (école, repli province), partagé avec
`/api/enseignant/dashboard`.

Vérification : `curl` sur `/enseignant/dashboard` avec `school_manager_role=DIRECTION_ECOLE` → 307 vers
`/dashboard` ; avec `school_manager_role=ENSEIGNANT` → 200. Idem `/coordination-nationale` :
`COORDINATION_NATIONALE` → 200, `SUPER_ADMIN` et `COORDINATION_PROVINCIALE` → 307.

## Recherche du menu latéral mobile

`components/dashboards/MobileNavDrawer.tsx` (drawer sombre, mobile uniquement — la barre latérale desktop
reste dans `AppShell.tsx`) filtre les entrées du menu, puis interroge `/api/eleves` et `/api/enseignants`
quand la saisie atteint 2 caractères. Ces deux API exigent `DIRECTION_ECOLE` : la recherche n'est proposée
qu'aux rôles qui peuvent déjà ouvrir ces modules.

## SchoolChat (interface)

`app/schoolchat/page.tsx` → `components/SchoolChat.tsx` (conversations + groupes + appels),
assisté de composants focalisés dans `components/chat/` : `ChatHeader`, `ConversationListItem`
(mémoïsé), `ChatBubble`, `ChatComposer`, `VoiceMessagePlayer`, `FileBubble`, `AttachmentMenu`.
Points à connaître avant d'y toucher :

- **Une seule photo de profil.** Tout passe par `components/ui/Avatar.tsx` (`xs`…`xl`, plus `2xs`
  pour les bulles). Ne pas réintroduire d'`<img>` de photo concurrent : la synchro est automatique,
  `/api/chat/*` renvoie `profilePhotoUrl`, rafraîchi par le polling de 5 s, et le compte change sa
  photo côté profil (URL horodatée `?t=`).
- **Aucune donnée de présence en base.** Ni `lastSeen` ni `isOnline` dans `User` : ne jamais afficher
  un indicateur « en ligne » inventé. Le sous-titre d'une conversation est le libellé de rôle.
- **Hauteur de la page.** Le conteneur racine est `h-[calc(100dvh-3.5rem-68px)] lg:h-[calc(100vh-3.5rem)]` :
  3.5rem pour la barre supérieure d'`AppShell`, 68 px pour la `BottomNav` mobile (déjà comptés dans le
  `pb-[68px]` du `<main>`). Une hauteur en `100vh` recouvre la barre de saisie sous la navigation mobile.
  `app/layout.tsx` exporte `viewport.interactiveWidget = 'resizes-content'` pour que le clavier Android
  réduise la page au lieu de masquer le champ.
- **Taille des pièces jointes.** `ChatMessage`/`ChatGroupMessage` n'ont pas de colonne `fileSize` :
  `lib/chat-files.ts` (`getStoredFileSize`) la lit sur disque côté serveur et les routes messages
  l'ajoutent à la réponse (POST : taille du fichier reçu). Sans cela la taille disparaissait après l'envoi.
- **Re-rendus.** `ConversationListItem` et `ChatBubble` sont mémoïsés : `onSelect`/`onReply`… doivent rester
  stables (`useCallback`). `loadMessages` ignore une réponse identique (clé id+lu) pour ne pas re-rendre
  tout le fil à chaque polling de 5 s.

Vérification de l'interface (aucune conversation n'existe après un `db push` propre) : se connecter
(`POST /api/auth/login`) avec les deux comptes de démonstration, `POST /api/chat/conversations`
`{otherUserId}` puis `POST …/messages` (texte, `-F file=@x.pdf;type=application/pdf`,
`-F file=@x.wav;type=audio/wav`). Supprimer ensuite la conversation (`DELETE` en base, la cascade
emporte les messages) **et** les fichiers écrits dans `public/uploads/chat-files/` — ce dossier contient
des fichiers suivis par git, ne jamais le vider en bloc.

## Tests

- `npm test` — vitest unit tests (`tests/auth.test.ts`), no database needed. `vitest.config.ts` maps the `@/`
  alias, which Vitest does not read from `tsconfig.json`.
- `npm run test:db` — Postgres integration test; only runs when `RUN_DB_TESTS=true` and `DATABASE_URL` are set.
- `npx prisma validate` / `npm run build` for schema and production-build checks.

Never run `prisma migrate reset`, `db push --force-reset`, or anything that deletes tables or the
`postgres_data` volume.
