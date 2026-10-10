import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteStoredFile, isUploadError, saveUploadedFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const file = formData.get('photo');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });

  const existing = await prisma.user.findUnique({
    where: { id: session },
    select: { profilePhotoUrl: true },
  });
  if (!existing) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });

  let saved;
  try {
    saved = await saveUploadedFile(file, { category: 'profile-photo', folder: 'profile-photos' });
  } catch (error) {
    if (isUploadError(error)) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }

  const user = await prisma.user.update({
    where: { id: session },
    data: { profilePhotoUrl: saved.fileUrl },
    select: { id: true, profilePhotoUrl: true },
  });

  // Remplace l'ancienne photo pour ne pas laisser d'objet orphelin dans le bucket.
  if (existing.profilePhotoUrl && existing.profilePhotoUrl !== saved.fileUrl) {
    await deleteStoredFile(existing.profilePhotoUrl);
  }

  return NextResponse.json({ ok: true, profilePhotoUrl: user.profilePhotoUrl });
}

export async function DELETE(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const existing = await prisma.user.findUnique({
    where: { id: session },
    select: { profilePhotoUrl: true },
  });

  const user = await prisma.user.update({
    where: { id: session },
    data: { profilePhotoUrl: null },
    select: { id: true, profilePhotoUrl: true },
  });

  await deleteStoredFile(existing?.profilePhotoUrl);

  return NextResponse.json({ ok: true });
}
