import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), create: vi.fn(), update: vi.fn(),
  sendValidationCode: vi.fn(), hashPassword: vi.fn(), verifyPassword: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: { user: {
  findFirst: mocks.findFirst, create: mocks.create, update: mocks.update,
} } }));
vi.mock('@/lib/mail', () => ({ sendValidationCode: mocks.sendValidationCode }));
vi.mock('@/lib/auth', () => ({ hashPassword: mocks.hashPassword, verifyPassword: mocks.verifyPassword }));

import { POST as resend } from '@/app/api/auth/resend/route';
import { POST as verify } from '@/app/api/auth/verify/route';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';

const pendingUser = {
  id: 'activation-test', nom: 'Test', prenom: 'Activation', email: 'Compte@Example.invalid',
  passwordHash: 'hashed-password', role: 'ELEVE', isActive: false,
  userStatus: 'EN_ATTENTE', validationCode: '123456',
};
function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findFirst.mockResolvedValue({ ...pendingUser });
  mocks.update.mockResolvedValue({ ...pendingUser });
  mocks.sendValidationCode.mockResolvedValue(undefined);
  mocks.hashPassword.mockResolvedValue('hashed-password');
  mocks.verifyPassword.mockResolvedValue(true);
});

describe('activation et renvoi du code', () => {
  it('renvoie le même code et retrouve les anciennes adresses avec majuscules', async () => {
    const response = await resend(request('resend', { email: '  COMPTE@example.invalid  ' }));
    expect(response.status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { email: { equals: 'compte@example.invalid', mode: 'insensitive' } } });
    expect(mocks.sendValidationCode).toHaveBeenCalledWith(pendingUser.email, '123456', 'Activation');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('un échec SMTP ne remplace pas le code déjà reçu', async () => {
    mocks.sendValidationCode.mockRejectedValue(new Error('SMTP unavailable'));
    const response = await resend(request('resend', { email: 'compte@example.invalid' }));
    expect(response.status).toBe(503);
    expect(mocks.update).not.toHaveBeenCalled();
    expect((await response.json()).error).toContain('reste valable');
  });

  it('crée un code uniquement si le compte en attente n’en possède pas', async () => {
    mocks.findFirst.mockResolvedValue({ ...pendingUser, validationCode: null });
    const response = await resend(request('resend', { email: pendingUser.email }));
    expect(response.status).toBe(200);
    const code = mocks.update.mock.calls[0][0].data.validationCode;
    expect(code).toMatch(/^\d{6}$/);
    expect(mocks.sendValidationCode).toHaveBeenCalledWith(pendingUser.email, code, 'Activation');
  });

  it('valide le code et synchronise le statut actif sans créer de session', async () => {
    const response = await verify(request('verify', { email: ' COMPTE@example.invalid ', code: ' 123456 ' }));
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: pendingUser.id }, data: {
      isActive: true, userStatus: 'ACTIF', validationCode: null,
    } });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('refuse un code incorrect sans modifier le compte', async () => {
    const response = await verify(request('verify', { email: pendingUser.email, code: '654321' }));
    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('refuse six caractères non numériques', async () => {
    const response = await verify(request('verify', { email: pendingUser.email, code: 'abcdef' }));
    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it.each(['SUSPENDU', 'DESACTIVE'])('ne réactive jamais un compte %s par email', async (userStatus) => {
    mocks.findFirst.mockResolvedValue({ ...pendingUser, userStatus });
    expect((await verify(request('verify', { email: pendingUser.email, code: '123456' }))).status).toBe(403);
    expect((await resend(request('resend', { email: pendingUser.email }))).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.sendValidationCode).not.toHaveBeenCalled();
  });

  it('refuse un compte déjà validé', async () => {
    mocks.findFirst.mockResolvedValue({ ...pendingUser, isActive: true, userStatus: 'ACTIF' });
    expect((await verify(request('verify', { email: pendingUser.email, code: '123456' }))).status).toBe(400);
    expect((await resend(request('resend', { email: pendingUser.email }))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('refuse un compte introuvable et une adresse absente', async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await verify(request('verify', { email: pendingUser.email, code: '123456' }))).status).toBe(404);
    expect((await resend(request('resend', { email: '' }))).status).toBe(400);
  });
});

describe('inscription et connexion avant activation', () => {
  it('conserve le compte en cas d’échec d’envoi sans prétendre que le mail est parti', async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ ...pendingUser });
    mocks.sendValidationCode.mockRejectedValue(new Error('SMTP unavailable'));
    const response = await register(request('register', {
      nom: 'Test', prenom: 'Activation', email: ' COMPTE@example.invalid ', password: 'TestPassword123!', role: 'ELEVE',
    }));
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.verificationEmailSent).toBe(false);
    expect(result.user).not.toHaveProperty('validationCode');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(mocks.create.mock.calls[0][0].data.email).toBe('compte@example.invalid');
  });

  it('ne propose l’activation qu’après vérification du mot de passe', async () => {
    mocks.verifyPassword.mockResolvedValue(false);
    const response = await login(request('login', { email: pendingUser.email, password: 'WrongPassword123!' }));
    expect(response.status).toBe(401);
    expect((await response.json()).needsValidation).toBe(false);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('permet de poursuivre vers l’activation pour un compte en attente', async () => {
    const response = await login(request('login', { email: ' COMPTE@example.invalid ', password: 'TestPassword123!' }));
    expect(response.status).toBe(401);
    expect((await response.json()).needsValidation).toBe(true);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('connecte un compte activé avec une adresse de casse différente', async () => {
    mocks.findFirst.mockResolvedValue({ ...pendingUser, isActive: true, userStatus: 'ACTIF', validationCode: null });
    const response = await login(request('login', { email: ' COMPTE@example.invalid ', password: 'TestPassword123!' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('school_manager_session');
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { email: { equals: 'compte@example.invalid', mode: 'insensitive' } } });
  });
});
