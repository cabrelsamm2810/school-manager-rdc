import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { ROLE_LABELS } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  // Récupère toutes les conversations où l'utilisateur est participant
  const conversations = await prisma.chatConversation.findMany({
    where: {
      OR: [{ user1Id: currentUser.id }, { user2Id: currentUser.id }],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Récupère les infos de l'autre participant pour chaque conversation
  const otherUserIds = conversations.map((c) =>
    c.user1Id === currentUser.id ? c.user2Id : c.user1Id
  );

  const otherUsers = await prisma.user.findMany({
    where: { id: { in: otherUserIds } },
    select: {
      id: true,
      nom: true,
      postNom: true,
      prenom: true,
      email: true,
      role: true,
      profilePhotoUrl: true,
      isActive: true,
    },
  });

  const userMap = new Map(otherUsers.map((u) => [u.id, u]));

  // Compte les messages non lus par conversation
  const unreadCounts = await prisma.chatMessage.groupBy({
    by: ['conversationId'],
    where: {
      senderId: { not: currentUser.id },
      read: false,
    },
    _count: true,
  });

  const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count]));

  return NextResponse.json(
    conversations.map((c) => {
      const otherId = c.user1Id === currentUser.id ? c.user2Id : c.user1Id;
      const other = userMap.get(otherId);
      const lastMsg = c.messages[0];
      return {
        id: c.id,
        otherUser: other
          ? {
              ...other,
              roleLabel: ROLE_LABELS[other.role] ?? other.role,
              displayName: `${other.prenom} ${other.nom}`.trim(),
            }
          : null,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              senderId: lastMsg.senderId,
            }
          : null,
        unreadCount: unreadMap.get(c.id) ?? 0,
        updatedAt: c.updatedAt,
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const body = await request.json();
  const { otherUserId } = body as { otherUserId: string };

  if (!otherUserId || otherUserId === currentUser.id) {
    return NextResponse.json({ error: 'Utilisateur invalide.' }, { status: 400 });
  }

  // Vérifie que l'autre utilisateur existe
  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // Ordonne les IDs pour garantir l'unicité de la paire
  const [user1Id, user2Id] =
    currentUser.id < otherUserId
      ? [currentUser.id, otherUserId]
      : [otherUserId, currentUser.id];

  // Trouve ou crée la conversation
  let conversation = await prisma.chatConversation.findUnique({
    where: { user1Id_user2Id: { user1Id, user2Id } },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: { user1Id, user2Id },
    });
  }

  return NextResponse.json({ id: conversation.id });
}
