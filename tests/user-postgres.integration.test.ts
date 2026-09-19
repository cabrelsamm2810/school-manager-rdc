import { describe, expect, it } from 'vitest';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

const enabled = process.env.RUN_DB_TESTS === 'true' && Boolean(process.env.DATABASE_URL);

describe('User PostgreSQL integration', () => {
  it.skipIf(!enabled)('enregistre puis récupère un utilisateur dans une transaction annulée', async () => {
    const email = `integration-${Date.now()}@example.invalid`;
    const passwordHash = await hashPassword('MotDePasseIntegration123!');

    let observedEmail: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            nom: 'Test',
            postNom: 'Integration',
            prenom: 'PostgreSQL',
            email,
            telephone: '',
            passwordHash,
            role: 'ELEVE'
          }
        });

        const loaded = await tx.user.findUnique({ where: { id: created.id } });
        observedEmail = loaded?.email ?? null;

        // Rollback volontaire : aucune donnée de test ne reste dans Supabase.
        throw new Error('ROLLBACK_INTEGRATION_TEST');
      });
    } catch (error) {
      expect((error as Error).message).toBe('ROLLBACK_INTEGRATION_TEST');
    }

    expect(observedEmail).toBe(email);
  });
});
