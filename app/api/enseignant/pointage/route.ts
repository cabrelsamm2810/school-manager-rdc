import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

/** Retourne la date locale au format YYYY-MM-DD. */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Détermine PRESENT ou RETARD selon l'heure (retard après 08:00 locale). */
function computeStatut(): string {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const minutes = h * 60 + m;
  return minutes > 8 * 60 ? 'RETARD' : 'PRESENT';
}

/**
 * GET /api/enseignant/pointage
 * Renvoie le pointage du jour + l'historique des 7 derniers jours.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const today = todayStr();

  // Pointage du jour
  const todayRecord = await prisma.pointageEnseignant.findUnique({
    where: { enseignantId_jour: { enseignantId: user.id, jour: today } },
  });

  // Historique 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const history = await prisma.pointageEnseignant.findMany({
    where: {
      enseignantId: user.id,
      jour: { gte: sevenDaysAgo.toISOString().split('T')[0] },
    },
    orderBy: { jour: 'desc' },
    take: 7,
  });

  return NextResponse.json({
    today: todayRecord,
    history,
  });
}

/**
 * POST /api/enseignant/pointage
 * Body: { scannedValue, latitude?, longitude? }
 * Le QR code doit encoder « POINTAGE:<ecoleId> » où ecoleId correspond à l'école du professeur.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'ENSEIGNANT') {
    return NextResponse.json({ error: 'Réservé à l\'enseignant.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scannedValue = body?.scannedValue?.trim() ?? '';
  const latitude = typeof body?.latitude === 'number' ? body.latitude : null;
  const longitude = typeof body?.longitude === 'number' ? body.longitude : null;

  if (!scannedValue) {
    return NextResponse.json({ error: 'Valeur scannée vide.' }, { status: 400 });
  }

  // ── Vérifier que le QR correspond à l'école du professeur ──
  // Format attendu : « POINTAGE:<ecoleId> »
  const prefix = 'POINTAGE:';
  if (!scannedValue.startsWith(prefix)) {
    return NextResponse.json(
      { error: 'Ce QR code n\'est pas un QR de pointage valide.' },
      { status: 400 },
    );
  }

  const scannedEcoleId = scannedValue.slice(prefix.length);
  if (!scannedEcoleId) {
    return NextResponse.json({ error: 'QR code invalide.' }, { status: 400 });
  }

  if (user.ecoleId && scannedEcoleId !== user.ecoleId) {
    return NextResponse.json(
      { error: 'Ce QR code ne correspond pas à votre école.' },
      { status: 403 },
    );
  }

  // ── Vérifier qu'un pointage n'existe pas déjà pour aujourd'hui ──
  const today = todayStr();
  const existing = await prisma.pointageEnseignant.findUnique({
    where: { enseignantId_jour: { enseignantId: user.id, jour: today } },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà pointé votre arrivée aujourd\'hui.', pointage: existing },
      { status: 409 },
    );
  }

  // ── Créer le pointage ──
  const statut = computeStatut();
  const pointage = await prisma.pointageEnseignant.create({
    data: {
      enseignantId: user.id,
      ecoleId: user.ecoleId ?? scannedEcoleId,
      jour: today,
      heureArrivee: new Date(),
      statut,
      latitude,
      longitude,
      scannedValue,
    },
  });

  return NextResponse.json({ pointage, statut });
}
