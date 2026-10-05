import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-photos');

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

  const photoUrl = `/uploads/profile-photos/${fileName}?t=${Date.now()}`;

  const user = await prisma.user.update({
    where: { id: session },
    data: { profilePhotoUrl: photoUrl },
    select: { id: true, profilePhotoUrl: true },
  });

  return NextResponse.json({ ok: true, profilePhotoUrl: user.profilePhotoUrl });
}

export async function DELETE(request: NextRequest) {
  const session = request.cookies.get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const user = await prisma.user.update({
    where: { id: session },
    data: { profilePhotoUrl: null },
    select: { id: true, profilePhotoUrl: true },
  });

  return NextResponse.json({ ok: true });
}
