import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

const mocks = vi.hoisted(() => ({ sendValidationCode: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/mail', () => ({ sendValidationCode: mocks.sendValidationCode }));

import prisma from '@/lib/prisma';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as resend } from '@/app/api/auth/resend/route';
import { POST as verify } from '@/app/api/auth/verify/route';
import { CODE_TTL_MS } from '@/lib/email-verification';

const enabled = process.env.RUN_DB_TESTS === 'true' && Boolean(process.env.DATABASE_URL);
const createdIds: string[] = [];
const request = (path: string, body: unknown) => new NextRequest(`http://localhost/api/auth/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

beforeEach(() => { mocks.sendValidationCode.mockReset().mockResolvedValue(undefined); });
afterEach(async () => {
  for (const id of createdIds.splice(0)) await prisma.user.delete({ where: { id } });
});

async function registerTestAccount() {
  const email = `smtp-audit-${randomUUID()}@example.invalid`;
  const response = await register(request('register', { nom: 'Audit', prenom: 'SMTP', email, password: 'LocalAuditPassword123!', role: 'ELEVE' }));
  const result = await response.json();
  if (result.user?.id) createdIds.push(result.user.id);
  expect(response.status).toBe(201);
  expect(result.verificationEmailSent).toBe(true);
  expect(result.user).not.toHaveProperty('validationCode');
  const id = result.user.id as string;
  return { email, id };
}

async function stateFor(id: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  return { user, state: JSON.parse(user.validationCode!) };
}

describe.skipIf(!enabled)('activation persistante sur PostgreSQL (SMTP simulé, aucune adresse extérieure)', () => {
  it('inscrit, rejette un mauvais code, active une fois et efface le code', async () => {
    const { email, id } = await registerTestAccount();
    const { state } = await stateFor(id);
    expect(mocks.sendValidationCode).toHaveBeenCalledWith(email, state.code, 'SMTP');
    const wrongCode = state.code === '000000' ? '000001' : '000000';
    expect((await verify(request('verify', { email, code: wrongCode }))).status).toBe(400);
    expect((await stateFor(id)).state.attempts).toBe(1);
    expect((await verify(request('verify', { email, code: state.code }))).status).toBe(200);
    const active = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(active).toMatchObject({ isActive: true, userStatus: 'ACTIF', validationCode: null });
    expect((await verify(request('verify', { email, code: state.code }))).status).toBe(400);
  });

  it('refuse l’expiration, renouvelle une seule fois sous concurrence et préserve le code après échec SMTP', async () => {
    const { email, id } = await registerTestAccount();
    const { state } = await stateFor(id);
    state.expiresAt = Date.now() - 1;
    state.resendAfter = 0;
    await prisma.user.update({ where: { id }, data: { validationCode: JSON.stringify(state) } });
    expect((await verify(request('verify', { email, code: state.code }))).status).toBe(400);
    mocks.sendValidationCode.mockClear();
    const results = await Promise.all([resend(request('resend', { email })), resend(request('resend', { email }))]);
    expect(results.map(r => r.status).sort()).toEqual([200, 429]);
    expect(mocks.sendValidationCode).toHaveBeenCalledTimes(1);
    const renewed = (await stateFor(id)).state;
    expect(renewed.expiresAt).toBeGreaterThan(Date.now());
    expect(renewed.expiresAt).toBeLessThanOrEqual(Date.now() + CODE_TTL_MS);
    await prisma.user.update({ where: { id }, data: { validationCode: JSON.stringify({ ...renewed, resendAfter: 0 }) } });
    mocks.sendValidationCode.mockRejectedValue(new Error('Local SMTP failure'));
    expect((await resend(request('resend', { email }))).status).toBe(503);
    const afterFailure = (await stateFor(id)).state;
    expect(afterFailure.code).toBe(renewed.code);
    expect(afterFailure.expiresAt).toBe(renewed.expiresAt);
    expect((await resend(request('resend', { email }))).status).toBe(429);
    expect((await verify(request('verify', { email, code: renewed.code }))).status).toBe(200);
  });

  it('persiste les limites de tentatives et interdit la réactivation des comptes suspendus', async () => {
    const { email, id } = await registerTestAccount();
    const { state } = await stateFor(id);
    for (let i = 0; i < 5; i++) expect((await verify(request('verify', { email, code: '000000' }))).status).toBe(400);
    expect((await verify(request('verify', { email, code: state.code }))).status).toBe(429);
    expect((await stateFor(id)).state.attempts).toBe(5);
    await prisma.user.update({ where: { id }, data: { userStatus: 'SUSPENDU' } });
    expect((await verify(request('verify', { email, code: state.code }))).status).toBe(403);
    expect((await resend(request('resend', { email }))).status).toBe(403);
  });
});
