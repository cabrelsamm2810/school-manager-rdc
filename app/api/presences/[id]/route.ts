import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { sendAbsenceNotification, sendPresenceNotification } from '@/lib/mail';

const updateSchema = z.object({
  date: z.string().trim().min(1, 'La date est obligatoire.'),
  present: z.boolean(),
  classe: z.string().trim().min(1, 'La classe est obligatoire.'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

/** PUT /api/presences/[id] — modifier une présence. */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existing = await prisma.presence.findUnique({
    where: { id: params.id },
    include: { eleve: { select: { id: true, matricule: true, nom: true, postNom: true, prenom: true, emailTuteur: true, nomTuteur: true, etablissement: { select: { nom: true } } } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Présence introuvable.' }, { status: 404 });
  }

  const presence = await prisma.presence.update({
    where: { id: params.id },
    data: {
      date: new Date(data.date),
      present: data.present,
      classe: data.classe,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
    include: { eleve: { select: { id: true, matricule: true, nom: true, postNom: true, prenom: true } } },
  });

  const dateStr = new Date(data.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Envoyer un email au parent selon le changement de statut
  if (existing.eleve?.emailTuteur) {
    if (!data.present && existing.present) {
      // Passage de présent à absent
      sendAbsenceNotification({
        parentEmail: existing.eleve.emailTuteur,
        parentNom: existing.eleve.nomTuteur,
        eleveNom: `${existing.eleve.nom} ${existing.eleve.postNom} ${existing.eleve.prenom}`.trim(),
        classe: data.classe,
        etablissementNom: existing.eleve.etablissement?.nom || 'Établissement',
        dateAbsence: dateStr,
      }).catch(() => {});
    } else if (data.present && !existing.present) {
      // Passage d'absent à présent
      sendPresenceNotification({
        parentEmail: existing.eleve.emailTuteur,
        parentNom: existing.eleve.nomTuteur,
        eleveNom: `${existing.eleve.nom} ${existing.eleve.postNom} ${existing.eleve.prenom}`.trim(),
        classe: data.classe,
        etablissementNom: existing.eleve.etablissement?.nom || 'Établissement',
        datePresence: dateStr,
        heurePresence: new Date(data.date).toLocaleTimeString('fr-FR'),
        localisation: data.latitude != null && data.longitude != null ? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}` : undefined,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ presence });
}

/** DELETE /api/presences/[id] — supprimer une présence. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.presence.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Présence introuvable.' }, { status: 404 });
  }

  await prisma.presence.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
