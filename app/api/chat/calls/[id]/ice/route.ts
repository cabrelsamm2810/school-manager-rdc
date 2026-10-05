import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

// POST — ajoute un ICE candidate (l'appelant ou l'appelé)
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

  const body = await request.json();
  const { candidate } = body as { candidate: string };

  if (!candidate) {
    return NextResponse.json({ error: 'Candidate manquant.' }, { status: 400 });
  }

  const isCaller = call.callerId === currentUser.id;
  const field = isCaller ? 'callerIce' : 'calleeIce';
  const current = JSON.parse(call[field] || '[]') as string[];
  current.push(candidate);

  await prisma.chatCall.update({
    where: { id: params.id },
    data: { [field]: JSON.stringify(current) },
  });

  return NextResponse.json({ ok: true });
}
