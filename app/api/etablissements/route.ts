import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildScopeWhere, getScopeLevel } from '@/lib/territory-filter';

const createSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  type: z.string().trim().optional().or(z.literal('')),
  province: z.string().trim().optional().or(z.literal('')),
  ville: z.string().trim().optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.').optional().or(z.literal('')),
  effectif: z.number().int().min(0).optional(),
  statut: z.string().trim().optional().or(z.literal('')),
  coordSousProvincialeId: z.string().trim().optional().or(z.literal('')),
  ecErcId: z.string().trim().optional().or(z.literal('')),
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

  const where: Record<string, unknown> = {};
  if (province) where.province = province;
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { province: { contains: search, mode: 'insensitive' } },
      { ville: { contains: search, mode: 'insensitive' } },
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
    include: { coordSousProvinciale: { select: { id: true, nom: true } }, ecErc: { select: { id: true, nom: true } } },
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
      { error: parsed.error.issues[0]?.message ?? 'Donn\u00e9es invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const etablissement = await prisma.etablissement.create({
    data: {
      nom: data.nom,
      type: data.type ?? '',
      province: data.province ?? '',
      ville: data.ville ?? '',
      adresse: data.adresse ?? '',
      telephone: data.telephone ?? '',
      email: data.email ?? '',
      effectif: data.effectif ?? 0,
      statut: data.statut ?? 'Actif',
      coordSousProvincialeId: data.coordSousProvincialeId || null,
      ecErcId: data.ecErcId || null,
    },
  });

  return NextResponse.json({ etablissement }, { status: 201 });
}
