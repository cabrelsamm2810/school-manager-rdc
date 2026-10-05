import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { generateIdentifiantSM, INSTITUTIONS } from '@/lib/institutions';

const createSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom officiel est obligatoire.'),
  type: z.string().trim().optional().or(z.literal('')),
  institution: z.string().trim().min(1, 'L\u2019institution est obligatoire.'),
  dinacope: z.string().trim().optional().or(z.literal('')),
  province: z.string().trim().min(1, 'La province est obligatoire.'),
  provinceEducationnelle: z.string().trim().min(1, 'La province éducationnelle est obligatoire.'),
  ville: z.string().trim().optional().or(z.literal('')),
  commune: z.string().trim().min(1, 'La commune est obligatoire.'),
  adresse: z.string().trim().min(1, 'L\u2019adresse est obligatoire.'),
  localisationGeo: z.string().trim().optional().or(z.literal('')),
  telephone: z.string().trim().min(1, 'Le numéro de téléphone est obligatoire.'),
  email: z.string().trim().email('L\u2019email est invalide.').optional().or(z.literal('')),
  chefEtablissement: z.string().trim().min(1, 'Le chef d\u2019établissement est obligatoire.'),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  effectif: z.number().int().min(0).optional(),
  statut: z.string().trim().optional().or(z.literal('')),
  statutValidation: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  ecErcId: z.string().trim().optional().or(z.literal('')),
  structureRattachementId: z.string().trim().optional().or(z.literal('')),
  structureRattachementType: z.string().trim().optional().or(z.literal('')),
});

/** GET /api/etablissements */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const province = searchParams.get('province') || undefined;
  const type = searchParams.get('type') || undefined;
  const institution = searchParams.get('institution') || undefined;
  const statutValidation = searchParams.get('statutValidation') || undefined;

  const where: Record<string, unknown> = {};
  if (province) where.province = province;
  if (type) where.type = type;
  if (institution) where.institution = institution;
  if (statutValidation) where.statutValidation = statutValidation;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { dinacope: { contains: search, mode: 'insensitive' } },
      { identifiantSM: { contains: search, mode: 'insensitive' } },
      { province: { contains: search, mode: 'insensitive' } },
      { ville: { contains: search, mode: 'insensitive' } },
      { commune: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filtrage hiérarchique par périmètre territorial
  const scope = getScopeLevel(auth.user.role);
  if (scope === 'sousProvincial' && (auth.user as any).coordSousProvincialeId) {
    where.coordSousProvincialeId = (auth.user as any).coordSousProvincialeId;
  } else if (scope === 'school' && (auth.user as any).etablissementId) {
    where.id = (auth.user as any).etablissementId;
  } else if (scope !== 'national') {
    const userProv = (auth.user as any).provinceAdministrative;
    if (userProv) where.province = userProv;
  }

  const etablissements = await prisma.etablissement.findMany({
    where,
    orderBy: [{ nom: 'asc' }],
    include: {
      coordSousProvinciale: { select: { id: true, nom: true } },
      ecErc: { select: { id: true, nom: true } },
      _count: { select: { documents: true, validationLogs: true } },
    },
  });

  return NextResponse.json({ etablissements });
}

/** POST /api/etablissements */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Valider que l'institution est reconnue
  const validInstitution = INSTITUTIONS.find((i) => i.code === data.institution);
  if (!validInstitution) {
    return NextResponse.json({ error: 'Institution non reconnue.' }, { status: 400 });
  }

  // Générer un identifiant School Manager unique
  let identifiantSM = generateIdentifiantSM(data.institution);
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.etablissement.findFirst({ where: { identifiantSM } });
    if (!exists) break;
    identifiantSM = generateIdentifiantSM(data.institution);
    attempts++;
  }

  // Déterminer la structure de rattachement
  const structureRattachementId = data.structureRattachementId || data.coordSousProvincialeId || '';
  const structureRattachementType = data.structureRattachementType || validInstitution.structureCompetente;

  const etablissement = await prisma.etablissement.create({
    data: {
      nom: data.nom,
      type: data.type ?? '',
      institution: data.institution,
      dinacope: data.dinacope ?? '',
      province: data.province,
      provinceEducationnelle: data.provinceEducationnelle,
      ville: data.ville ?? '',
      commune: data.commune,
      adresse: data.adresse,
      localisationGeo: data.localisationGeo ?? '',
      telephone: data.telephone,
      email: data.email ?? '',
      chefEtablissement: data.chefEtablissement,
      logoUrl: data.logoUrl || null,
      identifiantSM,
      effectif: data.effectif ?? 0,
      statut: data.statut ?? 'Actif',
      statutValidation: data.statutValidation || 'Brouillon',
      structureRattachementId: structureRattachementId || null,
      structureRattachementType,
      coordSousProvincialeId: data.coordSousProvincialeId || null,
      ecErcId: data.ecErcId || null,
    },
  });

  // Si le statut est "En attente de vérification", créer un log de validation
  if (etablissement.statutValidation === 'En attente de vérification') {
    await prisma.etablissementValidationLog.create({
      data: {
        etablissementId: etablissement.id,
        statut: 'En attente de vérification',
        commentaire: 'Dossier soumis pour vérification.',
        validateurId: (auth.user as any).id,
        validateurNom: `${(auth.user as any).nom} ${(auth.user as any).postNom} ${(auth.user as any).prenom}`.trim(),
      },
    });
  }

  return NextResponse.json({ etablissement }, { status: 201 });
}
