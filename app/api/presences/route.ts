import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { sendAbsenceNotification } from '@/lib/mail';

const createSchema = z.object({
  eleveId: z.string().trim().min(1, 'L\u2019\u00e9l\u00e8ve est obligatoire.'),
  date: z.string().trim().min(1, 'La date est obligatoire.'),
  present: z.boolean(),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
});

/** GET /api/presences — liste des présences (filtrable par classe, date, élève). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classe = searchParams.get('classe') || undefined;
  const eleveId = searchParams.get('eleveId') || undefined;
  const date = searchParams.get('date') || undefined;

  const where: Record<string, unknown> = {};
  if (classe) where.classe = classe;
  if (eleveId) where.eleveId = eleveId;
  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    where.date = { gte: dayStart, lte: dayEnd };
  }

  const presences = await prisma.presence.findMany({
    where,
    include: { eleve: { select: { id: true, matricule: true, nom: true, postNom: true, prenom: true } } },
    orderBy: [{ date: 'desc' }, { eleve: { nom: 'asc' } }],
  });

  return NextResponse.json({ presences });
}

/** POST /api/presences — enregistrer une présence. */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const eleve = await prisma.eleve.findUnique({
    where: { id: data.eleveId },
    include: { etablissement: { select: { nom: true } } },
  });
  if (!eleve) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  const presence = await prisma.presence.create({
    data: {
      eleveId: data.eleveId,
      date: new Date(data.date),
      present: data.present,
      classe: data.classe,
    },
    include: { eleve: { select: { id: true, matricule: true, nom: true, postNom: true, prenom: true } } },
  });

  // Envoyer un email au parent si l'élève est marqué absent
  if (!data.present && eleve.email) {
    const dateStr = new Date(data.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    sendAbsenceNotification({
      parentEmail: eleve.email,
      parentNom: eleve.nomTuteur,
      eleveNom: `${eleve.nom} ${eleve.postNom} ${eleve.prenom}`.trim(),
      classe: data.classe,
      etablissementNom: eleve.etablissement?.nom || 'Établissement',
      dateAbsence: dateStr,
    }).catch(() => {});
  }

  return NextResponse.json({ presence }, { status: 201 });
}
