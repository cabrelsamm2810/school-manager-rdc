import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';
import { findEleveByScanValue, getEleveSituation } from '@/lib/frais-scolaires';

/**
 * POST /api/finances/scan
 * Identifie un élève par le QR code de sa carte scolaire (identifiant signé
 * uniquement — aucune donnée financière dans le QR) ou par saisie manuelle,
 * puis renvoie sa situation financière complète.
 *
 * Body: { scannedValue }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!canFinance(user, FINANCE_PERM.VIEW)) {
    return NextResponse.json({ error: 'Permission financière insuffisante.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scannedValue = typeof body?.scannedValue === 'string' ? body.scannedValue.trim() : '';
  if (!scannedValue) {
    return NextResponse.json({ error: 'Valeur scannée vide.' }, { status: 400 });
  }

  const { eleve, error } = await findEleveByScanValue(scannedValue);
  if (!eleve) {
    return NextResponse.json({ error: error ?? 'Élève introuvable.' }, { status: 404 });
  }

  const scoped = await prisma.eleve.findFirst({
    where: { ...buildEleveScopeWhere(user), id: eleve.id },
    select: { id: true },
  });
  if (!scoped) {
    return NextResponse.json(
      { error: "Cet élève n'appartient pas à votre établissement." },
      { status: 403 },
    );
  }

  const situation = await getEleveSituation(eleve.id, body?.anneeScolaire);
  if (!situation) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ situation });
}
