import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import {
  loadEcoleAutorisee,
  loadEcoleProfilPayload,
  type ProfilUtilisateur,
} from '@/lib/ecole-profil-service';
import { generateEcoleProfilPdf } from '@/lib/ecole-profil-pdf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ecole-profil/pdf?ecoleId=… — fiche PDF de l'école avec son QR Code.
 * Mêmes règles d'accès que la fiche : uniquement les écoles du périmètre du compte.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const ecoleId = new URL(request.url).searchParams.get('ecoleId');
  const cible = await loadEcoleAutorisee(user, ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });

  const payload = await loadEcoleProfilPayload(cible.ecole.id, user);
  if (!payload) return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });

  const generatedBy =
    [user.prenom, user.nom, user.postNom].filter(Boolean).join(' ').trim() || user.role;

  const pdf = await generateEcoleProfilPdf({
    ecole: payload.ecole,
    profil: payload.profil,
    chef: payload.chef,
    sections: payload.sections,
    qrPayload: payload.qrPayload,
    generatedBy,
  });

  const safeCode = payload.profil.codeEcole.replace(/[^A-Za-z0-9-]/g, '') || 'ecole';
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fiche-ecole-${safeCode}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
