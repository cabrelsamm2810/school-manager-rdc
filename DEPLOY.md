# Déploiement sur Vercel

## Variables d'environnement à définir dans Vercel

> **Project > Settings > Environment Variables** — définir pour Production, Preview et Development.

### Base de données (Supabase)

Récupérer les valeurs dans **Supabase > Project Settings > Database > Connection string**.

| Variable | Valeur | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.<ref>:<password>@<pooler-host>:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require` | Transaction Pooler (port 6543) — utilisé par l'app à l'exécution |
| `DIRECT_URL` | `postgresql://postgres.<ref>:<password>@<db-host>:5432/postgres?sslmode=require` | Session/direct (port 5432) — utilisé par Prisma CLI (migrations, `db push`) |

### Stockage de fichiers (Cloudflare R2)

Récupérer les valeurs dans **Cloudflare > R2 > Overview > Manage R2 API Tokens**.

Le code lit `S3_*` en priorité, puis `R2_*` en repli. Vous pouvez utiliser l'un ou l'autre.

| Variable | Valeur | Description |
|---|---|---|
| `R2_ACCOUNT_ID` | `<account-id>` | ID du compte Cloudflare |
| `R2_BUCKET_NAME` | `<bucket-name>` | Nom du bucket R2 (privé) |
| `R2_ACCESS_KEY_ID` | `<access-key>` | Clé d'accès R2 (Object Read & Write) |
| `R2_SECRET_ACCESS_KEY` | `<secret-key>` | Clé secrète R2 |
| `R2_PUBLIC_URL` | `https://<account-id>.r2.cloudflarestorage.com` | Endpoint public R2 (pour URL signées) |

> **Note** : `S3_PUBLIC_ENDPOINT` (ou `R2_PUBLIC_URL`) est **recommandé sur Vercel** : les fonctions serverless limitent la taille des réponses, donc `/api/files/<clé>` redirige vers une URL signée temporaire au lieu de servir les octets.

### Email (SMTP)

| Variable | Description |
|---|---|
| `SMTP_HOST` | Serveur SMTP |
| `SMTP_PORT` | Port SMTP (ex. 587) |
| `SMTP_USER` | Utilisateur SMTP |
| `SMTP_PASS` | Mot de passe SMTP |
| `SMTP_FROM` | Adresse d'expéditeur |

### Application

| Variable | Valeur par défaut | Description |
|---|---|---|
| `SESSION_COOKIE_NAME` | `school_manager_session` | Nom du cookie de session |
| `SESSION_MAX_AGE` | `604800` | Durée de session (secondes) |
| `NEXT_PUBLIC_APP_NAME` | `School Manager RDC` | Nom public de l'application |
| `S3_SIGNED_URL_TTL` | `300` | Durée de validité des URL signées (secondes) |
| `FILE_MAX_SIZE` | `10485760` | Taille max par fichier (octets) |

## Étapes de déploiement

1. Connecter le dépôt à Vercel
2. Définir toutes les variables d'environnement ci-dessus
3. Le `postinstall` exécute `prisma generate` automatiquement
4. Pour appliquer le schéma à Supabase : `npx prisma db push` (en local avec `DIRECT_URL` pointant vers Supabase)
5. Optionnel : exécuter le seed avec `npx tsx prisma/seed.ts`
6. Déployer

## Erreurs courantes

### `Environment variable not found: DIRECT_URL` (P1012)
→ `DIRECT_URL` n'est pas définie dans Vercel. Vérifier Project > Settings > Environment Variables.

### `Can't reach database server`
→ `DATABASE_URL` ou `DIRECT_URL` est incorrecte. Vérifier le format et les credentials Supabase.

### Fichiers non accessibles (404 sur /api/files/...)
→ Les variables R2 ne sont pas définies. Sans stockage configuré, l'app retombe sur `public/uploads` qui n'existe pas sur Vercel (système de fichiers éphémère). Définir les variables R2.

## Sauvegarde automatique vers main

`.github/workflows/sauvegarde-auto.yml` reporte toutes les 15 minutes dans `main` les commits déjà poussés sur la
branche de travail (`github-backup-codespace` par défaut ; modifiable via `env.SOURCE_BRANCH` ou un lancement
manuel depuis l'onglet Actions). Avance rapide quand c'est possible, fusion classique en cas de divergence, et
arrêt sans rien pousser en cas de conflit.

À retenir :

- Le déclencheur `schedule` ne s'exécute que si le fichier est présent sur la branche **par défaut** (`main`) : la
  sauvegarde ne démarre donc qu'après la fusion du workflow dans `main`.
- Un workflow ne voit que ce qui est **déjà poussé** sur GitHub : des fichiers modifiés mais non commités dans un
  codespace ne peuvent pas être repris (`git commit` + `git push` côté codespace d'abord).
- Le `GITHUB_TOKEN` ne contourne pas une protection de branche : si `main` exige une pull request, le push échoue
  et le journal du job le dit.
- Chaque sauvegarde qui modifie `main` déclenche un déploiement Vercel.
- GitHub peut retarder un cron, et désactive les workflows planifiés d'un dépôt resté 60 jours sans activité
  (relancer alors un passage depuis l'onglet Actions).
