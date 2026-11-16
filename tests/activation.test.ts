import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn(),
  sendValidationCode: vi.fn(), hashPassword: vi.fn(), verifyPassword: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ default: { user: {
  findFirst: mocks.findFirst, create: mocks.create, updateMany: mocks.updateMany,
} } }));
vi.mock('@/lib/mail', () => ({ sendValidationCode: mocks.sendValidationCode }));
vi.mock('@/lib/auth', () => ({ hashPassword: mocks.hashPassword, verifyPassword: mocks.verifyPassword }));

import { POST as resend } from '@/app/api/auth/resend/route';
import { POST as verify } from '@/app/api/auth/verify/route';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';
import { createVerification, CODE_TTL_MS, MAX_VERIFICATION_ATTEMPTS, RESEND_COOLDOWN_MS } from '@/lib/email-verification';

const pendingUser = {
  id: 'activation-test', nom: 'Test', prenom: 'Activation', email: 'Compte@Example.invalid',
  passwordHash: 'hashed-password', role: 'ELEVE', isActive: false,
  userStatus: 'EN_ATTENTE', validationCode: '123456' as string | null, createdAt: new Date(),
};
let storedUser = { ...pendingUser };
function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}
const resendRequest = () => resend(request('resend', { email: pendingUser.email }));
const verifyRequest = (code = '123456') => verify(request('verify', { email: pendingUser.email, code }));

beforeEach(() => {
  vi.resetAllMocks();
  storedUser = { ...pendingUser, createdAt: new Date() };
  mocks.findFirst.mockImplementation(async () => ({ ...storedUser }));
  mocks.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.validationCode !== storedUser.validationCode || storedUser.isActive || storedUser.userStatus !== 'EN_ATTENTE') return { count: 0 };
    Object.assign(storedUser, data);
    return { count: 1 };
  });
  mocks.create.mockImplementation(async ({ data }) => ({ ...storedUser, ...data }));
  mocks.sendValidationCode.mockResolvedValue(undefined);
  mocks.hashPassword.mockResolvedValue('hashed-password');
  mocks.verifyPassword.mockResolvedValue(true);
});

describe('régressions de sécurité reproduites pendant l’audit', () => {
  it('refuse un ancien code expiré', async () => {
    storedUser.createdAt = new Date('2020-01-01');
    expect((await verifyRequest()).status).toBe(400);
    expect(storedUser.isActive).toBe(false);
  });
  it('empêche deux renvois simultanés pour le même compte', async () => {
    const responses = await Promise.all([resendRequest(), resendRequest()]);
    expect(responses.filter(response => response.status === 200)).toHaveLength(1);
    expect(responses.filter(response => response.status === 429)).toHaveLength(1);
    expect(mocks.sendValidationCode).toHaveBeenCalledTimes(1);
  });
});

describe('activation et renvoi du code', () => {
  it('renvoie le même code encore valable et normalise les adresses', async () => {
    const response = await resend(request('resend', { email: '  COMPTE@example.invalid  ' }));
    expect(response.status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { email: { equals: 'compte@example.invalid', mode: 'insensitive' } } });
    expect(mocks.sendValidationCode).toHaveBeenCalledWith(pendingUser.email, '123456', 'Activation');
    expect(JSON.parse(storedUser.validationCode!).code).toBe('123456');
    expect(await response.json()).not.toHaveProperty('code');
  });
  it('un échec SMTP préserve le code et la date d’expiration, sans fausse confirmation', async () => {
    mocks.sendValidationCode.mockRejectedValue(new Error('SMTP unavailable'));
    const response = await resendRequest();
    expect(response.status).toBe(503);
    const saved = JSON.parse(storedUser.validationCode!);
    expect(saved.code).toBe('123456');
    expect(saved.expiresAt).toBe(storedUser.createdAt.getTime() + CODE_TTL_MS);
    expect((await response.json()).error).toContain('indisponible');
    expect((await resendRequest()).status).toBe(429);
  });
  it('crée un code si le compte n’en possède pas', async () => {
    storedUser.validationCode = null;
    expect((await resendRequest()).status).toBe(200);
    const code = JSON.parse(storedUser.validationCode!).code;
    expect(code).toMatch(/^\d{6}$/);
    expect(mocks.sendValidationCode).toHaveBeenCalledWith(pendingUser.email, code, 'Activation');
  });
  it('renouvelle un code expiré, pas un code encore valable', async () => {
    const old = createVerification(Date.now() - CODE_TTL_MS - 1000);
    storedUser.validationCode = JSON.stringify(old);
    expect((await resendRequest()).status).toBe(200);
    expect(JSON.parse(storedUser.validationCode!).expiresAt).toBeGreaterThan(Date.now());
    expect(mocks.sendValidationCode).toHaveBeenCalledTimes(1);
  });
  it('impose 60 secondes entre envois et cinq envois par heure', async () => {
    expect((await resendRequest()).status).toBe(200);
    const limited = await resendRequest();
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0);
    const state = JSON.parse(storedUser.validationCode!);
    storedUser.validationCode = JSON.stringify({ ...state, sends: 5, resendAfter: 0 });
    expect((await resendRequest()).status).toBe(429);
    expect(mocks.sendValidationCode).toHaveBeenCalledTimes(1);
  });
  it('le renvoi ne réinitialise pas les tentatives ni la durée de vie', async () => {
    const state = { ...createVerification(), attempts: 4 };
    storedUser.validationCode = JSON.stringify(state);
    expect((await resendRequest()).status).toBe(200);
    const saved = JSON.parse(storedUser.validationCode!);
    expect(saved.attempts).toBe(4);
    expect(saved.expiresAt).toBe(state.expiresAt);
    expect(saved.resendAfter).toBeGreaterThan(Date.now() + RESEND_COOLDOWN_MS - 1000);
  });
  it('valide une seule fois, synchronise le statut et ne crée pas de session', async () => {
    const response = await verify(request('verify', { email: ' COMPTE@example.invalid ', code: ' 123456 ' }));
    expect(response.status).toBe(200);
    expect(storedUser).toMatchObject({ isActive: true, userStatus: 'ACTIF', validationCode: null });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect((await verifyRequest()).status).toBe(400);
  });
  it('rejette un mauvais code et limite durablement les tentatives', async () => {
    for (let i = 0; i < MAX_VERIFICATION_ATTEMPTS; i++) expect((await verifyRequest('654321')).status).toBe(400);
    expect((await verifyRequest()).status).toBe(429);
    expect(JSON.parse(storedUser.validationCode!).attempts).toBe(MAX_VERIFICATION_ATTEMPTS);
    expect(storedUser.isActive).toBe(false);
  });
  it('rejette un code expiré à la limite exacte', async () => {
    storedUser.validationCode = JSON.stringify({ ...createVerification(), expiresAt: Date.now() });
    expect((await verifyRequest()).status).toBe(400);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
  it('ne perd pas des tentatives simultanées et permet de réessayer après conflit', async () => {
    const responses = await Promise.all([verifyRequest('654321'), verifyRequest('654321')]);
    expect(responses.map(r => r.status).sort()).toEqual([400, 409]);
    expect(JSON.parse(storedUser.validationCode!).attempts).toBe(1);
  });
  it('refuse un code non numérique', async () => {
    expect((await verifyRequest('abcdef')).status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
  it.each(['SUSPENDU', 'DESACTIVE'])('ne réactive jamais un compte %s', async (userStatus) => {
    storedUser.userStatus = userStatus;
    expect((await verifyRequest()).status).toBe(403);
    expect((await resendRequest()).status).toBe(403);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.sendValidationCode).not.toHaveBeenCalled();
  });
  it('refuse un compte déjà validé', async () => {
    storedUser.isActive = true;
    expect((await verifyRequest()).status).toBe(400);
    expect((await resendRequest()).status).toBe(400);
  });
  it('refuse un compte introuvable et un corps invalide', async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await verifyRequest()).status).toBe(404);
    expect((await resendRequest()).status).toBe(404);
    expect((await resend(request('resend', { email: '' }))).status).toBe(400);
    expect((await verify(request('verify', null))).status).toBe(400);
  });
});

describe('inscription et connexion avant activation', () => {
  const registration = () => register(request('register', {
    nom: 'Test', prenom: 'Activation', email: ' COMPTE@example.invalid ', password: 'TestPassword123!', role: 'ELEVE',
  }));
  it('conserve le compte en cas d’échec SMTP sans divulguer le code', async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.sendValidationCode.mockRejectedValue(new Error('SMTP unavailable'));
    const response = await registration();
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.verificationEmailSent).toBe(false);
    expect(result.user).not.toHaveProperty('validationCode');
    expect(result.user).not.toHaveProperty('passwordHash');
    const data = mocks.create.mock.calls[0][0].data;
    expect(data.email).toBe('compte@example.invalid');
    expect(JSON.parse(data.validationCode).expiresAt).toBeGreaterThan(Date.now());
  });
  it('envoie un seul code numérique à l’inscription', async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await registration()).status).toBe(201);
    expect(mocks.sendValidationCode).toHaveBeenCalledTimes(1);
    expect(mocks.sendValidationCode.mock.calls[0][1]).toMatch(/^\d{6}$/);
  });
  it('ne renvoie pas d’email pour une inscription déjà existante', async () => {
    expect((await registration()).status).toBe(400);
    expect(mocks.sendValidationCode).not.toHaveBeenCalled();
  });
  it('ne propose l’activation qu’après vérification du mot de passe', async () => {
    mocks.verifyPassword.mockResolvedValue(false);
    const response = await login(request('login', { email: pendingUser.email, password: 'WrongPassword123!' }));
    expect(response.status).toBe(401);
    expect((await response.json()).needsValidation).toBe(false);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('permet de poursuivre vers l’activation pour un compte en attente', async () => {
    const response = await login(request('login', { email: pendingUser.email, password: 'TestPassword123!' }));
    expect(response.status).toBe(401);
    expect((await response.json()).needsValidation).toBe(true);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
  it('connecte un compte activé avec une adresse de casse différente', async () => {
    storedUser.isActive = true;
    storedUser.userStatus = 'ACTIF';
    const response = await login(request('login', { email: ' COMPTE@example.invalid ', password: 'TestPassword123!' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('school_manager_session');
  });
});
