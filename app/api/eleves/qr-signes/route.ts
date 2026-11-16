import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { createEleveQrValue, ELEVE_QR_PREFIX } from '@/lib/eleve-qr';

/**
 * GET /api/eleves/qr-signes
 * Génère les QR codes signés (`lib/eleve-qr.ts`) des élèves du périmètre du
 * rôle connecté.
 *
 * La signature HMAC est calculée côté serveur : le secret ne sort jamais du
 * serveur et le QR ne contient aucune donnée personnelle (identifiant interne,
 * expiration, signature), contrairement au matricule en clair des anciennes
 * cartes.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const eleves = await prisma.eleve.findMany({
    where: buildEleveScopeWhere(auth.user),
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      classe: true,
      ecole: { select: { nom: true } },
    },
    orderBy: [{ classe: 'asc' }, { nom: 'asc' }],
  });

  return NextResponse.json({
    prefix: ELEVE_QR_PREFIX,
    generatedAt: new Date().toISOString(),
    qrCodes: eleves.map((e) => ({
      ...e,
      qrValue: createEleveQrValue(e.id),
    })),
  });
}
