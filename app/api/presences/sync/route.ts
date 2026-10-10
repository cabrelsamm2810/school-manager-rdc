import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';

/**
 * POST /api/presences/sync — synchroniser les présences enregistrées hors connexion.
 * Body: { seanceId, presences: [{ eleveId, statut, heureArrivee, date }] }
 * Évite les doublons: ne crée pas une présence qui existe déjà pour la même séance/élève.
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
  const seanceId = body?.seanceId;
  const items = body?.presences;

  if (!seanceId || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  }

  // Vérifier la séance
  const seance = await prisma.seancePresence.findUnique({ where: { id: seanceId } });
  if (!seance || seance.enseignantId !== user.id) {
    return NextResponse.json({ error: 'Séance non autorisée.' }, { status: 403 });
  }

  const scopeWhere = buildEleveScopeWhere(user);
  const results: Array<{ eleveId: string; status: string }> = [];

  for (const item of items) {
    // Vérifier le périmètre
    const eleve = await prisma.eleve.findFirst({
      where: { ...scopeWhere, id: item.eleveId, classe: seance.classe },
    });
    if (!eleve) {
      results.push({ eleveId: item.eleveId, status: 'rejected' });
      continue;
    }

    // Vérifier doublon
    const existing = await prisma.presence.findFirst({
      where: { eleveId: item.eleveId, seanceId },
    });
    if (existing) {
      results.push({ eleveId: item.eleveId, status: 'duplicate' });
      continue;
    }

    const statut = item.statut || 'PRESENT';
    await prisma.presence.create({
      data: {
        eleveId: item.eleveId,
        date: new Date(item.date || new Date()),
        present: statut !== 'ABSENT',
        statut,
        classe: seance.classe,
        matiere: seance.matiere,
        anneeScolaire: seance.anneeScolaire,
        enseignantId: user.id,
        ecoleId: seance.ecoleId || eleve.ecoleId || null,
        seanceId,
        heureArrivee: item.heureArrivee ? new Date(item.heureArrivee) : null,
      },
    });
    results.push({ eleveId: item.eleveId, status: 'synced' });
  }

  return NextResponse.json({ results });
}
