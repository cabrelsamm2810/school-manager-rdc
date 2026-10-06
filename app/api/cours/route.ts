import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const createSchema = z.object({
  titre: z.string().trim().min(1, 'Le titre est obligatoire.'),
  type: z.enum(['cours', 'activite']).optional().or(z.literal('')),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
  eleveId: z.string().trim().optional().or(z.literal('')),
  date: z.string().min(1, 'La date est obligatoire.'),
  heureDebut: z.string().trim().optional().or(z.literal('')),
  heureFin: z.string().trim().optional().or(z.literal('')),
  salle: z.string().trim().optional().or(z.literal('')),
  enseignant: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
  couleur: z.string().trim().optional().or(z.literal(''))
});

/** GET /api/cours — liste des cours (filtrable par mois, classe, élève). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mois = searchParams.get('mois'); // format: YYYY-MM
  const classe = searchParams.get('classe') || undefined;
  const eleveId = searchParams.get('eleveId') || undefined;

  const where: Record<string, unknown> = {};
  if (classe) where.classe = classe;
  if (eleveId) where.eleveId = eleveId;
  if (mois) {
    const start = new Date(`${mois}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.date = { gte: start, lt: end };
  }

  const cours = await prisma.cours.findMany({
    where,
    include: { eleve: { select: { id: true, nom: true, prenom: true } } },
    orderBy: { date: 'asc' }
  });

  return NextResponse.json({ cours });
}

/** POST /api/cours — créer un cours ou une activité. */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
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
  const cours = await prisma.cours.create({
    data: {
      titre: data.titre,
      type: data.type || 'cours',
      classe: data.classe,
      eleveId: data.eleveId || null,
      date: new Date(data.date),
      heureDebut: data.heureDebut ?? '',
      heureFin: data.heureFin ?? '',
      salle: data.salle ?? '',
      enseignant: data.enseignant ?? '',
      description: data.description ?? '',
      couleur: data.couleur ?? ''
    }
  });

  return NextResponse.json({ cours }, { status: 201 });
}
