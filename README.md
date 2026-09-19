# School Manager RDC

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
