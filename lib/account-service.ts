import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { sendValidationCode } from '@/lib/mail';
import type { User } from '@prisma/client';

/**
 * Résultat discriminé des helpers d'authentification.
 * L'annotation explicite est requise : sans elle, `ok` s'élargit à `boolean`
 * et les routes appelantes ne peuvent plus réduire l'union (`result.user`
 * devient « possibly undefined » et `next build` échoue).
 */
type AccountResult =
  | { ok: true; user: User; needsValidation?: boolean }
  | { ok: false; error: string };

const validRoles = [
  'ELEVE',
  'PARENT',
  'ENSEIGNANT',
  'DIRECTION_ECOLE',
  'AGENT_SOUS_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_PROVINCIALE',
  'COORDINATION_NATIONALE',
] as const;

const registerSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le pr\u00e9nom est obligatoire.'),
  sexe: z.enum(['M', 'F']).optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caract\u00e8res.'),
  role: z.enum(validRoles).default('ELEVE'),
  typeInstitution: z.string().trim().optional().or(z.literal('')),
  institutionName: z.string().trim().optional().or(z.literal('')),
  provinceAdministrative: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  bureauAffectation: z.string().trim().optional().or(z.literal('')),
  fonction: z.string().trim().optional().or(z.literal('')),
  grade: z.string().trim().optional().or(z.literal('')),
  dinacope: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  etablissementId: z.string().trim().optional().or(z.literal('')),
  profilePhotoUrl: z.string().optional().or(z.literal('')),
  coordSousProvinciale: z.string().trim().optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().trim().email('L\u2019email est invalide.'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caract\u00e8res.')
});

export async function registerUser(payload: unknown): Promise<AccountResult> {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Donn\u00e9es invalides.' };
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, error: 'Un compte existe d\u00e9j\u00e0 avec cet email.' };

  // Générer un code de validation à 6 chiffres
  const validationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const passwordHash = await hashPassword(data.password);

  // Try to link to a CoordSousProvinciale record by name
  let coordSousProvincialeId = data.coordSousProvincialeId || null;
  if (!coordSousProvincialeId && data.coordSousProvinciale) {
    const existing = await prisma.coordSousProvinciale.findFirst({
      where: { nom: data.coordSousProvinciale },
    });
    if (existing) coordSousProvincialeId = existing.id;
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
      etablissementId: data.etablissementId || null,
      profilePhotoUrl: data.profilePhotoUrl || null,
      validationCode,
      isActive: false,
    }
  });

  // Envoyer le code de validation par email
  try {
    await sendValidationCode(data.email, validationCode, data.prenom);
  } catch {
    // Si l'envoi échoue, on supprime le compte pour permettre une nouvelle tentative
    await prisma.user.delete({ where: { id: user.id } });
    return { ok: false, error: "Impossible d'envoyer l'email de validation. Vérifiez votre adresse email et réessayez." };
  }

  return { ok: true, user, needsValidation: true };
}

export async function loginUser(payload: unknown): Promise<AccountResult> {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Identifiants invalides.' };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: 'Identifiants incorrects.' };
  }
  if (!user.isActive) {
    return { ok: false, error: 'Votre compte n\u2019est pas encore validé. Vérifiez votre email pour le code de validation.' };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: 'Identifiants incorrects.' };
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
