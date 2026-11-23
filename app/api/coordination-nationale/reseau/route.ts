import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalAccess } from '@/lib/national-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/coordination-nationale/reseau
 *
 * Réseau scolaire national EC-ERC : toutes les écoles, tous les élèves et tous
 * les enseignants du pays, sans filtrage territorial ni plafond de résultats.
 * Accès réservé au rôle exact COORDINATION_NATIONALE (vérifié côté serveur).
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const [ecoles, eleves, enseignants] = await Promise.all([
    prisma.ecole.findMany({
      orderBy: [{ province: 'asc' }, { nom: 'asc' }],
      select: {
        id: true, nom: true, type: true, institution: true, province: true,
        commune: true, statutValidation: true, effectif: true,
        _count: { select: { eleves: true, enseignants: true } },
      },
    }),
    prisma.eleve.findMany({
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      select: {
        id: true, matricule: true, nom: true, postNom: true, prenom: true,
        sexe: true, classe: true,
        ecole: { select: { nom: true, province: true } },
      },
    }),
    prisma.enseignant.findMany({
      orderBy: { nom: 'asc' },
      select: {
        id: true, nom: true, matricule: true, grade: true, specialite: true,
        statut: true, ecole: true,
        ecoleRattachee: { select: { nom: true, province: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      ecoles: ecoles.length,
      eleves: eleves.length,
      enseignants: enseignants.length,
    },
    ecoles,
    eleves,
    enseignants,
  });
}
