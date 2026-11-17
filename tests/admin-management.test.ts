import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdateMany: vi.fn(),
  preRegFindFirst: vi.fn(),
  preRegUpdate: vi.fn(),
  auditCreate: vi.fn(),
  sendValidationCode: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findFirst: mocks.userFindFirst,
      create: mocks.userCreate,
      updateMany: mocks.userUpdateMany,
    },
    adminPreRegistration: {
      findFirst: mocks.preRegFindFirst,
      update: mocks.preRegUpdate,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));
vi.mock('@/lib/mail', () => ({ sendValidationCode: mocks.sendValidationCode }));
vi.mock('@/lib/auth', () => ({ hashPassword: mocks.hashPassword, verifyPassword: vi.fn() }));

import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as verifyRoute } from '@/app/api/auth/verify/route';
import {
  ADMIN_NOT_AUTHORIZED_MESSAGE,
  ADMIN_NAMES_MISMATCH_MESSAGE,
  ADMIN_ROLE,
  activationFromStatutPrevu,
  adminPreRegistrationSchema,
  adminSignupSchema,
  evaluateAdminAuthorization,
  findNameMismatches,
  isGmailAddress,
  normalizeEmail,
  normalizeName,
} from '@/lib/admin-registration';
import { can, PERM, ROLE_PERMISSIONS } from '@/lib/permissions';
import { canAccessPath } from '@/lib/route-access';
import { SELF_REGISTER_ROLES } from '@/lib/roles';
import { createVerification } from '@/lib/email-verification';

/* ── Helpers ── */

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const adminSignup = {
  role: ADMIN_ROLE,
  nom: 'Kabeya',
  postNom: 'wa Mukendi',
  prenom: 'Jean',
  email: 'jean.kabeya@gmail.com',
  password: 'MotDePasse2026',
};

const allowedRegistration = {
  id: 'pre-1',
  email: 'jean.kabeya@gmail.com',
  nom: 'Kabeya',
  postNom: 'wa Mukendi',
  prenom: 'Jean',
  statut: 'EN_ATTENTE',
  statutPrevu: 'ACTIF',
  telephone: '+243810000000',
};

const createdUser = {
  id: 'user-1',
  nom: 'Kabeya',
  postNom: 'wa Mukendi',
  prenom: 'Jean',
  email: 'jean.kabeya@gmail.com',
  role: ADMIN_ROLE,
  isActive: false,
  userStatus: 'EN_ATTENTE',
  passwordHash: 'hashed',
  validationCode: 'secret-state',
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hashPassword.mockResolvedValue('hashed');
  mocks.sendValidationCode.mockResolvedValue(undefined);
  mocks.auditCreate.mockResolvedValue({});
  mocks.preRegUpdate.mockResolvedValue({});
  mocks.userFindFirst.mockResolvedValue(null);
});

/* ── 1. Validations pures ── */

describe('validations Gmail et identité', () => {
  it('normalise les adresses et n’accepte que Gmail', () => {
    expect(normalizeEmail('  Jean.Kabeya@Gmail.com ')).toBe('jean.kabeya@gmail.com');
    expect(isGmailAddress('jean.kabeya@gmail.com')).toBe(true);
    expect(isGmailAddress('jean.kabeya@gmail.co')).toBe(false);
    expect(isGmailAddress('jean.kabeya@yahoo.fr')).toBe(false);
    expect(isGmailAddress('')).toBe(false);
  });

  it('compare les noms sans tenir compte des accents, de la casse ni des espaces', () => {
    expect(normalizeName('  KABEYA   wa  MUKENDI ')).toBe('kabeya wa mukendi');
    expect(normalizeName('N’Simba')).toBe('n simba');
    expect(findNameMismatches(
      { nom: 'Kabeya', postNom: 'wa Mukendi', prenom: 'Jean' },
      { nom: 'kabeya', postNom: 'Wa Mukendi', prenom: 'JEAN' },
    )).toEqual([]);
    expect(findNameMismatches(
      { nom: 'Kabeya', postNom: 'wa Mukendi', prenom: 'Jean' },
      { nom: 'Kabila', postNom: 'wa Mukendi', prenom: 'Jean' },
    )).toEqual(['nom']);
  });

  it('refuse une adresse absente ou révoquée avec le message exact', () => {
    const input = { nom: 'Kabeya', postNom: 'wa Mukendi', prenom: 'Jean', email: 'jean.kabeya@gmail.com' };

    const absent = evaluateAdminAuthorization(null, input);
    expect(absent.ok).toBe(false);
    if (!absent.ok) expect(absent.error).toBe(
      "Cette adresse Gmail n'est pas autorisée à créer un compte administrateur. Veuillez contacter le Super Administrateur de School Manager RDC.",
    );
    expect(absent.ok === false && absent.error).toBe(ADMIN_NOT_AUTHORIZED_MESSAGE);

    const revoked = evaluateAdminAuthorization({ ...allowedRegistration, statut: 'REVOQUE' }, input);
    expect(revoked.ok).toBe(false);
    if (!revoked.ok) expect(revoked.error).toBe(ADMIN_NOT_AUTHORIZED_MESSAGE);

    const mismatch = evaluateAdminAuthorization(allowedRegistration, { ...input, nom: 'Autre' });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.error).toBe(ADMIN_NAMES_MISMATCH_MESSAGE);

    expect(evaluateAdminAuthorization(allowedRegistration, input).ok).toBe(true);
  });

  it('applique le statut d’activation prévu par le Super Administrateur', () => {
    expect(activationFromStatutPrevu('ACTIF')).toEqual({ isActive: true, userStatus: 'ACTIF' });
    expect(activationFromStatutPrevu('INACTIF')).toEqual({ isActive: false, userStatus: 'DESACTIVE' });
    expect(activationFromStatutPrevu(null)).toEqual({ isActive: true, userStatus: 'ACTIF' });
  });

  it('valide le préenregistrement créé par le Super Administrateur', () => {
    expect(adminPreRegistrationSchema.safeParse({
      nom: 'Kabeya', prenom: 'Jean', email: 'Jean.Kabeya@Gmail.com', statutPrevu: 'ACTIF',
    }).success).toBe(true);

    const notGmail = adminPreRegistrationSchema.safeParse({
      nom: 'Kabeya', prenom: 'Jean', email: 'jean@yahoo.fr',
    });
    expect(notGmail.success).toBe(false);

    const missingName = adminPreRegistrationSchema.safeParse({
      nom: 'K', prenom: 'Jean', email: 'jean@gmail.com',
    });
    expect(missingName.success).toBe(false);

    expect(adminSignupSchema.safeParse({
      nom: 'Kabeya', prenom: 'Jean', email: 'jean@gmail.com', password: 'MotDePasse2026',
    }).success).toBe(true);
    expect(adminSignupSchema.safeParse({
      nom: 'Kabeya', prenom: 'Jean', email: 'jean@gmail.com', password: 'court',
    }).success).toBe(false);
  });
});

/* ── 2. RBAC et accès aux routes ── */

describe('RBAC — administration réservée au SUPER_ADMIN', () => {
  it('réserve la gestion des administrateurs au SUPER_ADMIN', () => {
    expect(can('SUPER_ADMIN', PERM.ADMINS_MANAGE)).toBe(true);
    expect(can('ADMIN_SCHOOL_MANAGER_RDC', PERM.ADMINS_MANAGE)).toBe(false);
    expect(ROLE_PERMISSIONS.ADMIN_SCHOOL_MANAGER_RDC).not.toContain(PERM.ADMINS_MANAGE);
  });

  it('protège les routes de gestion et de tableau de bord', () => {
    expect(canAccessPath('SUPER_ADMIN', '/admin/administrateurs')).toBe(true);
    expect(canAccessPath('ADMIN_SCHOOL_MANAGER_RDC', '/admin/administrateurs')).toBe(false);
    expect(canAccessPath('DIRECTION_ECOLE', '/admin/administrateurs')).toBe(false);
    expect(canAccessPath('ADMIN_SCHOOL_MANAGER_RDC', '/admin')).toBe(false);
    expect(canAccessPath('ADMIN_SCHOOL_MANAGER_RDC', '/admin/dashboard')).toBe(true);
    expect(canAccessPath('DIRECTION_ECOLE', '/admin/dashboard')).toBe(false);
    expect(canAccessPath(null, '/admin/dashboard')).toBe(false);
  });

  it('exclut les rôles réservés de l’auto-inscription libre', () => {
    expect(SELF_REGISTER_ROLES).not.toContain('SUPER_ADMIN');
    expect(SELF_REGISTER_ROLES).not.toContain('ADMIN_SCHOOL_MANAGER_RDC');
  });
});

/* ── 3. Inscription administrateur (contrôles serveur) ── */

describe('inscription Admin School Manager RDC', () => {
  it('refuse une adresse absente de l’allowlist avec le message exact', async () => {
    mocks.preRegFindFirst.mockResolvedValue(null);
    const response = await registerRoute(post('register', adminSignup));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      "Cette adresse Gmail n'est pas autorisée à créer un compte administrateur. Veuillez contacter le Super Administrateur de School Manager RDC.",
    );
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it('refuse une adresse non Gmail', async () => {
    const response = await registerRoute(post('register', { ...adminSignup, email: 'jean@yahoo.fr' }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(ADMIN_NOT_AUTHORIZED_MESSAGE);
    expect(mocks.preRegFindFirst).not.toHaveBeenCalled();
  });

  it('refuse une autorisation révoquée', async () => {
    mocks.preRegFindFirst.mockResolvedValue({ ...allowedRegistration, statut: 'REVOQUE' });
    const response = await registerRoute(post('register', adminSignup));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(ADMIN_NOT_AUTHORIZED_MESSAGE);
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it('refuse des noms qui ne correspondent pas au préenregistrement', async () => {
    mocks.preRegFindFirst.mockResolvedValue(allowedRegistration);
    const response = await registerRoute(post('register', { ...adminSignup, nom: 'Kabila' }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(ADMIN_NAMES_MISMATCH_MESSAGE);
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it('refuse un second compte pour le même Gmail', async () => {
    mocks.preRegFindFirst.mockResolvedValue({ ...allowedRegistration, statut: 'COMPTE_CREE' });
    mocks.userFindFirst.mockResolvedValue({ ...createdUser, isActive: true });
    const response = await registerRoute(post('register', adminSignup));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Un compte existe déjà avec cet email.');
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it('crée un compte inactif avec le rôle ADMIN_SCHOOL_MANAGER_RDC imposé par le serveur', async () => {
    mocks.preRegFindFirst.mockResolvedValue(allowedRegistration);
    mocks.userCreate.mockResolvedValue(createdUser);

    const response = await registerRoute(post('register', {
      ...adminSignup,
      // Le navigateur tente d'imposer un autre rôle et un statut déjà actif.
      role: ADMIN_ROLE,
      isActive: true,
      userStatus: 'ACTIF',
      typeInstitution: 'PUBLIQUE',
      provinceAdministrative: 'Kinshasa',
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user.role).toBe(ADMIN_ROLE);
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.user.validationCode).toBeUndefined();
    expect(body.verificationEmailSent).toBe(true);

    const created = mocks.userCreate.mock.calls[0][0].data;
    expect(created.role).toBe(ADMIN_ROLE);
    expect(created.isActive).toBe(false);
    expect(created.userStatus).toBe('EN_ATTENTE');
    expect(created.email).toBe('jean.kabeya@gmail.com');
    expect(created.typeInstitution).toBe('');
    expect(created.provinceAdministrative).toBe('');
    expect(created.validationCode).toBeTruthy();
    expect(mocks.preRegUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'pre-1' },
      data: expect.objectContaining({ statut: 'COMPTE_CREE', userId: 'user-1' }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalled();
  });
});

/* ── 4. Vérification du code email et activation ── */

describe('vérification du code et activation de l’administrateur', () => {
  const state = createVerification();
  const pendingAdmin = {
    id: 'user-1', nom: 'Kabeya', prenom: 'Jean', email: 'Jean.Kabeya@Gmail.com',
    passwordHash: 'hashed', role: ADMIN_ROLE, isActive: false, userStatus: 'EN_ATTENTE',
    validationCode: JSON.stringify(state), createdAt: new Date(),
  };

  function verifyRequest(code = state.code) {
    return verifyRoute(new NextRequest('http://localhost/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingAdmin.email, code }),
    }));
  }

  beforeEach(() => {
    mocks.userFindFirst.mockResolvedValue({ ...pendingAdmin });
    mocks.userUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('active le compte quand le Super Administrateur a prévu un statut actif', async () => {
    mocks.preRegFindFirst.mockResolvedValue({ statut: 'COMPTE_CREE', statutPrevu: 'ACTIF' });
    const response = await verifyRequest();
    expect(response.status).toBe(200);
    expect((await response.json()).message).toBe('Compte validé avec succès.');
    const data = mocks.userUpdateMany.mock.calls[0][0].data;
    expect(data).toMatchObject({ isActive: true, userStatus: 'ACTIF', validationCode: null });
  });

  it('laisse le compte désactivé quand le Super Administrateur a prévu une activation manuelle', async () => {
    mocks.preRegFindFirst.mockResolvedValue({ statut: 'COMPTE_CREE', statutPrevu: 'INACTIF' });
    const response = await verifyRequest();
    expect(response.status).toBe(200);
    expect((await response.json()).message).toContain('Super Administrateur');
    const data = mocks.userUpdateMany.mock.calls[0][0].data;
    expect(data).toMatchObject({ isActive: false, userStatus: 'DESACTIVE', validationCode: null });
  });

  it('refuse la validation si l’autorisation a été révoquée', async () => {
    mocks.preRegFindFirst.mockResolvedValue({ statut: 'REVOQUE', statutPrevu: 'ACTIF' });
    const response = await verifyRequest();
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe(ADMIN_NOT_AUTHORIZED_MESSAGE);
    expect(mocks.userUpdateMany).not.toHaveBeenCalled();
  });

  it('rejette un code erroné sans activer le compte', async () => {
    mocks.preRegFindFirst.mockResolvedValue({ statut: 'COMPTE_CREE', statutPrevu: 'ACTIF' });
    const response = await verifyRequest('000000');
    expect(response.status).toBe(400);
    const data = mocks.userUpdateMany.mock.calls[0][0].data;
    expect(data.isActive).toBeUndefined();
    expect(data.validationCode).toContain('"attempts":1');
  });
});
