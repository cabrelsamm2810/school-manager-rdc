import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Les rôles sont un enum Prisma : aucun compte ni secret n'est créé par défaut.
  // Le SUPER_ADMIN doit être créé via une procédure contrôlée hors inscription publique.
  const roleCounts = await Promise.all(
    Object.values(Role).map((role) =>
      prisma.user.count({ where: { role } })
    )
  );

  console.log(`Seed vérifié : ${roleCounts.length} rôles disponibles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
