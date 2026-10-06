import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

// GET — liste les appels entrants (ringing) pour l'utilisateur courant
export async function GET(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const calls = await prisma.chatCall.findMany({
    where: {
      calleeId: currentUser.id,
      status: 'ringing',
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    calls.map((c) => ({
      id: c.id,
      conversationId: c.conversationId,
      callerId: c.callerId,
      type: c.type,
      status: c.status,
      createdAt: c.createdAt,
    }))
  );
}

// POST — initie un appel (l'appelant envoie l'offer SDP)
export async function POST(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationId, type, offer } = body as {
    conversationId: string;
    type: string;
    offer: string;
  };

  if (!conversationId || !offer) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  // Vérifie que l'utilisateur fait partie de la conversation
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });
  }

  if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const calleeId =
    conversation.user1Id === currentUser.id
      ? conversation.user2Id
      : conversation.user1Id;

  // Vérifie qu'il n'y a pas déjà un appel en cours pour cette conversation
  const existing = await prisma.chatCall.findFirst({
    where: {
      conversationId,
      status: { in: ['ringing', 'answered'] },
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Un appel est déjà en cours.' }, { status: 409 });
  }

  const call = await prisma.chatCall.create({
    data: {
      conversationId,
      callerId: currentUser.id,
      calleeId,
      type: type === 'video' ? 'video' : 'audio',
      status: 'ringing',
      offer,
    },
  });

  return NextResponse.json({ id: call.id });
}
