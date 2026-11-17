import { NextResponse } from 'next/server';
import { createVerification, reserveVerificationSend } from '@/lib/email-verification';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { sendValidationCode } from '@/lib/mail';
import { logAudit } from '@/lib/audit';
import {
  ADMIN_AUDIT_MODULE,
  ADMIN_NOT_AUTHORIZED_MESSAGE,
  ADMIN_ROLE,
  evaluateAdminAuthorization,
  isGmailAddress,
  normalizeEmail,
} from '@/lib/admin-registration';
import type { User } from '@prisma/client';

/**
 * Résultat discriminé des helpers d'authentification.
 * L'annotation explicite est requise : sans elle, `ok` s'élargit à `boolean`
 * et les routes appelantes ne peuvent plus réduire l'union (`result.user`
 * devient « possibly undefined » et `next build` échoue).
 */
type AccountResult =
  | { ok: true; user: User; needsValidation?: boolean; verificationEmailSent?: boolean }
  | { ok: false; error: string; needsValidation?: boolean };

const validRoles = [
  'ELEVE',
  'PARENT',
  'ENSEIGNANT',
  'COMPTABLE',
  'SECRETAIRE',
  'DIRECTION_ECOLE',
  'PROMOTEUR',
  'AGENT_SOUS_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'CHEF_ADMINISTRATION',
  'COORDINATION_PROVINCIALE',
  'COORDINATION_NATIONALE',
] as const;

/**
 * Rôles acceptés par le formulaire d'inscription. `ADMIN_SCHOOL_MANAGER_RDC`
 * n'est accepté que si l'adresse Gmail figure dans l'allowlist du Super
 * Administrateur (contrôle serveur dans `registerAdminUser`). `SUPER_ADMIN`
 * n'est jamais auto-inscriptible.
 */
const registerableRoles = [...validRoles, ADMIN_ROLE] as const;

const registerSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le pr\u00e9nom est obligatoire.'),
  sexe: z.enum(['M', 'F']).optional().or(z.literal('')),
  email: z.string().trim().toLowerCase().email('L\u2019email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caract\u00e8res.'),
  role: z.enum(registerableRoles).default('ELEVE'),
  typeInstitution: z.string().trim().optional().or(z.literal('')),
  institutionName: z.string().trim().optional().or(z.literal('')),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  bureauAffectation: z.string().trim().optional().or(z.literal('')),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
  dinacope: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  ecoleId: z.string().trim().optional().or(z.literal('')),
  profilePhotoUrl: z.string().optional().or(z.literal('')),
  coordSousProvinciale: z.string().trim().optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('L\u2019email est invalide.'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caract\u00e8res.')
});

export async function registerUser(payload: unknown): Promise<AccountResult> {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Donn\u00e9es invalides.' };
  }

  const data = parsed.data;

  // Un compte administrateur suit un parcours dédié : l'adresse doit être
  // préenregistrée par le Super Administrateur et les noms doivent correspondre.
  if (data.role === ADMIN_ROLE) {
    return registerAdminUser(data);
  }

  const existing = await prisma.user.findFirst({ where: { email: { equals: data.email, mode: 'insensitive' } } });
  if (existing) return { ok: false, error: 'Un compte existe d\u00e9j\u00e0 avec cet email.' };

  // Durée de vie et compteurs persistants, également appliqués au premier envoi.
  const verification = reserveVerificationSend(createVerification());
  const validationCode = JSON.stringify(verification);

  const passwordHash = await hashPassword(data.password);

  // Try to link to a CoordSousProvinciale record by name
  let coordSousProvincialeId = data.coordSousProvincialeId || null;
  if (!coordSousProvincialeId && data.coordSousProvinciale) {
    const existing = await prisma.coordSousProvinciale.findFirst({
      where: { nom: data.coordSousProvinciale },
    });
    if (existing) coordSousProvincialeId = existing.id;
  }

  // Une école ou une coordination supprimée (ou une liste de sélection périmée dans le
  // formulaire) faisait échouer la création sur la clé étrangère, renvoyée en 500 générique.
  if (data.coordSousProvincialeId) {
    const coord = await prisma.coordSousProvinciale.findUnique({ where: { id: data.coordSousProvincialeId }, select: { id: true } });
    if (!coord) return { ok: false, error: 'La coordination sous-provinciale sélectionnée est introuvable. Sélectionnez-la à nouveau dans la liste.' };
  }

  if (data.ecoleId) {
    const ecole = await prisma.ecole.findUnique({ where: { id: data.ecoleId }, select: { id: true } });
    if (!ecole) return { ok: false, error: 'L’école sélectionnée est introuvable. Sélectionnez-la à nouveau dans la liste.' };
  }

  const user = await prisma.user.create({
    data: {
      nom: data.nom,
      postNom: data.postNom ?? '',
      prenom: data.prenom,
      sexe: data.sexe ?? '',
      email: data.email,
      telephone: data.telephone ?? '',
      passwordHash,
      role: data.role,
      typeInstitution: data.typeInstitution ?? '',
      institutionName: data.institutionName ?? '',
      provinceAdministrative: data.provinceAdministrative ?? '',
      provinceEducationnelle: data.provinceEducationnelle ?? '',
      bureauAffectation: data.bureauAffectation ?? '',
      fonction: data.fonction ?? '',
      grade: data.grade ?? '',
      dinacope: data.dinacope ?? '',
      coordSousProvincialeId,
      ecoleId: data.ecoleId || null,
      profilePhotoUrl: data.profilePhotoUrl || null,
      validationCode,
      isActive: false,
    }
  });

  // Envoyer le code de validation par email
  try {
    await sendValidationCode(data.email, verification.code, data.prenom);
  } catch {
    // On garde le compte créé : l'utilisateur pourra renvoyer le code depuis /verify
    return { ok: true, user, needsValidation: true, verificationEmailSent: false };
  }

  return { ok: true, user, needsValidation: true, verificationEmailSent: true };
}

/**
 * Inscription d'un Admin School Manager RDC.
 *
 * Contrôles serveur, dans cet ordre :
 * 1. l'adresse est une adresse Gmail ;
 * 2. l'adresse figure dans l'allowlist du Super Administrateur et n'est pas révoquée ;
 * 3. nom, post-nom et prénom correspondent au préenregistrement ;
 * 4. aucun compte n'existe déjà pour cette adresse (un Gmail = un compte).
 *
 * Le rôle, l'activation et tous les champs institutionnels sont décidés ici :
 * rien de ce que le navigateur envoie ne peut les modifier.
 */
async function registerAdminUser(data: z.infer<typeof registerSchema>): Promise<AccountResult> {
  const email = normalizeEmail(data.email);

  if (!isGmailAddress(email)) {
    return { ok: false, error: ADMIN_NOT_AUTHORIZED_MESSAGE };
  }

  const preRegistration = await prisma.adminPreRegistration.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (!preRegistration) {
    return { ok: false, error: ADMIN_NOT_AUTHORIZED_MESSAGE };
  }

  const verdict = evaluateAdminAuthorization(preRegistration, {
    nom: data.nom,
    postNom: data.postNom ?? '',
    prenom: data.prenom,
    email,
  });
  if (!verdict.ok) {
    return { ok: false, error: verdict.error };
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (existing) return { ok: false, error: 'Un compte existe d\u00e9j\u00e0 avec cet email.' };

  const verification = reserveVerificationSend(createVerification());
  const passwordHash = await hashPassword(data.password);

  // Identité reprise du préenregistrement : le compte ne peut pas diverger de
  // l'autorisation accordée par le Super Administrateur.
  const user = await prisma.user.create({
    data: {
      nom: preRegistration.nom,
      postNom: preRegistration.postNom,
      prenom: preRegistration.prenom,
      sexe: '',
      email,
      telephone: preRegistration.telephone || data.telephone || '',
      passwordHash,
      role: ADMIN_ROLE,
      typeInstitution: '',
      institutionName: '',
      provinceAdministrative: '',
      provinceEducationnelle: '',
      bureauAffectation: '',
      fonction: '',
      grade: '',
      dinacope: '',
      validationCode: JSON.stringify(verification),
      // Le compte reste inactif jusqu'à la vérification du code envoyé par email.
      isActive: false,
      userStatus: 'EN_ATTENTE',
    },
  });

  await prisma.adminPreRegistration.update({
    where: { id: preRegistration.id },
    data: { statut: 'COMPTE_CREE', userId: user.id },
  });

  await logAudit({
    userId: user.id,
    userRole: ADMIN_ROLE,
    userName: `${user.prenom} ${user.nom}`.trim(),
    action: 'ADMIN_COMPTE_CREE',
    module: ADMIN_AUDIT_MODULE,
    resource: 'admin_pre_registration',
    resourceId: preRegistration.id,
    details: `Compte administrateur créé pour ${email} (en attente de vérification email).`,
  });

  try {
    await sendValidationCode(email, verification.code, user.prenom);
  } catch {
    return { ok: true, user, needsValidation: true, verificationEmailSent: false };
  }

  return { ok: true, user, needsValidation: true, verificationEmailSent: true };
}

export async function loginUser(payload: unknown): Promise<AccountResult> {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Identifiants invalides.' };
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: parsed.data.email, mode: 'insensitive' } } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: 'Identifiants incorrects.' };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: 'Identifiants incorrects.' };
  if (!user.isActive) {
    if (user.userStatus !== 'EN_ATTENTE') {
      return { ok: false, error: 'Ce compte est suspendu ou désactivé. Contactez l’administration.' };
    }
    return { ok: false, needsValidation: true, error: 'Votre compte n’est pas encore validé. Saisissez votre code de validation.' };
  }
  return { ok: true, user };
}

export async function createSessionCookieResponse(response: NextResponse, userId: string, role?: string) {
  response.cookies.set(process.env.SESSION_COOKIE_NAME || 'school_manager_session', userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7)
  });
  // Cookie de rôle pour le middleware (edge, sans accès Prisma)
  if (role) {
    response.cookies.set('school_manager_role', role, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7)
    });
  }
  return response;
}
