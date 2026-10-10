import { NextRequest, NextResponse } from 'next/server';
import { loginUser, registerUser } from '@/lib/account-service';
import { isStorageEnabled, uploadObject } from '@/lib/storage';
import { buildFileUrl, buildObjectKey } from '@/lib/file-validation';

const INLINE_PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_INLINE_PHOTO = 5 * 1024 * 1024;

/**
 * L'inscription envoie la photo de profil sous forme de data URL (comportement
 * historique). Quand R2 est configuré, on la dépose dans le bucket privé et on
 * ne conserve que la référence : le reste du flux d'inscription est inchangé.
 * En cas d'échec, la data URL d'origine est conservée.
 */
async function persistInlineProfilePhoto(body: Record<string, unknown>): Promise<void> {
  const photo = typeof body.profilePhotoUrl === 'string' ? body.profilePhotoUrl : '';
  if (!photo.startsWith('data:image/') || !isStorageEnabled()) return;

  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(photo);
  if (!match) return;

  const mimeType = match[1].toLowerCase();
  const extension = INLINE_PHOTO_TYPES[mimeType];
  if (!extension) return;

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_INLINE_PHOTO) return;

  try {
    const key = buildObjectKey('profile-photos', `profil.${extension}`);
    await uploadObject(key, new Uint8Array(bytes), mimeType);
    body.profilePhotoUrl = buildFileUrl(key);
  } catch {
    // On garde la data URL : l'inscription ne doit pas échouer pour un stockage.
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body && typeof body === 'object') {
      await persistInlineProfilePhoto(body as Record<string, unknown>);
    }

    const result = await registerUser(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: result.user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur est survenue lors de l\u2019inscription.' }, { status: 500 });
  }
}
