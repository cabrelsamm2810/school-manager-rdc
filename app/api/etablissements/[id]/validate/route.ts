import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { VALIDATION_STATUTS } from '@/lib/institutions';

const validateSchema = z.object({
  statut: z.enum(VALIDATION_STATUTS as [string, ...string[]]),
  commentaire: z.string().trim().optional().or(z.literal('')),
});

/**
 * PATCH /api/etablissements/[id]/validate
 * Change le statut de validation d'un établissement.
 * Réservé aux rôles de coordination (sous-provinciale et au-dessus).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'COORDINATION_SOUS_PROVINCIALE');
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

  const existing = await prisma.etablissement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  const etablissement = await prisma.etablissement.update({
    where: { id: params.id },
    data: { statutValidation: parsed.data.statut },
  });

  await prisma.etablissementValidationLog.create({
    data: {
      etablissementId: params.id,
      statut: parsed.data.statut,
      commentaire: parsed.data.commentaire || '',
      validateurId: (auth.user as any).id,
      validateurNom: `${(auth.user as any).nom} ${(auth.user as any).postNom} ${(auth.user as any).prenom}`.trim(),
    },
  });

  return NextResponse.json({ etablissement });
}
