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

  const membership = await prisma.chatGroupMember.findUnique({
    where: {
      groupId_userId: { groupId: params.id, userId: currentUser.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const message = await prisma.chatGroupMessage.findUnique({
    where: { id: params.messageId },
  });

  if (!message || message.groupId !== params.id) {
    return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 });
  }

  // Seul l'auteur du message ou un admin du groupe peut supprimer
  if (message.senderId !== currentUser.id && membership.role !== 'admin') {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  await prisma.chatGroupMessage.delete({ where: { id: params.messageId } });
  await deleteStoredFile(message.fileUrl);

  return NextResponse.json({ success: true });
}
