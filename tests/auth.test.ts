import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { hasAtLeastRole, isSuperAdmin } from '@/lib/rbac';

describe('auth helpers', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('MonMotDePasse123');
    const isValid = await verifyPassword('MonMotDePasse123', hash);
    expect(isValid).toBe(true);
  });

  it('checks RBAC hierarchy', () => {
    expect(isSuperAdmin('SUPER_ADMIN')).toBe(true);
    expect(hasAtLeastRole('DIRECTION_ECOLE', 'ELEVE')).toBe(true);
    expect(hasAtLeastRole('ELEVE', 'DIRECTION_ECOLE')).toBe(false);
  });
});
