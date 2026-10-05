import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { generateBulletinPdf } from '@/lib/bulletin-pdf';

/** GET — télécharge le bulletin d'un élève au format PDF avec QR code intégré. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const bulletinId = searchParams.get('bulletinId');
  const eleveId = searchParams.get('eleveId');
  const periode = searchParams.get('periode');

  let bulletin;

  if (bulletinId) {
    bulletin = await prisma.bulletin.findUnique({ where: { id: bulletinId } });
  } else if (eleveId && periode) {
    bulletin = await prisma.bulletin.findFirst({ where: { eleveId, periode } });
  }

  if (!bulletin) {
    return NextResponse.json({ error: 'Bulletin introuvable. Générez d\'abord le bulletin.' }, { status: 404 });
  }

  // Construire l'URL de vérification
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const verifyUrl = `${baseUrl}/api/cahier-de-cote/bulletin/verify?token=${bulletin.qrToken}`;

  const donnees = JSON.parse(bulletin.donnees || '[]');

  const pdfBuffer = await generateBulletinPdf({
    eleveNom: bulletin.eleveNom,
    eleveMatricule: bulletin.eleveMatricule,
    classe: bulletin.classe,
    etablissementNom: bulletin.etablissementNom,
    periode: bulletin.periode,
    anneeScolaire: bulletin.anneeScolaire,
    moyenneGenerale: bulletin.moyenneGenerale,
    pourcentageGeneral: bulletin.pourcentageGeneral,
    mentionGenerale: bulletin.mentionGenerale,
    generePar: bulletin.generePar,
    createdAt: bulletin.createdAt.toISOString(),
    donnees,
    verifyUrl,
  });

  const filename = `bulletin_${bulletin.eleveNom.replace(/\s+/g, '_')}_${bulletin.periode.replace(/\s+/g, '_')}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
