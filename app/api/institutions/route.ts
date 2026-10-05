import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { INSTITUTIONS } from '@/lib/institutions';

/**
 * GET /api/institutions?institution=EC_ERC
 * Retourne la liste des institutions et, si un code est fourni,
 * les structures administratives correspondantes (coordination nationale, provinciale, sous-provinciale).
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const institutionCode = searchParams.get('institution');

  // Toujours retourner la liste des institutions
  const institutions = INSTITUTIONS.map((i) => ({
    code: i.code,
    label: i.label,
    description: i.description,
    structureCompetente: i.structureCompetente,
    adminPath: i.adminPath,
  }));

  if (!institutionCode) {
    return NextResponse.json({ institutions });
  }

  // Charger les structures administratives pour cette institution
  const [coordNationales, coordProvinciales, coordSousProvinciales] = await Promise.all([
    prisma.coordNationale.findMany({
      where: { institution: institutionCode },
      orderBy: { province: 'asc' },
    }),
    prisma.coordProvinciale.findMany({
      where: { institution: institutionCode },
      orderBy: { province: 'asc' },
      include: { sousProvinciales: { orderBy: { nom: 'asc' } } },
    }),
    prisma.coordSousProvinciale.findMany({
      where: { institution: institutionCode },
      orderBy: { nom: 'asc' },
      include: { coordProvinciale: { select: { id: true, province: true } } },
    }),
  ]);

  return NextResponse.json({
    institutions,
    structures: {
      coordNationales,
      coordProvinciales,
      coordSousProvinciales,
    },
  });
}
