import prisma from '@/lib/prisma';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL n’est pas configurée.');
  }

  await prisma.$queryRaw`SELECT 1`;
  console.log('Connexion PostgreSQL réussie.');
}

main()
  .catch(() => {
    console.error('Connexion PostgreSQL échouée.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
