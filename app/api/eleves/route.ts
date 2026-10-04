import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const createSchema = z.object({
  matricule: z.string().trim().min(1, 'Le matricule est obligatoire.'),
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  sexe: z.enum(['M', 'F']).optional().or(z.literal('')),
  dateNaissance: z.string().optional().or(z.literal('')),
  lieuNaissance: z.string().trim().optional().or(z.literal('')),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('L’email est invalide.').optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  nomTuteur: z.string().trim().optional().or(z.literal('')),
  telephoneTuteur: z.string().trim().optional().or(z.literal('')),
  etablissementId: z.string().trim().optional().or(z.literal(''))
});

/** GET /api/eleves — liste des élèves (filtrable par classe et recherche). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classe = searchParams.get('classe') || undefined;
  const etablissementId = searchParams.get('etablissementId') || undefined;
  const search = searchParams.get('search') || undefined;

  const where: Record<string, unknown> = {};
  if (classe) where.classe = classe;
  if (etablissementId) where.etablissementId = etablissementId;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { postNom: { contains: search, mode: 'insensitive' } },
      { matricule: { contains: search, mode: 'insensitive' } }
    ];
  }

  const eleves = await prisma.eleve.findMany({
    where,
    include: { etablissement: { select: { id: true, nom: true } } },
    orderBy: [{ classe: 'asc' }, { nom: 'asc' }]
  });

  return NextResponse.json({ eleves });
}

/** POST /api/eleves — enregistrer un nouvel élève. */
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
  const existing = await prisma.eleve.findUnique({ where: { matricule: data.matricule } });
  if (existing) {
    return NextResponse.json({ error: 'Un élève avec ce matricule existe déjà.' }, { status: 409 });
  }

  const eleve = await prisma.eleve.create({
    data: {
      matricule: data.matricule,
      nom: data.nom,
      postNom: data.postNom ?? '',
      prenom: data.prenom,
      sexe: data.sexe ?? '',
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
      lieuNaissance: data.lieuNaissance ?? '',
      classe: data.classe,
      telephone: data.telephone ?? '',
      email: data.email ?? '',
      adresse: data.adresse ?? '',
      nomTuteur: data.nomTuteur ?? '',
      telephoneTuteur: data.telephoneTuteur ?? '',
      etablissement: data.etablissementId
        ? { connect: { id: data.etablissementId } }
        : undefined
    }
  });

  return NextResponse.json({ eleve }, { status: 201 });
}
