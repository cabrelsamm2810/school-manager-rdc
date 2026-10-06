import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const interactions = await prisma.dossierEleveInteraction.findMany({
    where: { eleveId: params.id },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(interactions);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const eleve = await prisma.eleve.findUnique({ where: { id: params.id } });
  if (!eleve) return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });

  const body = await request.json();
  const { type, sujet, description, date, intervenant, statut } = body as {
    type: string; sujet: string; description?: string;
    date?: string; intervenant?: string; statut?: string;
  };

  if (!type?.trim()) return NextResponse.json({ error: 'Le type est obligatoire.' }, { status: 400 });
  if (!sujet?.trim()) return NextResponse.json({ error: 'Le sujet est obligatoire.' }, { status: 400 });

  const interaction = await prisma.dossierEleveInteraction.create({
    data: {
      eleveId: params.id,
      type: type.trim(),
      sujet: sujet.trim(),
      description: description || '',
      date: date ? new Date(date) : new Date(),
      intervenant: intervenant || `${user.prenom} ${user.nom}`.trim(),
      statut: statut || 'Enregistré',
    },
  });

  return NextResponse.json(interaction, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const intId = searchParams.get('intId');
  if (!intId) return NextResponse.json({ error: 'ID interaction manquant.' }, { status: 400 });

  await prisma.dossierEleveInteraction.delete({ where: { id: intId, eleveId: params.id } });
  return NextResponse.json({ ok: true });
}
