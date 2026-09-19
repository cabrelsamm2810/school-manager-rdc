# School Manager RDC

## Supabase + Prisma configuration

Prisma is configured for PostgreSQL with two connection URLs:

- `DATABASE_URL`: Supabase Transaction Pooler URL, normally port `6543`, with `pgbouncer=true` and `connection_limit=1`.
- `DIRECT_URL`: Supabase direct/session connection, normally port `5432`, used by Prisma CLI for migrations.

Do not commit `.env`, `.env.local`, credentials, private keys, or generated certificates. Use `.env.example` only as a template.

### Obtain the URLs in Supabase

1. Open the Supabase project.
2. Go to **Project Settings > Database**.
3. Open **Connection string**.
4. Copy the **Transaction pooler** URI into `DATABASE_URL`.
5. Copy the **Session pooler** or direct connection URI into `DIRECT_URL`.
6. Replace the local placeholders with the project reference and database password locally only.

If the database password is unknown, reset it in **Project Settings > Database**. Do not paste it into chat or GitHub.

## Local validation without connecting to PostgreSQL

`prisma generate` reads the schema and generates the client; it does not need a live database connection:

```bash
npm install
npx prisma generate
npm run build
npm test
```

The following commands do require a configured Supabase connection and must be run only after creating `.env` locally:

```bash
npx prisma migrate dev --name auth_initial
npm run prisma:seed
```

No reset, force-reset, or destructive database command is part of this setup.
