# School Manager RDC

Plateforme scolaire destinée à la RDC, migrée progressivement depuis l’ancienne version Base44 vers une architecture moderne basée sur Next.js + TypeScript + PostgreSQL + Prisma + stockage externe compatible S3.

## Objectif
- rester compatible avec les milliers d’utilisateurs à venir
- préserver l’ancienne version Base44 intacte
- préparer une architecture modulaire et évolutive
- utiliser des variables d’environnement pour les secrets
- externaliser les fichiers et photos de profil

## Stack
- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- stockage S3-compatible
- validation Zod
- architecture RBAC

## Structure principale
- app/
- components/
- lib/
- prisma/
- public/
- types/

## Variables d’environnement
Voir `.env.example`.

## Démarrage
```bash
npm install
cp .env.example .env
npx prisma generate
npm run test
npm run dev
```

## Migration progressive
Voir `MIGRATION.md`.

## Sécurité
- pas de secrets dans le code
- validation côté serveur
- contrôle d’accès côté serveur
- fichiers stockés hors PostgreSQL
- permissions explicites sur les fichiers et conversations

## Important
Cette version est la fondation de la nouvelle architecture. L’ancienne version Base44 n’a pas été supprimée ni modifiée.

---

School Manager RDC — architecture préparée pour évoluer progressivement.
