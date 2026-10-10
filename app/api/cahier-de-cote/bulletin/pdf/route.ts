import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { generateBulletinPdf } from '@/lib/bulletin-pdf';
import { isStorageEnabled, readObject, uploadObject } from '@/lib/storage';
import { buildFileUrl, buildObjectKey, parseFileUrl } from '@/lib/file-validation';

function pdfResponse(bytes: Uint8Array, filename: string) {
  // Le typage générique de Uint8Array (TS >= 5.7) n'est pas reconnu comme
  // BodyInit : le contenu est bien un flux d'octets binaire.
  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': bytes.length.toString(),
    },
  });
}

/**
 * GET — télécharge le bulletin d'un élève au format PDF avec QR code intégré.
 * Le PDF est archivé dans R2 (bucket privé) au premier téléchargement puis
 * servi depuis ce stockage ; le format et les en-têtes de réponse sont inchangés.
 */
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

  const filename = `bulletin_${bulletin.eleveNom.replace(/\s+/g, '_')}_${bulletin.periode.replace(/\s+/g, '_')}.pdf`;

  // Bulletin déjà archivé dans R2 : servi depuis le bucket privé.
  const archived = parseFileUrl(bulletin.pdfUrl);
  if (archived?.storage === 'r2' && isStorageEnabled()) {
    const object = await readObject(archived.key);
    if (object) return pdfResponse(object.body, filename);
  }

  // Construire l'URL de vérification
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const verifyUrl = `${baseUrl}/verifier-bulletin?token=${bulletin.qrToken}`;

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

  // Archivage best-effort : un échec de stockage ne doit pas bloquer le téléchargement.
  if (isStorageEnabled()) {
    try {
      const key = buildObjectKey('bulletins', filename);
      await uploadObject(key, new Uint8Array(pdfBuffer), 'application/pdf');
      await prisma.bulletin.update({
        where: { id: bulletin.id },
        data: { pdfUrl: buildFileUrl(key) },
      });
    } catch (error) {
      console.error('[bulletin] archivage R2 impossible', error);
    }
  }

  return pdfResponse(new Uint8Array(pdfBuffer), filename);
}
