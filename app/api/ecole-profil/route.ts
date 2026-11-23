import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { ECOLE_PROFIL_CHAMP_LABELS, buildEcoleQrValue } from '@/lib/ecole-profil';
import {
  canEditEcoleProfil,
  ensureEcoleProfil,
  loadEcoleAutorisee,
  logEcoleProfil,
  type ProfilUtilisateur,
} from '@/lib/ecole-profil-service';

const updateSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom officiel est obligatoire.').optional(),
  type: z.string().trim().optional(),
  dinacope: z.string().trim().optional(),
  province: z.string().trim().optional(),
  provinceEducationnelle: z.string().trim().optional(),
  ville: z.string().trim().optional(),
  commune: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  email: z.string().trim().email('L’email est invalide.').optional().or(z.literal('')),
  chefEcole: z.string().trim().optional(),
  effectif: z.number().int().min(0).optional(),
  logoUrl: z.string().trim().optional().nullable(),
  chefUserId: z.string().trim().optional().nullable(),
});

/** Champs Prisma de `Ecole` modifiables depuis le profil. */
const ECOLE_FIELDS = [
  'nom', 'type', 'dinacope', 'province', 'provinceEducationnelle', 'ville',
  'commune', 'adresse', 'telephone', 'email', 'chefEcole', 'effectif', 'logoUrl',
] as const;

async function loadPayload(ecoleId: string, user: ProfilUtilisateur) {
  const ecole = await prisma.ecole.findUnique({
    where: { id: ecoleId },
    include: {
      coordSousProvinciale: { select: { id: true, nom: true } },
      ecErc: { select: { id: true, nom: true } },
    },
  });
  if (!ecole) return null;

  const profil = await ensureEcoleProfil(ecole.id, ecole.institution, user);

  const [chef, sections] = await Promise.all([
    profil.chefUserId
      ? prisma.user.findUnique({
          where: { id: profil.chefUserId },
          select: { id: true, nom: true, postNom: true, prenom: true, email: true, telephone: true, profilePhotoUrl: true },
        })
      : Promise.resolve(null),
    prisma.ecoleSection.findMany({
      where: { ecoleId: ecole.id },
      orderBy: [{ type: 'asc' }, { ordre: 'asc' }, { nom: 'asc' }],
    }),
  ]);

  return {
    ecole: {
      id: ecole.id,
      nom: ecole.nom,
      type: ecole.type,
      institution: ecole.institution,
      dinacope: ecole.dinacope,
      province: ecole.province,
      provinceEducationnelle: ecole.provinceEducationnelle,
      ville: ecole.ville,
      commune: ecole.commune,
      adresse: ecole.adresse,
      telephone: ecole.telephone,
      email: ecole.email,
      chefEcole: ecole.chefEcole,
      logoUrl: ecole.logoUrl,
      identifiantSM: ecole.identifiantSM,
      effectif: ecole.effectif,
      statut: ecole.statut,
      statutValidation: ecole.statutValidation,
      coordSousProvinciale: ecole.coordSousProvinciale,
      ecErc: ecole.ecErc,
    },
    profil: {
      id: profil.id,
      codeEcole: profil.codeEcole,
      chefUserId: profil.chefUserId,
      statut: profil.statut,
      createdAt: profil.createdAt,
      updatedAt: profil.updatedAt,
    },
    chef,
    sections,
    qrPayload: buildEcoleQrValue(profil.codeEcole, profil.qrToken),
    permissions: {
      canEdit: canEditEcoleProfil(user, ecole),
    },
  };
}

/** GET /api/ecole-profil — école du compte (ou `?ecoleId=` dans son périmètre). */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const ecoleId = new URL(request.url).searchParams.get('ecoleId');
  const cible = await loadEcoleAutorisee(user, ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });

  const payload = await loadPayload(cible.ecole.id, user);
  if (!payload) return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  return NextResponse.json(payload);
}

/** PUT /api/ecole-profil — modification selon les autorisations du compte. */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const cible = await loadEcoleAutorisee(user, (body as { ecoleId?: string } | null)?.ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });
  if (!canEditEcoleProfil(user, cible.ecole)) {
    return NextResponse.json({ error: 'Votre compte n’est pas autorisé à modifier cette fiche.' }, { status: 403 });
  }

  const data = parsed.data;
  const existing = await prisma.ecole.findUnique({ where: { id: cible.ecole.id } });
  if (!existing) return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });

  // ── Diff champ par champ pour l'historique ──
  const changes: { champ: string; avant: string; apres: string }[] = [];
  const updateData: Record<string, unknown> = {};
  for (const field of ECOLE_FIELDS) {
    const value = data[field];
    if (value === undefined) continue;
    const avant = (existing as unknown as Record<string, unknown>)[field];
    const apres = field === 'logoUrl' ? (value || null) : value;
    const before = avant === null || avant === undefined ? '' : String(avant);
    const after = apres === null || apres === undefined ? '' : String(apres);
    if (before === after) continue;
    updateData[field] = apres;
    changes.push({ champ: field, avant: before, apres: after });
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.ecole.update({ where: { id: cible.ecole.id }, data: updateData });
    for (const change of changes) {
      await logEcoleProfil(cible.ecole.id, user, {
        action: 'MODIFICATION',
        champ: ECOLE_PROFIL_CHAMP_LABELS[change.champ] ?? change.champ,
        ancienneValeur: change.avant,
        nouvelleValeur: change.apres,
      });
    }
  }

  // ── Association du chef d'établissement (un seul compte, une seule école) ──
  if (data.chefUserId !== undefined) {
    const profil = await ensureEcoleProfil(cible.ecole.id, cible.ecole.institution, user);

    if (!data.chefUserId) {
      if (profil.chefUserId) {
        await prisma.$transaction([
          prisma.ecoleProfil.update({ where: { id: profil.id }, data: { chefUserId: null } }),
          prisma.user.updateMany({
            where: { id: profil.chefUserId, ecoleId: cible.ecole.id },
            data: { ecoleId: null },
          }),
        ]);
        await logEcoleProfil(cible.ecole.id, user, {
          action: 'CHEF_DISSOCIE',
          champ: 'chefUserId',
          ancienneValeur: profil.chefUserId,
        });
      }
    } else {
      const chef = await prisma.user.findUnique({
        where: { id: data.chefUserId },
        select: { id: true, role: true, isActive: true, ecoleId: true },
      });
      if (!chef) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
      if (chef.role !== 'DIRECTION_ECOLE') {
        return NextResponse.json({ error: 'Le compte doit avoir le rôle Chef d’établissement.' }, { status: 400 });
      }
      const autreEcole = await prisma.ecoleProfil.findUnique({
        where: { chefUserId: chef.id },
        select: { ecoleId: true },
      });
      if (autreEcole && autreEcole.ecoleId !== cible.ecole.id) {
        return NextResponse.json({ error: 'Ce chef d’établissement est déjà rattaché à une autre école.' }, { status: 409 });
      }
      if (profil.chefUserId !== chef.id) {
        await prisma.$transaction([
          prisma.ecoleProfil.update({ where: { id: profil.id }, data: { chefUserId: chef.id } }),
          prisma.user.update({ where: { id: chef.id }, data: { ecoleId: cible.ecole.id } }),
        ]);
        await logEcoleProfil(cible.ecole.id, user, {
          action: 'CHEF_ASSOCIE',
          champ: 'chefUserId',
          ancienneValeur: profil.chefUserId ?? '',
          nouvelleValeur: chef.id,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, modifications: changes.length });
}
