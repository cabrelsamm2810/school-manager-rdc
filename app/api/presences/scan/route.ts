import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { buildEleveScopeWhere } from '@/lib/territory-filter';
import { sendPresenceNotification } from '@/lib/mail';

/**
 * POST /api/presences/scan
 * Marque un élève comme présent via le scan de son QR code (carte scolaire).
 * Le QR code encode le matricule de l'élève (identifiant unique sécurisé —
 * aucune donnée personnelle complète n'est stockée dans le QR).
 *
 * Body: { scannedValue, seanceId?, matiere?, classe?, anneeScolaire?, latitude?, longitude? }
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
  const scannedValue = body?.scannedValue?.trim();
  const seanceId = body?.seanceId || null;
  const matiere = body?.matiere || '';
  const anneeScolaire = body?.anneeScolaire || '';
  const latitude = typeof body?.latitude === 'number' ? body.latitude : null;
  const longitude = typeof body?.longitude === 'number' ? body.longitude : null;

  if (!scannedValue) {
    return NextResponse.json({ error: 'Valeur scannée vide.' }, { status: 400 });
  }

  // ── 1. Identifier l'élève à partir du QR code ──
  // Le QR encode le matricule (identifiant unique), pas les données personnelles.
  let eleve = null;

  // Tentative 1: chercher par matricule direct
  eleve = await prisma.eleve.findUnique({
    where: { matricule: scannedValue },
    include: { ecole: { select: { nom: true, id: true } } },
  });

  // Tentative 2: extraire le matricule depuis une URL
  if (!eleve) {
    try {
      const url = new URL(scannedValue);
      const matricule = url.searchParams.get('matricule') || url.searchParams.get('id');
      if (matricule) {
        eleve = await prisma.eleve.findUnique({
          where: { matricule },
          include: { ecole: { select: { nom: true, id: true } } },
        });
      }
    } catch {
      // Pas une URL valide
    }
  }

  // Tentative 3: chercher par ID
  if (!eleve) {
    eleve = await prisma.eleve.findUnique({
      where: { id: scannedValue },
      include: { ecole: { select: { nom: true, id: true } } },
    });
  }

  if (!eleve) {
    return NextResponse.json(
      { error: `Aucun élève trouvé pour la valeur scannée.` },
      { status: 404 },
    );
  }

  // ── 2. Vérification automatique: périmètre de l'enseignant ──
  // L'élève doit appartenir à une classe/école que l'enseignant peut gérer.
  const scopeWhere = buildEleveScopeWhere(user);
  const scopedEleve = await prisma.eleve.findFirst({
    where: { ...scopeWhere, id: eleve.id },
  });

  if (!scopedEleve) {
    return NextResponse.json(
      {
        error: `Cet élève n'appartient pas à votre classe ou établissement.`,
        eleve: {
          id: eleve.id,
          nom: eleve.nom,
          postNom: eleve.postNom,
          prenom: eleve.prenom,
          classe: eleve.classe,
        },
      },
      { status: 403 },
    );
  }

  // ── 3. Vérification de la séance si fournie ──
  let seance = null;
  if (seanceId) {
    seance = await prisma.seancePresence.findUnique({ where: { id: seanceId } });
    if (!seance) {
      return NextResponse.json({ error: 'Séance introuvable.' }, { status: 404 });
    }
    if (seance.enseignantId !== user.id) {
      return NextResponse.json({ error: 'Séance non autorisée.' }, { status: 403 });
    }
    // Vérifier que l'élève appartient à la classe de la séance
    if (eleve.classe !== seance.classe) {
      return NextResponse.json(
        {
          error: `L'élève appartient à la classe ${eleve.classe}, pas à ${seance.classe}.`,
          eleve: {
            id: eleve.id,
            nom: eleve.nom,
            postNom: eleve.postNom,
            prenom: eleve.prenom,
            classe: eleve.classe,
          },
        },
        { status: 403 },
      );
    }
  }

  // ── 4. Éviter les doubles scans ──
  // Si une séance est fournie, vérifier par séance; sinon par jour.
  let existing = null;
  if (seanceId) {
    existing = await prisma.presence.findFirst({
      where: { eleveId: eleve.id, seanceId },
    });
  } else {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    existing = await prisma.presence.findFirst({
      where: {
        eleveId: eleve.id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });
  }

  if (existing) {
    return NextResponse.json({
      alreadyPresent: true,
      eleve: {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        postNom: eleve.postNom,
        prenom: eleve.prenom,
        classe: eleve.classe,
        ecole: eleve.ecole?.nom || null,
      },
      presence: existing,
    });
  }

  // ── 5. Enregistrer la présence (statut PRESENT par défaut) ──
  const now = new Date();
  const presence = await prisma.presence.create({
    data: {
      eleveId: eleve.id,
      date: now,
      present: true,
      statut: 'PRESENT',
      classe: eleve.classe,
      matiere: seance?.matiere || matiere,
      anneeScolaire: seance?.anneeScolaire || anneeScolaire,
      enseignantId: user.id,
      ecoleId: eleve.ecoleId || user.ecoleId || null,
      seanceId: seanceId,
      heureArrivee: now,
      latitude,
      longitude,
    },
  });

  // ── 6. Notification email au parent ──
  if (eleve.emailTuteur) {
    const dateStr = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    sendPresenceNotification({
      parentEmail: eleve.emailTuteur,
      parentNom: eleve.nomTuteur,
      eleveNom: `${eleve.nom} ${eleve.postNom} ${eleve.prenom}`.trim(),
      classe: eleve.classe,
      ecoleNom: eleve.ecole?.nom || 'École',
      datePresence: dateStr,
      heurePresence: now.toLocaleTimeString('fr-FR'),
      localisation: latitude != null && longitude != null
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : undefined,
    }).catch(() => {});
  }

  return NextResponse.json({
    created: true,
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      postNom: eleve.postNom,
      prenom: eleve.prenom,
      classe: eleve.classe,
      ecole: eleve.ecole?.nom || null,
    },
    presence,
  }, { status: 201 });
}
