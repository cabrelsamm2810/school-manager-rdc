import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';

const publicRole = z.literal('ELEVE');

const registerSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  email: z.string().trim().email('L’email est invalide.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  // L’inscription publique ne peut créer que des comptes ELEVE.
  // Les autres rôles doivent être attribués par une procédure contrôlée.
  role: publicRole.optional().default('ELEVE')
});

const loginSchema = z.object({
  email: z.string().trim().email('L’email est invalide.'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.')
});

export async function registerUser(payload: unknown) {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  }

  const { nom, postNom, prenom, email, telephone, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: 'Un compte existe déjà avec cet email.' };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      nom,
      postNom: postNom ?? '',
      prenom,
      email,
      telephone: telephone ?? '',
      passwordHash,
      role: 'ELEVE'
    }
  });

  return { ok: true, user };
}

export async function loginUser(payload: unknown) {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Identifiants invalides.' };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.passwordHash || !user.isActive) {
    return { ok: false, error: 'Identifiants incorrects.' };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: 'Identifiants incorrects.' };
  return { ok: true, user };
}

export async function createSessionCookieResponse(response: NextResponse, userId: string) {
  response.cookies.set(process.env.SESSION_COOKIE_NAME || 'school_manager_session', userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7)
  });
  return response;
}
