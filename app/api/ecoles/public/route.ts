import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INSTITUTIONS } from '@/lib/institutions';

/**
 * GET /api/ecoles/public
 * Endpoint public (sans auth) pour lister les écoles actives d'une institution.
 * Utilisé par le formulaire d'inscription pour la sélection d'école.
 *
 * Query params:
 *   institution  — code d'institution (EC_ERC, PUBLIQUE, …) requis
 *   province      — filtrer par province administrative (optionnel)
 *   search        — recherche par nom / dinacope / commune (optionnel)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const institution = searchParams.get('institution') || undefined;
  const province = searchParams.get('province') || undefined;
  const search = searchParams.get('search') || undefined;

  if (!institution) {
    return NextResponse.json({ error: 'Le paramètre institution est requis.' }, { status: 400 });
  }

  // Valider que l'institution est reconnue
  const validInst = INSTITUTIONS.find((i) => i.code === institution);
  if (!validInst) {
    return NextResponse.json({ error: 'Institution non reconnue.' }, { status: 400 });
  }

  const where: Record<string, unknown> = {
    institution,
    statut: 'Actif',
  };
  if (province) where.province = province;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { dinacope: { contains: search, mode: 'insensitive' } },
      { commune: { contains: search, mode: 'insensitive' } },
    ];
  }

  const ecoles = await prisma.ecole.findMany({
    where,
    orderBy: [{ nom: 'asc' }],
    take: 100,
    select: {
      id: true,
      nom: true,
      dinacope: true,
      province: true,
      commune: true,
      type: true,
      adresse: true,
    },
  });

  return NextResponse.json({ ecoles });
}
