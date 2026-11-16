import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';
import { displayUserName, enregistrerPaiementFrais } from '@/lib/frais-scolaires';
import { getClientIP, logAudit } from '@/lib/audit';

/**
 * POST /api/finances/paiements/sync
 * Synchronise les paiements saisis hors connexion.
 *
 * Chaque paiement porte une `idempotencyKey` générée sur l'appareil : un envoi
 * répété (réseau instable, double clic sur « Synchroniser ») renvoie le reçu
 * déjà créé au lieu d'enregistrer un doublon.
 *
 * Body: { paiements: Array<{ idempotencyKey, eleveId, categorieId, montant,
 *         modePaiement, referenceTransaction, anneeScolaire, dateOperation }> }
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
  const paiements: any[] = Array.isArray(body?.paiements) ? body.paiements : [];
  if (paiements.length === 0) {
    return NextResponse.json({ resultats: [] });
  }

  const scope = buildEleveScopeWhere(user);
  const resultats: Array<Record<string, unknown>> = [];

  for (const item of paiements.slice(0, 200)) {
    const idempotencyKey = typeof item?.idempotencyKey === 'string' ? item.idempotencyKey : null;
    const eleveId = typeof item?.eleveId === 'string' ? item.eleveId : '';

    if (!idempotencyKey || !eleveId) {
      resultats.push({ idempotencyKey, ok: false, error: 'Paiement hors ligne incomplet.' });
      continue;
    }

    const scoped = await prisma.eleve.findFirst({
      where: { ...scope, id: eleveId },
      select: { id: true },
    });
    if (!scoped) {
      resultats.push({ idempotencyKey, ok: false, error: 'Élève introuvable.' });
      continue;
    }

    const result = await enregistrerPaiementFrais({
      eleveId,
      categorieId: typeof item.categorieId === 'string' ? item.categorieId : null,
      montant: item.montant,
      modePaiement: item.modePaiement,
      referenceTransaction: item.referenceTransaction,
      anneeScolaire: item.anneeScolaire,
      dateOperation: item.dateOperation,
      idempotencyKey,
      enregistreParId: user.id,
      enregistreParNom: displayUserName(user),
    });

    if (!result.ok) {
      resultats.push({ idempotencyKey, ok: false, error: result.error });
      continue;
    }

    if (!result.duplicate) {
      await logAudit({
        userId: user.id,
        userRole: user.role,
        userName: displayUserName(user),
        action: 'PAIEMENT_FRAIS_HORS_LIGNE',
        module: 'finances',
        resource: 'eleve',
        resourceId: eleveId,
        result: 'success',
        details: `${result.paiement.categorieNom} — ${result.paiement.montant} FC — reçu ${result.paiement.recuNumero}`,
        ipAddress: getClientIP(request),
      });
    }

    resultats.push({
      idempotencyKey,
      ok: true,
      duplicate: result.duplicate,
      paiement: result.paiement,
    });
  }

  return NextResponse.json({ resultats });
}
