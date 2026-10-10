import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { isUploadError, saveUploadedFile } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  // Vérifie l'appartenance au groupe
  const membership = await prisma.chatGroupMember.findUnique({
    where: {
      groupId_userId: { groupId: params.id, userId: currentUser.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const messages = await prisma.chatGroupMessage.findMany({
    where: { groupId: params.id },
    include: {
      sender: { select: { id: true, prenom: true, nom: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: `${m.sender.prenom} ${m.sender.nom}`.trim(),
      createdAt: m.createdAt,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileType: m.fileType,
      replyToId: m.replyToId,
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

  // Vérifie l'appartenance au groupe
  const membership = await prisma.chatGroupMember.findUnique({
    where: {
      groupId_userId: { groupId: params.id, userId: currentUser.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') || '';

  let content = '';
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;
  let replyToId: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }

    content = (formData.get('content') as string)?.trim() || '';
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }

    // Sauvegarde le fichier (R2 si configuré, sinon public/uploads)
    let saved;
    try {
      saved = await saveUploadedFile(file, { category: 'chat-attachment', folder: 'chat-files' });
    } catch (error) {
      if (isUploadError(error)) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }

    fileUrl = saved.fileUrl;
    fileName = saved.fileName;
    fileType = saved.fileType;
  } else {
    const body = await request.json();
    content = (body.content as string)?.trim() || '';
    replyToId = (body.replyToId as string) || null;
  }

  if (!content && !fileUrl) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }

  const message = await prisma.chatGroupMessage.create({
    data: {
      groupId: params.id,
      senderId: currentUser.id,
      content,
      fileUrl,
      fileName,
      fileType,
      replyToId,
    },
  });

  // Met à jour le groupe pour le tri
  await prisma.chatGroup.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderName: `${currentUser.prenom} ${currentUser.nom}`.trim(),
    createdAt: message.createdAt,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    fileType: message.fileType,
    replyToId: message.replyToId,
  });
}
