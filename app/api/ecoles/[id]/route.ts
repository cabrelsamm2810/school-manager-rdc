import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { INSTITUTIONS, parseDateCreation } from '@/lib/institutions';
import { resolveFileUrl } from '@/lib/storage';

const updateSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom officiel est obligatoire.'),
  type: z.string().trim().optional().or(z.literal('')),
  institution: z.string().trim().optional().or(z.literal('')),
  numeroAgrement: z.string().trim().optional().or(z.literal('')),
  dateCreation: z.string().trim().optional().or(z.literal('')),
  dateFermeture: z.string().trim().optional().or(z.literal('')),
  nomAbrege: z.string().trim().optional().or(z.literal('')),
  idSecope: z.string().trim().optional().or(z.literal('')),
  regimeGestion: z.string().trim().optional().or(z.literal('')),
  sections: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
  secteur: z.string().trim().optional().or(z.literal('')),
  quartier: z.string().trim().optional().or(z.literal('')),
  avenue: z.string().trim().optional().or(z.literal('')),
  numeroParcelle: z.string().trim().optional().or(z.literal('')),
  coordinationProvinciale: z.string().trim().optional().or(z.literal('')),
  codeCoordProv: z.string().trim().optional().or(z.literal('')),
  codeCoordSous: z.string().trim().optional().or(z.literal('')),
  sousDivision: z.string().trim().optional().or(z.literal('')),
  promoteur: z.string().trim().optional().or(z.literal('')),
  directeurEtudes: z.string().trim().optional().or(z.literal('')),
  responsableAdministratif: z.string().trim().optional().or(z.literal('')),
  numeroNU: z.string().trim().optional().or(z.literal('')),
  numeroNP: z.string().trim().optional().or(z.literal('')),
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

  return NextResponse.json({ ecole: { ...ecole, logoUrl: await resolveFileUrl(ecole.logoUrl) } });
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

  // Relation par identifiant : si le code d'institution change, l'identifiant suit.
  const institutionCode = data.institution || existing.institution;
  const institutionConfig = INSTITUTIONS.find((i) => i.code === institutionCode);
  const institutionRecord = institutionConfig
    ? await prisma.institution.upsert({
        where: { code: institutionCode },
        update: { nom: institutionConfig.label, categorie: institutionConfig.categorie, description: institutionConfig.description },
        create: { code: institutionCode, nom: institutionConfig.label, categorie: institutionConfig.categorie, description: institutionConfig.description },
      })
    : null;

  const ecole = await prisma.ecole.update({
    where: { id: params.id },
    data: {
      nom: data.nom,
      type: data.type ?? '',
      institution: institutionCode,
      institutionId: institutionRecord?.id ?? existing.institutionId,
      numeroAgrement: data.numeroAgrement !== undefined ? data.numeroAgrement : existing.numeroAgrement,
      dateCreation: data.dateCreation !== undefined ? parseDateCreation(data.dateCreation) : existing.dateCreation,
      dateFermeture: data.dateFermeture !== undefined ? parseDateCreation(data.dateFermeture) : existing.dateFermeture,
      nomAbrege: data.nomAbrege ?? existing.nomAbrege,
      idSecope: data.idSecope ?? existing.idSecope,
      regimeGestion: data.regimeGestion ?? existing.regimeGestion,
      sections: data.sections ?? existing.sections,
      options: data.options ?? existing.options,
      nombreSections: data.sections ? data.sections.length : existing.nombreSections,
      secteur: data.secteur ?? existing.secteur,
      quartier: data.quartier ?? existing.quartier,
      avenue: data.avenue ?? existing.avenue,
      numeroParcelle: data.numeroParcelle ?? existing.numeroParcelle,
      coordinationProvinciale: data.coordinationProvinciale ?? existing.coordinationProvinciale,
      codeCoordProv: data.codeCoordProv ?? existing.codeCoordProv,
      codeCoordSous: data.codeCoordSous ?? existing.codeCoordSous,
      sousDivision: data.sousDivision ?? existing.sousDivision,
      promoteur: data.promoteur ?? existing.promoteur,
      directeurEtudes: data.directeurEtudes ?? existing.directeurEtudes,
      responsableAdministratif: data.responsableAdministratif ?? existing.responsableAdministratif,
      numeroNU: data.numeroNU ?? existing.numeroNU,
      numeroNP: data.numeroNP ?? existing.numeroNP,
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
    },
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

  await prisma.ecole.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
