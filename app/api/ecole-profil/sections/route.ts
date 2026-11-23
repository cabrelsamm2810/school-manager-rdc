import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { ECOLE_SECTION_TYPES } from '@/lib/ecole-profil';
import {
  canEditEcoleProfil,
  loadEcoleAutorisee,
  logEcoleProfil,
  type ProfilUtilisateur,
} from '@/lib/ecole-profil-service';

const createSchema = z.object({
  type: z.enum(ECOLE_SECTION_TYPES),
  nom: z.string().trim().min(1, 'Le nom est obligatoire.'),
  cycle: z.string().trim().optional(),
  ordre: z.number().int().min(0).optional(),
  statut: z.string().trim().optional(),
});

/** GET /api/ecole-profil/sections — sections et options de l'école. */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const ecoleId = new URL(request.url).searchParams.get('ecoleId');
  const cible = await loadEcoleAutorisee(user, ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });

  const sections = await prisma.ecoleSection.findMany({
    where: { ecoleId: cible.ecole.id },
    orderBy: [{ type: 'asc' }, { ordre: 'asc' }, { nom: 'asc' }],
  });
  return NextResponse.json({ sections });
}

/** POST /api/ecole-profil/sections — ajout d'une section ou d'une option. */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const user = auth.user as unknown as ProfilUtilisateur;
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const cible = await loadEcoleAutorisee(user, (body as { ecoleId?: string } | null)?.ecoleId);
  if (!cible.ok) return NextResponse.json({ error: cible.error }, { status: cible.status });
  if (!canEditEcoleProfil(user, cible.ecole)) {
    return NextResponse.json({ error: 'Votre compte n’est pas autorisé à modifier cette fiche.' }, { status: 403 });
  }

  const data = parsed.data;
  const exists = await prisma.ecoleSection.findFirst({
    where: { ecoleId: cible.ecole.id, type: data.type, nom: data.nom, cycle: data.cycle ?? '' },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ error: 'Cette entrée existe déjà pour cette école.' }, { status: 409 });
  }

  const section = await prisma.ecoleSection.create({
    data: {
      ecoleId: cible.ecole.id,
      type: data.type,
      nom: data.nom,
      cycle: data.cycle ?? '',
      ordre: data.ordre ?? 0,
      statut: data.statut || 'Actif',
    },
  });

  await logEcoleProfil(cible.ecole.id, user, {
    action: 'SECTION_AJOUT',
    champ: data.type,
    nouvelleValeur: [data.nom, data.cycle].filter(Boolean).join(' — '),
  });

  return NextResponse.json({ section }, { status: 201 });
}
