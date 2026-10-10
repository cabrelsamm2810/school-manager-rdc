import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { authorizeFileRead } from '@/lib/file-access';
import { isStorageEnabled, readObject, getSignedDownloadUrl, usesSignedRedirects } from '@/lib/storage';
import { isUnsafeStorageKey, sanitizeFileName } from '@/lib/file-validation';

/**
 * GET /api/files/<clé>
 * Sert un fichier privé du bucket R2 après vérification des autorisations.
 * - `S3_PUBLIC_ENDPOINT` défini  → redirection 302 vers une URL signée temporaire.
 * - sinon                        → l'objet est servi par le serveur applicatif.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const key = (params.key || []).map((segment) => decodeURIComponent(segment)).join('/');
  if (isUnsafeStorageKey(key)) {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }

  const access = await authorizeFileRead(key, { id: user.id, role: user.role });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!isStorageEnabled()) {
    return NextResponse.json(
      { error: 'Stockage distant non configuré pour ce fichier.' },
      { status: 404 }
    );
  }

  const downloadName = sanitizeFileName(key.split('/').pop() || 'fichier').replace(/^\d+-[a-z0-9]{6}-/, '');

  if (usesSignedRedirects()) {
    const signedUrl = await getSignedDownloadUrl(key, { fileName: downloadName });
    if (!signedUrl) {
      return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
    }
    return NextResponse.redirect(signedUrl, 302);
  }

  const object = await readObject(key);
  if (!object) {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }

  // Le typage générique de Uint8Array (TS >= 5.7) n'est pas reconnu comme
  // BodyInit : le contenu est bien un flux d'octets binaire.
  return new NextResponse(object.body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': object.contentType,
      'Content-Length': object.contentLength.toString(),
      'Content-Disposition': `inline; filename="${downloadName}"`,
      'Cache-Control': 'private, max-age=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
