import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { getCycleForClass, getMatieresForCycle } from '@/lib/presence-flow';

/**
 * GET /api/enseignant/matieres?classe=...
 *
 * Retourne les matières attribuées à l'enseignant pour une classe donnée.
 *
 * Flux de recherche :
 * 1. Cours où le champ `enseignant` correspond au nom de l'enseignant connecté
 *    → titres uniques.
 * 2. Enseignant (par email ou nom) → spécialité → filtrer MATIERES_RDC.
 * 3. Repli : toutes les matières du cycle de la classe.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classe = searchParams.get('classe');
  if (!classe) {
    return NextResponse.json({ error: 'La classe est obligatoire.' }, { status: 400 });
  }

  // 1. Chercher les cours attribués à l'enseignant pour cette classe
  const cours = await prisma.cours.findMany({
    where: {
      classe,
      OR: [{ enseignant: { contains: user.nom } }],
    },
    select: { titre: true },
    distinct: ['titre'],
  });

  if (cours.length > 0) {
    return NextResponse.json({ matieres: cours.map((c) => c.titre) });
  }

  // 2. Chercher l'enseignant par email → utiliser sa spécialité
  const enseignant = await prisma.enseignant.findFirst({
    where: {
      OR: [{ email: user.email }, { nom: { contains: user.nom } }],
    },
  });

  const cycle = getCycleForClass(classe);
  if (!cycle) {
    return NextResponse.json({ matieres: [] });
  }

  if (enseignant?.specialite) {
    const matieresDuCycle = getMatieresForCycle(cycle);
    const filtrees = matieresDuCycle.filter(
      (m) =>
        m.toLowerCase().includes(enseignant.specialite.toLowerCase()) ||
        enseignant.specialite.toLowerCase().includes(m.toLowerCase()),
    );
    if (filtrees.length > 0) {
      return NextResponse.json({ matieres: filtrees });
    }
  }

  // 3. Repli : toutes les matières du cycle
  const matieres = getMatieresForCycle(cycle);
  return NextResponse.json({ matieres });
}
