import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { sendPresenceNotification } from '@/lib/mail';

/**
 * POST /api/presences/scan
 * Marque un élève comme présent via le scan de son QR code (carte scolaire).
 * Le QR code encode le matricule de l'élève.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scannedValue = body?.scannedValue?.trim();
  const latitude = typeof body?.latitude === 'number' ? body.latitude : null;
  const longitude = typeof body?.longitude === 'number' ? body.longitude : null;

  if (!scannedValue) {
    return NextResponse.json({ error: 'Valeur scannée vide.' }, { status: 400 });
  }

  // Le QR code peut encoder soit le matricule directement, soit une URL contenant l'ID
  let eleve = null;

  // Tentative 1: chercher par matricule direct
  eleve = await prisma.eleve.findUnique({
    where: { matricule: scannedValue },
    include: { etablissement: { select: { nom: true } } },
  });

  // Tentative 2: extraire l'ID depuis une URL (ex: /api/eleves/verify?matricule=XXX)
  if (!eleve) {
    try {
      const url = new URL(scannedValue);
      const matricule = url.searchParams.get('matricule') || url.searchParams.get('id');
      if (matricule) {
        eleve = await prisma.eleve.findUnique({
          where: { matricule },
          include: { etablissement: { select: { nom: true } } },
        });
      }
    } catch {
      // Pas une URL valide — ignore
    }
  }

  // Tentative 3: chercher par ID
  if (!eleve) {
    eleve = await prisma.eleve.findUnique({
      where: { id: scannedValue },
      include: { etablissement: { select: { nom: true } } },
    });
  }

  if (!eleve) {
    return NextResponse.json(
      { error: `Aucun élève trouvé pour la valeur scannée: ${scannedValue}` },
      { status: 404 },
    );
  }

  // Vérifier si une présence existe déjà pour aujourd'hui
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.presence.findFirst({
    where: {
      eleveId: eleve.id,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  if (existing) {
    // Si déjà présent, on retourne l'info sans dupliquer
    if (existing.present) {
      return NextResponse.json({
        alreadyPresent: true,
        eleve: {
          id: eleve.id,
          matricule: eleve.matricule,
          nom: eleve.nom,
          postNom: eleve.postNom,
          prenom: eleve.prenom,
          classe: eleve.classe,
        },
        presence: existing,
      });
    }
    // Si marqué absent, on le met à présent
    const updated = await prisma.presence.update({
      where: { id: existing.id },
      data: { present: true, date: new Date(), latitude, longitude },
    });

    // Envoyer un email de présence au parent
    if (eleve.emailTuteur) {
      const now = new Date();
      sendPresenceNotification({
        parentEmail: eleve.emailTuteur,
        parentNom: eleve.nomTuteur,
        eleveNom: `${eleve.nom} ${eleve.postNom} ${eleve.prenom}`.trim(),
        classe: eleve.classe,
        etablissementNom: eleve.etablissement?.nom || 'Établissement',
        datePresence: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        heurePresence: now.toLocaleTimeString('fr-FR'),
        localisation: latitude != null && longitude != null ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : undefined,
      }).catch(() => {});
    }

    return NextResponse.json({
      updated: true,
      eleve: {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        postNom: eleve.postNom,
        prenom: eleve.prenom,
        classe: eleve.classe,
      },
      presence: updated,
    });
  }

  // Créer la présence
  const presence = await prisma.presence.create({
    data: {
      eleveId: eleve.id,
      date: new Date(),
      present: true,
      classe: eleve.classe,
      latitude,
      longitude,
    },
  });

  // Envoyer un email de présence au parent
  if (eleve.emailTuteur) {
    const now = new Date();
    sendPresenceNotification({
      parentEmail: eleve.emailTuteur,
      parentNom: eleve.nomTuteur,
      eleveNom: `${eleve.nom} ${eleve.postNom} ${eleve.prenom}`.trim(),
      classe: eleve.classe,
      etablissementNom: eleve.etablissement?.nom || 'Établissement',
      datePresence: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      heurePresence: now.toLocaleTimeString('fr-FR'),
      localisation: latitude != null && longitude != null ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : undefined,
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
      etablissement: eleve.etablissement?.nom || null,
    },
    presence,
  }, { status: 201 });
}
