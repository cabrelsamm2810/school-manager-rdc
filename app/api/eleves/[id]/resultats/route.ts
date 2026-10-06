import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const resultats = await prisma.dossierEleveResultat.findMany({
    where: { eleveId: params.id },
    orderBy: [{ anneeScolaire: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(resultats);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const eleve = await prisma.eleve.findUnique({ where: { id: params.id } });
  if (!eleve) return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });

  const body = await request.json();
  const { periode, matiere, note, moyenne, mention, appreciation, anneeScolaire } = body as {
    periode: string; matiere?: string; note?: string; moyenne?: string;
    mention?: string; appreciation?: string; anneeScolaire?: string;
  };

  if (!periode?.trim()) return NextResponse.json({ error: 'La période est obligatoire.' }, { status: 400 });

  const resultat = await prisma.dossierEleveResultat.create({
    data: {
      eleveId: params.id,
      periode: periode.trim(),
      matiere: matiere || '',
      note: note || '',
      moyenne: moyenne || '',
      mention: mention || '',
      appreciation: appreciation || '',
      anneeScolaire: anneeScolaire || new Date().getFullYear().toString(),
    },
  });

  return NextResponse.json(resultat, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resId = searchParams.get('resId');
  if (!resId) return NextResponse.json({ error: 'ID résultat manquant.' }, { status: 400 });

  await prisma.dossierEleveResultat.delete({ where: { id: resId, eleveId: params.id } });
  return NextResponse.json({ ok: true });
}
