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
