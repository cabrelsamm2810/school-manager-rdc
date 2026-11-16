import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/finances/recus/[numero]
 * Vérification publique de l'authenticité d'un reçu de frais scolaire.
 * Route volontairement accessible sans session (le QR du reçu est scanné par
 * un tiers) : elle ne renvoie que les mentions imprimées sur le reçu.
 */
export async function GET(_request: NextRequest, { params }: { params: { numero: string } }) {
  const numero = decodeURIComponent(params.numero ?? '').trim();
  if (!numero) {
    return NextResponse.json({ error: 'Numéro de reçu manquant.' }, { status: 400 });
  }

  const paiement = await prisma.paiementFrais.findUnique({
    where: { recuNumero: numero },
    include: {
      eleve: {
        select: {
          matricule: true,
          nom: true,
          postNom: true,
          prenom: true,
          classe: true,
          ecole: { select: { nom: true } },
        },
      },
    },
  });

  if (!paiement) {
    return NextResponse.json({ authentique: false, error: 'Reçu introuvable.' }, { status: 404 });
  }

  return NextResponse.json({
    authentique: paiement.statut === 'VALIDE',
    recu: {
      recuNumero: paiement.recuNumero,
      statut: paiement.statut,
      categorieNom: paiement.categorieNom,
      montant: paiement.montant,
      soldeApres: paiement.soldeApres,
      modePaiement: paiement.modePaiement,
      referenceTransaction: paiement.referenceTransaction,
      dateOperation: paiement.dateOperation.toISOString(),
      anneeScolaire: paiement.anneeScolaire,
      enregistreParNom: paiement.enregistreParNom,
      eleve: {
        matricule: paiement.eleve.matricule,
        nom: paiement.eleve.nom,
        postNom: paiement.eleve.postNom,
        prenom: paiement.eleve.prenom,
        classe: paiement.eleve.classe,
      },
      ecole: paiement.eleve.ecole?.nom ?? null,
    },
  });
}
