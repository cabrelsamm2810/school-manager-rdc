import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getCurrentPeriode, getRappelStatut } from '@/lib/rappels-cotes';
import { getCurrentAnneeScolaire } from '@/lib/cahier-de-cote';
import { sendRappelCote } from '@/lib/mail';

/** GET — statut des rappels: période courante, enseignants à jour / en retard. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const periode = searchParams.get('periode') || getCurrentPeriode();
  const anneeScolaire = searchParams.get('anneeScolaire') || getCurrentAnneeScolaire();

  const statut = await getRappelStatut(periode, anneeScolaire);

  // Historique des rappels envoyés pour cette période
  const historique = await prisma.rappelCote.findMany({
    where: { periode, anneeScolaire },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ ...statut, historique });
}

/** POST — envoyer des rappels par email aux enseignants en retard. */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const periode = body.periode || getCurrentPeriode();
  const anneeScolaire = body.anneeScolaire || getCurrentAnneeScolaire();

  const statut = await getRappelStatut(periode, anneeScolaire);

  if (statut.retardataires.length === 0) {
    return NextResponse.json({ message: 'Tous les enseignants sont à jour.', envoyes: 0 });
  }

  const declenchePar = `${auth.user.prenom} ${auth.user.nom}`.trim();
  const declencheParId = auth.user.id;

  const resultats: { nom: string; email: string; statut: string; erreur: string }[] = [];

  for (const enseignant of statut.retardataires) {
    if (!enseignant.email) {
      // Pas d'email — on enregistre quand même l'échec
      await prisma.rappelCote.create({
        data: {
          enseignantNom: enseignant.nom,
          enseignantEmail: '',
          ecole: enseignant.ecole,
          periode,
          anneeScolaire,
          statut: 'échec',
          messageErreur: 'Aucune adresse email renseignée',
          declenchePar,
          declencheParId,
        },
      });
      resultats.push({ nom: enseignant.nom, email: '', statut: 'échec', erreur: 'Pas d\'email' });
      continue;
    }

    try {
      await sendRappelCote(enseignant.email, enseignant.nom, periode, anneeScolaire);
      await prisma.rappelCote.create({
        data: {
          enseignantNom: enseignant.nom,
          enseignantEmail: enseignant.email,
          ecole: enseignant.ecole,
          periode,
          anneeScolaire,
          statut: 'envoyé',
          declenchePar,
          declencheParId,
        },
      });
      resultats.push({ nom: enseignant.nom, email: enseignant.email, statut: 'envoyé', erreur: '' });
    } catch (error) {
      const messageErreur = error instanceof Error ? error.message : 'Erreur inconnue';
      await prisma.rappelCote.create({
        data: {
          enseignantNom: enseignant.nom,
          enseignantEmail: enseignant.email,
          ecole: enseignant.ecole,
          periode,
          anneeScolaire,
          statut: 'échec',
          messageErreur,
          declenchePar,
          declencheParId,
        },
      });
      resultats.push({ nom: enseignant.nom, email: enseignant.email, statut: 'échec', erreur: messageErreur });
    }
  }

  return NextResponse.json({
    message: `${resultats.filter((r) => r.statut === 'envoyé').length} rappel(s) envoyé(s)`,
    envoyes: resultats.filter((r) => r.statut === 'envoyé').length,
    echecs: resultats.filter((r) => r.statut === 'échec').length,
    resultats,
  }, { status: 201 });
}
