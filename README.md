# School Manager RDC

## Stockage des fichiers — Cloudflare R2

Les fichiers (photos de profil et des élèves, bulletins PDF, documents administratifs, pièces jointes de
SchoolChat) sont stockés dans un **bucket R2 privé** via le SDK S3, côté serveur uniquement. La base de
données et l'authentification restent sur Supabase/PostgreSQL (Prisma) : Supabase ne conserve que les
métadonnées et la référence du fichier (`/api/files/<clé>`).

- Aucune clé n'est exposée au navigateur : pas de préfixe `NEXT_PUBLIC_`, aucun secret dans le code.
- La lecture passe par `GET /api/files/<clé>` : authentification puis vérification des autorisations
  (dossier, rôle, appartenance à la conversation ou au groupe) avant délivrance.
- Validation systématique du type MIME, de l'extension et de la taille avant chaque téléversement.
- Les fichiers historiques (`public/uploads/...`) restent lisibles ; la migration vers R2 est progressive
  et ne supprime aucune donnée :

```bash
npx tsx scripts/migrate-uploads-to-r2.ts          # simulation (dry-run)
npx tsx scripts/migrate-uploads-to-r2.ts --apply  # migration réelle
```

### Variables d'environnement (Vercel)

À définir dans **Project > Settings > Environment Variables** (ne jamais les commiter) :

| Variable | Description |
| --- | --- |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` pour R2 |
| `S3_BUCKET` | Nom du bucket privé |
| `S3_ACCESS_KEY_ID` | Access Key ID du token API R2 |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key du token API R2 |
| `S3_PUBLIC_ENDPOINT` | Facultatif, recommandé sur Vercel : endpoint joignable par le navigateur ; les lectures renvoient alors une URL signée temporaire au lieu de servir les octets |
| `S3_FORCE_PATH_STYLE` | `true` (défaut) |
| `S3_SIGNED_URL_TTL` | Facultatif, durée de validité des URL signées en secondes (défaut 300) |

Le token API R2 se crée dans **Cloudflare > R2 > Manage R2 API Tokens** avec les droits *Object Read & Write*
sur le bucket. Sans ces variables, l'application continue de fonctionner avec le stockage local
(`public/uploads`), sans erreur au démarrage.

## Validation PostgreSQL

Les commandes suivantes utilisent les variables d’environnement locales et ne révèlent jamais leur contenu :

```bash
npm install
npx prisma validate
npx prisma generate
npm run prisma:check
npm test
npm run test:db
npm run build
```

`npm run test:db` est ignoré automatiquement si `RUN_DB_TESTS=true` et `DATABASE_URL` ne sont pas disponibles. Lorsqu’il est activé, le test crée un utilisateur dans une transaction puis provoque un rollback volontaire ; aucune donnée de test n’est conservée.

Pour appliquer les migrations déjà présentes sans réinitialiser la base :

```bash
npm run prisma:deploy
```

Pour une migration de développement non destructive après revue du schéma :

```bash
npx prisma migrate dev --name auth_initial
```

Ne pas utiliser `prisma migrate reset`, `prisma db push --force-reset` ou une commande de suppression de tables.
