import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

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

  // Vérifie que l'utilisateur est participant
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

  const body = await request.json();
  const { content } = body as { content: string };

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.id,
      senderId: currentUser.id,
      content: content.trim(),
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
  });
}
