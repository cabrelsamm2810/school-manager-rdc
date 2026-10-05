import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const updateSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom officiel est obligatoire.'),
  type: z.string().trim().optional().or(z.literal('')),
  institution: z.string().trim().optional().or(z.literal('')),
  dinacope: z.string().trim().optional().or(z.literal('')),
  province: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  ville: z.string().trim().optional().or(z.literal('')),
  commune: z.string().trim().optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  localisationGeo: z.string().trim().optional().or(z.literal('')),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.').optional().or(z.literal('')),
  chefEtablissement: z.string().trim().optional().or(z.literal('')),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  effectif: z.number().int().min(0).optional(),
  statut: z.string().trim().optional().or(z.literal('')),
  statutValidation: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  ecErcId: z.string().trim().optional().or(z.literal('')),
  structureRattachementId: z.string().trim().optional().or(z.literal('')),
  structureRattachementType: z.string().trim().optional().or(z.literal('')),
});

/** GET /api/etablissements/[id] — fiche détaillée d'un établissement. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const etablissement = await prisma.etablissement.findUnique({
    where: { id: params.id },
    include: {
      coordSousProvinciale: { select: { id: true, nom: true, province: true } },
      ecErc: { select: { id: true, nom: true, type: true } },
      documents: { orderBy: { createdAt: 'desc' } },
      validationLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!etablissement) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ etablissement });
}

/** PUT /api/etablissements/[id] — modifier un établissement (protégé si validé). */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const existing = await prisma.etablissement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  // Une école validée ne peut être modifiée sans une nouvelle validation
  const isValidationChange = data.statutValidation && data.statutValidation !== existing.statutValidation;
  if (existing.statutValidation === 'Validée' && !isValidationChange) {
    return NextResponse.json(
      { error: 'Cet établissement est validé. Toute modification nécessite une nouvelle validation.' },
      { status: 403 },
    );
  }

  const etablissement = await prisma.etablissement.update({
    where: { id: params.id },
    data: {
      nom: data.nom,
      type: data.type ?? '',
      institution: data.institution || existing.institution,
      dinacope: data.dinacope ?? '',
      province: data.province ?? '',
      provinceEducationnelle: data.provinceEducationnelle ?? '',
      ville: data.ville ?? '',
      commune: data.commune ?? '',
      adresse: data.adresse ?? '',
      localisationGeo: data.localisationGeo ?? '',
      telephone: data.telephone ?? '',
      email: data.email ?? '',
      chefEtablissement: data.chefEtablissement ?? '',
      logoUrl: data.logoUrl || null,
      effectif: data.effectif ?? 0,
      statut: data.statut ?? 'Actif',
      statutValidation: data.statutValidation ?? existing.statutValidation,
      structureRattachementId: data.structureRattachementId || null,
      structureRattachementType: data.structureRattachementType || existing.structureRattachementType,
      coordSousProvincialeId: data.coordSousProvincialeId || null,
      ecErcId: data.ecErcId || null,
    },
  });

  // Si le statut de validation change, créer un log
  if (isValidationChange) {
    await prisma.etablissementValidationLog.create({
      data: {
        etablissementId: params.id,
        statut: data.statutValidation!,
        commentaire: 'Modification du statut de validation.',
        validateurId: (auth.user as any).id,
        validateurNom: `${(auth.user as any).nom} ${(auth.user as any).postNom} ${(auth.user as any).prenom}`.trim(),
      },
    });
  }

  return NextResponse.json({ etablissement });
}

/** DELETE /api/etablissements/[id] — supprimer un établissement (interdit si validé). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.etablissement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  if (existing.statutValidation === 'Validée') {
    return NextResponse.json(
      { error: 'Un établissement validé ne peut pas être supprimé. Le suspendre à la place.' },
      { status: 403 },
    );
  }

  await prisma.etablissement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
