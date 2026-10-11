import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadFile, deleteFile, resolveFileUrl } from '@/lib/storage';

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const file = formData.get('photo');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Le fichier dépasse 5 Mo.' }, { status: 400 });
  }

  const ext = file.type.split('/')[1] || 'jpg';
  const fileName = `${session}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { storedUrl } = await uploadFile(
    'profile-photos',
    `${fileName}?t=${Date.now()}`,
    bytes,
    file.type,
    true, // public — profile photos are already public locally
  );

  const user = await prisma.user.update({
    where: { id: session },
    data: { profilePhotoUrl: storedUrl },
    select: { id: true, profilePhotoUrl: true },
  });

  return NextResponse.json({ ok: true, profilePhotoUrl: await resolveFileUrl(user.profilePhotoUrl) });
}

export async function DELETE(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  // Récupère l'ancienne URL pour supprimer le fichier stocké
  const existing = await prisma.user.findUnique({
    where: { id: session },
    select: { profilePhotoUrl: true },
  });
  if (existing?.profilePhotoUrl) {
    await deleteFile(existing.profilePhotoUrl);
  }

  await prisma.user.update({
    where: { id: session },
    data: { profilePhotoUrl: null },
    select: { id: true, profilePhotoUrl: true },
  });

  return NextResponse.json({ ok: true });
}
