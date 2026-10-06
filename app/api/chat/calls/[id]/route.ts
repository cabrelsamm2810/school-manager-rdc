import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

// GET — récupère l'état d'un appel (offer/answer/ICE)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const call = await prisma.chatCall.findUnique({ where: { id: params.id } });
  if (!call) {
    return NextResponse.json({ error: 'Appel introuvable.' }, { status: 404 });
  }

  if (call.callerId !== currentUser.id && call.calleeId !== currentUser.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const isCaller = call.callerId === currentUser.id;

  return NextResponse.json({
    id: call.id,
    conversationId: call.conversationId,
    callerId: call.callerId,
    calleeId: call.calleeId,
    type: call.type,
    status: call.status,
    offer: call.offer,
    answer: call.answer,
    // Chaque côté reçoit les ICE candidates de l'autre
    ice: isCaller ? call.calleeIce : call.callerIce,
    createdAt: call.createdAt,
  });
}

// POST — termine ou rejette un appel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const call = await prisma.chatCall.findUnique({ where: { id: params.id } });
  if (!call) {
    return NextResponse.json({ error: 'Appel introuvable.' }, { status: 404 });
  }

  if (call.callerId !== currentUser.id && call.calleeId !== currentUser.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const status = (body as { status?: string })?.status || 'ended';

  await prisma.chatCall.update({
    where: { id: params.id },
    data: { status: ['ended', 'rejected', 'missed'].includes(status) ? status : 'ended' },
  });

  return NextResponse.json({ ok: true });
}
