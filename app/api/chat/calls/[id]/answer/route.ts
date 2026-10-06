import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

// POST — l'appelé répond avec l'answer SDP
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

  if (call.calleeId !== currentUser.id) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = await request.json();
  const { answer } = body as { answer: string };

  if (!answer) {
    return NextResponse.json({ error: 'Answer manquante.' }, { status: 400 });
  }

  await prisma.chatCall.update({
    where: { id: params.id },
    data: { answer, status: 'answered' },
  });

  return NextResponse.json({ ok: true });
}
