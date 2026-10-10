import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { deleteStoredFile } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
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

  const message = await prisma.chatMessage.findUnique({
    where: { id: params.messageId },
  });

  if (!message || message.conversationId !== params.id) {
    return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 });
  }

  if (message.senderId !== currentUser.id) {
    return NextResponse.json({ error: 'Vous ne pouvez supprimer que vos propres messages.' }, { status: 403 });
  }

  await prisma.chatMessage.delete({ where: { id: params.messageId } });
  await deleteStoredFile(message.fileUrl);

  return NextResponse.json({ success: true });
}
