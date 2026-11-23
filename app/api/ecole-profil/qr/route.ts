import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { buildEcoleQrValue } from '@/lib/ecole-profil';
import {
  canEditEcoleProfil,
  ensureEcoleProfil,
  generateQrToken,
  loadEcoleAutorisee,
  logEcoleProfil,
  type ProfilUtilisateur,
} from '@/lib/ecole-profil-service';

/**
 * POST /api/ecole-profil/qr — régénère le QR Code de l'établissement.
 * L'ancien QR devient immédiatement invalide (jeton remplacé).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const body = await request.json().catch(() => null);
  const cible = await loadEcoleAutorisee(user, (body as { ecoleId?: string } | null)?.ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });
  if (!canEditEcoleProfil(user, cible.ecole)) {
    return NextResponse.json({ error: 'Votre compte n’est pas autorisé à régénérer ce QR Code.' }, { status: 403 });
  }

  const profil = await ensureEcoleProfil(cible.ecole.id, cible.ecole.institution, user);
  const updated = await prisma.ecoleProfil.update({
    where: { id: profil.id },
    data: { qrToken: generateQrToken() },
  });

  await logEcoleProfil(cible.ecole.id, user, { action: 'QR_REGENERATION', champ: 'qrToken' });

  return NextResponse.json({
    qrPayload: buildEcoleQrValue(updated.codeEcole, updated.qrToken),
  });
}
