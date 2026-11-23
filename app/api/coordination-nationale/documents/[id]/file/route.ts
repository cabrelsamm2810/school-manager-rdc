import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalAccess } from '@/lib/national-access';
import { readFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** Nom de fichier compatible avec l'en-tête Content-Disposition (ASCII). */
function asciiFileName(name: string): string {
  return name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') || 'document';
}

/**
 * GET /api/coordination-nationale/documents/[id]/file
 * Sert le fichier joint d'un document national à travers l'application,
 * après contrôle du rôle (session serveur). Aucun lien direct vers le
 * stockage n'est exposé au navigateur.
 *
 * `?download=1` force le téléchargement ; sans ce paramètre le fichier est
 * affiché dans le navigateur (consultation : PDF, images, texte).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const document = await prisma.documentNational.findUnique({ where: { id: params.id } });
  if (!document) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }
  if (!document.fileUrl) {
    return NextResponse.json({ error: 'Ce document ne comporte aucun fichier joint.' }, { status: 404 });
  }

  const file = await readFile(document.fileUrl);
  if (!file) {
    return NextResponse.json({ error: 'Fichier indisponible.' }, { status: 404 });
  }

  const download = new URL(request.url).searchParams.get('download') === '1';
  const fileName = document.fileName || 'document';
  const contentType = document.fileType || file.contentType || 'application/octet-stream';

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(file.buffer.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${asciiFileName(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
