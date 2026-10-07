import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { VALIDATION_STATUTS, canTransition } from '@/lib/institutions';

const validateSchema = z.object({
  statut: z.enum(VALIDATION_STATUTS as [string, ...string[]]),
  commentaire: z.string().trim().optional().or(z.literal('')),
});

/**
 * PATCH /api/ecoles/[id]/validate
 * Change le statut de validation d'un école.
 *
 * Règles enforced :
 *  1. Isolation par institution — le validateur doit appartenir à la même institution.
 *  2. Périmètre territorial — le validateur doit couvrir le territoire de l'école.
 *  3. Hiérarchie de transition — seules les transitions autorisées sont acceptées,
 *     et chaque transition exige un rôle minimum.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = validateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  const user = auth.user as any;
  const newStatut = parsed.data.statut;
  const oldStatut = existing.statutValidation;

  // ── 1. Isolation par institution ──
  // SUPER_ADMIN peut tout faire ; les autres doivent être de la même institution.
  if (user.role !== 'SUPER_ADMIN' && user.typeInstitution && user.typeInstitution !== existing.institution) {
    return NextResponse.json(
      { error: 'Vous ne pouvez valider qu\u2019une école de votre propre institution.' },
      { status: 403 },
    );
  }

  // ── 2. Périmètre territorial ──
  // DIRECTION_ECOLE ne peut valider que son propre école ;
  // COORDINATION_SOUS_PROVINCIALE doit couvrir la sous-division de l'école ;
  // COORDINATION_PROVINCIALE doit couvrir la province.
  const scope = getScopeLevel(user.role);
  if (scope === 'school' && user.ecoleId && user.ecoleId !== params.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez valider que votre propre école.' },
      { status: 403 },
    );
  }
  if (scope === 'sousProvincial' && user.coordSousProvincialeId && existing.coordSousProvincialeId !== user.coordSousProvincialeId) {
    return NextResponse.json(
      { error: 'Cet école n\u2019appartient pas à votre coordination sous-provinciale.' },
      { status: 403 },
    );
  }
  if (scope === 'provincial' && user.provinceAdministrative && existing.province !== user.provinceAdministrative) {
    return NextResponse.json(
      { error: 'Cet école n\u2019appartient pas à votre province.' },
      { status: 403 },
    );
  }

  // ── 3. Hiérarchie de transition ──
  if (!canTransition(oldStatut, newStatut, user.role)) {
    return NextResponse.json(
      { error: `Transition non autorisée : ${oldStatut} → ${newStatut}.` },
      { status: 400 },
    );
  }

  const ecole = await prisma.ecole.update({
    where: { id: params.id },
    data: { statutValidation: newStatut },
  });

  await prisma.ecoleValidationLog.create({
    data: {
      ecoleId: params.id,
      statut: newStatut,
      commentaire: parsed.data.commentaire || '',
      validateurId: user.id,
      validateurNom: `${user.nom} ${user.postNom} ${user.prenom}`.trim(),
    },
  });

  return NextResponse.json({ ecole });
}
