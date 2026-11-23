import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { ECOLE_SECTION_TYPES } from '@/lib/ecole-profil';
import {
  canEditEcoleProfil,
  loadEcoleAutorisee,
  logEcoleProfil,
  type ProfilUtilisateur,
} from '@/lib/ecole-profil-service';

const updateSchema = z.object({
  type: z.enum(ECOLE_SECTION_TYPES).optional(),
  nom: z.string().trim().min(1, 'Le nom est obligatoire.').optional(),
  cycle: z.string().trim().optional(),
  ordre: z.number().int().min(0).optional(),
  statut: z.string().trim().optional(),
});

async function loadSection(id: string) {
  return prisma.ecoleSection.findUnique({
    where: { id },
    include: { ecole: { select: { id: true, institution: true, province: true, coordSousProvincialeId: true } } },
  });
}

/** PATCH /api/ecole-profil/sections/[id] */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const section = await loadSection(params.id);
  if (!section) return NextResponse.json({ error: 'Section introuvable.' }, { status: 404 });
  if (!canEditEcoleProfil(user, section.ecole)) {
    return NextResponse.json({ error: 'Votre compte n’est pas autorisé à modifier cette fiche.' }, { status: 403 });
  }

  const data = parsed.data;
  const updated = await prisma.ecoleSection.update({ where: { id: section.id }, data });
  await logEcoleProfil(section.ecoleId, user, {
    action: 'SECTION_MODIFICATION',
    champ: updated.type,
    ancienneValeur: [section.nom, section.cycle].filter(Boolean).join(' — '),
    nouvelleValeur: [updated.nom, updated.cycle].filter(Boolean).join(' — '),
  });

  return NextResponse.json({ section: updated });
}

/** DELETE /api/ecole-profil/sections/[id] */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const section = await loadSection(params.id);
  if (!section) return NextResponse.json({ error: 'Section introuvable.' }, { status: 404 });
  if (!canEditEcoleProfil(user, section.ecole)) {
    return NextResponse.json({ error: 'Votre compte n’est pas autorisé à modifier cette fiche.' }, { status: 403 });
  }

  await prisma.ecoleSection.delete({ where: { id: section.id } });
  await logEcoleProfil(section.ecoleId, user, {
    action: 'SECTION_SUPPRESSION',
    champ: section.type,
    ancienneValeur: [section.nom, section.cycle].filter(Boolean).join(' — '),
  });

  return NextResponse.json({ ok: true });
}
