import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { buildSignedEleveQr } from '@/lib/qr-eleve-sign';

export const dynamic = 'force-dynamic';

const schema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(500),
});

/**
 * POST /api/eleves/qr-payloads
 *
 * Valeurs à encoder dans les QR Codes des cartes scolaires. La signature est
 * calculée côté serveur (`lib/qr-eleve-sign.ts`) : le QR ne contient que le
 * matricule et sa signature, jamais de données personnelles.
 *
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'COMPTABLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Liste d\'élèves invalide.' }, { status: 400 });
  }

  // Même périmètre que /api/eleves : un élève hors périmètre n'est pas signé.
  const eleves = await prisma.eleve.findMany({
    where: { id: { in: parsed.data.ids }, ...buildEleveScopeWhere(auth.user) },
    select: { id: true, matricule: true },
  });

  return NextResponse.json({
    payloads: eleves.map((e) => ({
      id: e.id,
      matricule: e.matricule,
      payload: buildSignedEleveQr(e.matricule),
    })),
  });
}
