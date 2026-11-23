import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { buildProfilAdministratif } from '@/lib/ecole-registration';

const updateSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom officiel est obligatoire.'),
  codeEcole: z.string().trim().optional().or(z.literal('')),
  type: z.string().trim().optional().or(z.literal('')),
  institution: z.string().trim().optional().or(z.literal('')),
  dinacope: z.string().trim().optional().or(z.literal('')),
  province: z.string().trim().optional().or(z.literal('')),
  provinceEducationnelle: z.string().trim().optional().or(z.literal('')),
  ville: z.string().trim().optional().or(z.literal('')),
  commune: z.string().trim().optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  localisationGeo: z.string().trim().optional().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.').optional().or(z.literal('')),
  chefEcole: z.string().trim().optional().or(z.literal('')),
  chefTelephone: z.string().trim().optional().or(z.literal('')),
  chefEmail: z.string().trim().email('L\u2019email du chef est invalide.').optional().or(z.literal('')),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  effectif: z.number().int().min(0).optional(),
  statut: z.string().trim().optional().or(z.literal('')),
  statutValidation: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  ecErcId: z.string().trim().optional().or(z.literal('')),
  structureRattachementId: z.string().trim().optional().or(z.literal('')),
  structureRattachementType: z.string().trim().optional().or(z.literal('')),
});

/** GET /api/ecoles/[id] — fiche détaillée d'un école. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const ecole = await prisma.ecole.findUnique({
    where: { id: params.id },
    include: {
      coordSousProvinciale: { select: { id: true, nom: true, province: true } },
      ecErc: { select: { id: true, nom: true, type: true } },
      chefPrincipal: true,
      profilAdministratif: true,
      documents: { orderBy: { createdAt: 'desc' } },
      documentAudits: { orderBy: { createdAt: 'desc' }, take: 50 },
      validationLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!ecole) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  // ── Isolation par institution et périmètre territorial ──
  const user = auth.user as any;
  if (user.role !== 'SUPER_ADMIN') {
    if (user.typeInstitution && user.typeInstitution !== ecole.institution) {
      return NextResponse.json({ error: 'Accès refusé : institution différente.' }, { status: 403 });
    }
    const scope = getScopeLevel(user.role);
    if (scope === 'school' && user.ecoleId && user.ecoleId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé : école différent.' }, { status: 403 });
    }
    if (scope === 'sousProvincial' && user.coordSousProvincialeId && ecole.coordSousProvincialeId !== user.coordSousProvincialeId) {
      return NextResponse.json({ error: 'Accès refusé : sous-province différente.' }, { status: 403 });
    }
    if (scope === 'provincial' && user.provinceAdministrative && ecole.province !== user.provinceAdministrative) {
      return NextResponse.json({ error: 'Accès refusé : province différente.' }, { status: 403 });
    }
  }

  return NextResponse.json({ ecole });
}

/** PUT /api/ecoles/[id] — modifier un école (protégé si validé). */
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
  const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  // ── Isolation par institution et périmètre ──
  const user = auth.user as any;
  if (user.role !== 'SUPER_ADMIN') {
    if (user.typeInstitution && user.typeInstitution !== existing.institution) {
      return NextResponse.json({ error: 'Accès refusé : institution différente.' }, { status: 403 });
    }
    const scope = getScopeLevel(user.role);
    if (scope === 'school' && user.ecoleId && user.ecoleId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé : école différent.' }, { status: 403 });
    }
    if (scope === 'sousProvincial' && user.coordSousProvincialeId && existing.coordSousProvincialeId !== user.coordSousProvincialeId) {
      return NextResponse.json({ error: 'Accès refusé : sous-province différente.' }, { status: 403 });
    }
    if (scope === 'provincial' && user.provinceAdministrative && existing.province !== user.provinceAdministrative) {
      return NextResponse.json({ error: 'Accès refusé : province différente.' }, { status: 403 });
    }
  }

  // Une école validée ne peut être modifiée sans une nouvelle validation
  const isValidationChange = data.statutValidation && data.statutValidation !== existing.statutValidation;
  if (existing.statutValidation === 'Validée' && !isValidationChange) {
    return NextResponse.json(
      { error: 'Cet école est validé. Toute modification nécessite une nouvelle validation.' },
      { status: 403 },
    );
  }

  // ── Anti-doublon à la modification ──
  const nextCode = data.codeEcole?.trim();
  if (nextCode && nextCode !== (existing.codeEcole || '')) {
    const dupCode = await prisma.ecole.findFirst({
      where: {
        id: { not: params.id },
        OR: [
          { codeEcole: { equals: nextCode, mode: 'insensitive' } },
          { identifiantSM: { equals: nextCode, mode: 'insensitive' } },
        ],
      },
      select: { nom: true },
    });
    if (dupCode) {
      return NextResponse.json(
        { error: `Le code « ${nextCode} » est déjà utilisé par « ${dupCode.nom} ».` },
        { status: 409 },
      );
    }
  }
  const dupName = await prisma.ecole.findFirst({
    where: {
      id: { not: params.id },
      nom: { equals: data.nom, mode: 'insensitive' },
      province: data.province ?? existing.province,
      commune: { equals: data.commune ?? existing.commune, mode: 'insensitive' },
    },
    select: { nom: true },
  });
  if (dupName) {
    return NextResponse.json(
      { error: `Un établissement identique existe déjà : « ${dupName.nom} ».` },
      { status: 409 },
    );
  }

  const profil = buildProfilAdministratif({
    identifiantSM: existing.identifiantSM ?? params.id,
    institution: data.institution || existing.institution,
    province: data.province ?? existing.province,
    provinceEducationnelle: data.provinceEducationnelle ?? existing.provinceEducationnelle,
    coordSousProvincialeId: data.coordSousProvincialeId || existing.coordSousProvincialeId,
    structureRattachementId: data.structureRattachementId || existing.structureRattachementId,
    structureRattachementType: data.structureRattachementType || existing.structureRattachementType,
  });

  const ecole = await prisma.$transaction(async (tx) => {
    const updated = await tx.ecole.update({
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
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        telephone: data.telephone ?? '',
        email: data.email ?? '',
        chefEcole: data.chefEcole ?? '',
        logoUrl: data.logoUrl || null,
        effectif: data.effectif ?? 0,
        statut: data.statut ?? 'Actif',
        statutValidation: data.statutValidation ?? existing.statutValidation,
        structureRattachementId: data.structureRattachementId || null,
        structureRattachementType: data.structureRattachementType || existing.structureRattachementType,
        coordSousProvincialeId: data.coordSousProvincialeId || null,
        ecErcId: data.ecErcId || null,
        codeEcole: data.codeEcole?.trim() || existing.codeEcole || undefined,
      },
    });

    // Chef principal : mise à jour du chef existant, ou création puis association.
    let chefPrincipal: { id: string; nom: string; telephone: string; email: string } | null = null;
    if (data.chefEcole) {
      const chefData = {
        nom: data.chefEcole,
        telephone: data.chefTelephone ?? '',
        email: data.chefEmail ?? '',
      };
      if (existing.chefPrincipalId) {
        chefPrincipal = await tx.ecoleChef.update({ where: { id: existing.chefPrincipalId }, data: chefData });
      } else {
        chefPrincipal = await tx.ecoleChef.create({ data: chefData });
        await tx.ecole.update({ where: { id: params.id }, data: { chefPrincipalId: chefPrincipal.id } });
      }
    }

    // Profil administratif : maintenu en phase avec le rattachement.
    const profilAdministratif = await tx.ecoleProfilAdministratif.upsert({
      where: { ecoleId: params.id },
      create: { ...profil, ecoleId: params.id },
      update: profil,
    });

    return { ...updated, chefPrincipal, profilAdministratif };
  });

  // Si le statut de validation change, créer un log
  if (isValidationChange) {
    await prisma.ecoleValidationLog.create({
      data: {
        ecoleId: params.id,
        statut: data.statutValidation!,
        commentaire: 'Modification du statut de validation.',
        validateurId: (auth.user as any).id,
        validateurNom: `${(auth.user as any).nom} ${(auth.user as any).postNom} ${(auth.user as any).prenom}`.trim(),
      },
    });
  }

  return NextResponse.json({ ecole });
}

/** DELETE /api/ecoles/[id] — supprimer un école (interdit si validé). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  if (existing.statutValidation === 'Validée') {
    return NextResponse.json(
      { error: 'Un école validé ne peut pas être supprimé. Le suspendre à la place.' },
      { status: 403 },
    );
  }

  // ── Isolation par institution et périmètre ──
  const user = auth.user as any;
  if (user.role !== 'SUPER_ADMIN') {
    if (user.typeInstitution && user.typeInstitution !== existing.institution) {
      return NextResponse.json({ error: 'Accès refusé : institution différente.' }, { status: 403 });
    }
    const scope = getScopeLevel(user.role);
    if (scope === 'school' && user.ecoleId && user.ecoleId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé : école différent.' }, { status: 403 });
    }
    if (scope === 'sousProvincial' && user.coordSousProvincialeId && existing.coordSousProvincialeId !== user.coordSousProvincialeId) {
      return NextResponse.json({ error: 'Accès refusé : sous-province différente.' }, { status: 403 });
    }
    if (scope === 'provincial' && user.provinceAdministrative && existing.province !== user.provinceAdministrative) {
      return NextResponse.json({ error: 'Accès refusé : province différente.' }, { status: 403 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.ecole.delete({ where: { id: params.id } });
    // Le chef principal n'a plus d'école : supprimer son enregistrement orphelin.
    if (existing.chefPrincipalId) {
      await tx.ecoleChef.delete({ where: { id: existing.chefPrincipalId } });
    }
  });
  return NextResponse.json({ ok: true });
}
