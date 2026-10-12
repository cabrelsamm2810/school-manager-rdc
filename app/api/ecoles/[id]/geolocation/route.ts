import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';

const geoSchema = z.object({
  latitude: z.number().min(-90, 'Latitude invalide').max(90, 'Latitude invalide'),
  longitude: z.number().min(-180, 'Longitude invalide').max(180, 'Longitude invalide'),
});

/** PATCH /api/ecoles/[id]/geolocation — met à jour uniquement les coordonnées GPS. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = geoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Coordonnées invalides.' },
      { status: 400 },
    );
  }

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
      return NextResponse.json({ error: 'Accès refusé : école différente.' }, { status: 403 });
    }
    if (scope === 'sousProvincial' && user.coordSousProvincialeId && existing.coordSousProvincialeId !== user.coordSousProvincialeId) {
      return NextResponse.json({ error: 'Accès refusé : sous-province différente.' }, { status: 403 });
    }
    if (scope === 'provincial' && user.provinceAdministrative && existing.province !== user.provinceAdministrative) {
      return NextResponse.json({ error: 'Accès refusé : province différente.' }, { status: 403 });
    }
  }

  const ecole = await prisma.ecole.update({
    where: { id: params.id },
    data: {
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    },
    select: { latitude: true, longitude: true },
  });

  return NextResponse.json({ ecole });
}
