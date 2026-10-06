import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const updateSchema = z.object({
  matricule: z.string().trim().min(1, 'Le matricule est obligatoire.'),
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  sexe: z.enum(['M', 'F']).optional().or(z.literal('')),
  dateNaissance: z.string().optional().or(z.literal('')),
  lieuNaissance: z.string().trim().optional().or(z.literal('')),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('L\u2019email est invalide.').optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  nomTuteur: z.string().trim().optional().or(z.literal('')),
  telephoneTuteur: z.string().trim().optional().or(z.literal('')),
  emailTuteur: z.string().trim().email('L\u2019email du parent est invalide.').optional().or(z.literal('')),
  etablissementId: z.string().trim().optional().or(z.literal(''))
});

/** PUT /api/eleves/[id] — modifier un élève. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.eleve.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  // Vérifier conflit de matricule
  if (data.matricule !== existing.matricule) {
    const conflict = await prisma.eleve.findUnique({ where: { matricule: data.matricule } });
    if (conflict) {
      return NextResponse.json({ error: 'Un élève avec ce matricule existe déjà.' }, { status: 409 });
    }
  }

  const eleve = await prisma.eleve.update({
    where: { id: params.id },
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
      emailTuteur: data.emailTuteur ?? '',
      etablissement: data.etablissementId
        ? { connect: { id: data.etablissementId } }
        : { disconnect: true }
    }
  });

  return NextResponse.json({ eleve });
}

/** DELETE /api/eleves/[id] — supprimer un élève. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.eleve.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  await prisma.eleve.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
