import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
  'audio/mp4',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: params.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });
  }

  if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  // Marque les messages reçus comme lus
  await prisma.chatMessage.updateMany({
    where: {
      conversationId: params.id,
      senderId: { not: currentUser.id },
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      createdAt: m.createdAt,
      read: m.read,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileType: m.fileType,
    }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: params.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });
  }

  if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') || '';

  let content = '';
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    // ── Upload avec fichier ──
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }

    content = (formData.get('content') as string)?.trim() || '';
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Le fichier dépasse 10 Mo.' }, { status: 400 });
    }

    // Sauvegarde le fichier
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat-files');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, uniqueName), Buffer.from(bytes));

    fileUrl = `/uploads/chat-files/${uniqueName}`;
    fileName = file.name;
    fileType = file.type;
  } else {
    // ── Message texte seul ──
    const body = await request.json();
    content = (body.content as string)?.trim() || '';
  }

  if (!content && !fileUrl) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.id,
      senderId: currentUser.id,
      content,
      fileUrl,
      fileName,
      fileType,
    },
  });

  // Met à jour la conversation pour le tri
  await prisma.chatConversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    createdAt: message.createdAt,
    read: message.read,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    fileType: message.fileType,
  });
}
