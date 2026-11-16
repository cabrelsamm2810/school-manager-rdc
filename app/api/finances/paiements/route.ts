import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';
import { displayUserName, enregistrerPaiementFrais } from '@/lib/frais-scolaires';
import { getClientIP, logAudit } from '@/lib/audit';

/**
 * POST /api/finances/paiements
 * Enregistre le paiement d'un frais scolaire pour un élève identifié et renvoie
 * le reçu numérique (numéro unique, solde restant, auteur de l'opération).
 *
 * Body: { eleveId, categorieId, montant, modePaiement, referenceTransaction,
 *         anneeScolaire?, dateOperation?, idempotencyKey? }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!canFinance(user, FINANCE_PERM.PAY)) {
    return NextResponse.json(
      { error: "Vous n'êtes pas autorisé à enregistrer un paiement." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const eleveId = typeof body?.eleveId === 'string' ? body.eleveId.trim() : '';
  if (!eleveId) {
    return NextResponse.json({ error: 'Élève non identifié.' }, { status: 400 });
  }

  const scoped = await prisma.eleve.findFirst({
    where: { ...buildEleveScopeWhere(user), id: eleveId },
    select: { id: true },
  });
  if (!scoped) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  try {
    const result = await enregistrerPaiementFrais({
      eleveId,
      categorieId: typeof body?.categorieId === 'string' ? body.categorieId : null,
      montant: body?.montant,
      modePaiement: body?.modePaiement,
      referenceTransaction: body?.referenceTransaction,
      anneeScolaire: body?.anneeScolaire,
      dateOperation: body?.dateOperation,
      idempotencyKey: body?.idempotencyKey,
      enregistreParId: user.id,
      enregistreParNom: displayUserName(user),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.duplicate) {
      await logAudit({
        userId: user.id,
        userRole: user.role,
        userName: displayUserName(user),
        action: 'PAIEMENT_FRAIS',
        module: 'finances',
        resource: 'eleve',
        resourceId: eleveId,
        result: 'success',
        details: `${result.paiement.categorieNom} — ${result.paiement.montant} FC — reçu ${result.paiement.recuNumero} (${result.paiement.modePaiement})`,
        ipAddress: getClientIP(request),
      });
    }

    return NextResponse.json(
      { paiement: result.paiement, duplicate: result.duplicate },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "L'enregistrement du paiement a échoué." },
      { status: 500 },
    );
  }
}
