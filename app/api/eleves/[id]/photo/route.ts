import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { uploadFile, resolveFileUrl, deleteFile } from '@/lib/storage';
import { validatePhotoFile } from '@/lib/file-validation';

/**
 * Photo de profil de l'élève.
 *
 * POST   — téléverse (ou remplace) la photo et l'enregistre dans `Eleve.photoUrl`.
 * DELETE — supprime la photo et l'efface de la fiche.
 *
 * La photo est publique (comme les photos de profil utilisateurs) : elle est
 * affichée dans la liste d'appel et sur la fiche scannée, sans URL signée.
 */

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'COMPTABLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const eleve = await prisma.eleve.findUnique({
    where: { id: params.id },
    select: { id: true, photoUrl: true },
  });
  if (!eleve) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const file = formData.get('photo');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });

  const validationError = validatePhotoFile(file);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const ext = file.type.split('/')[1] || 'jpg';
  const bytes = Buffer.from(await file.arrayBuffer());
  // Stockage privé : le bucket R2 n'est pas nécessairement public, l'URL est
  // résolue en lien signé à chaque lecture (même schéma que les documents).
  const { storedUrl } = await uploadFile(
    'eleves',
    `${params.id}-${Date.now()}.${ext}`,
    bytes,
    file.type,
    false,
  );

  if (eleve.photoUrl) {
    await deleteFile(eleve.photoUrl);
  }

  const updated = await prisma.eleve.update({
    where: { id: params.id },
    data: { photoUrl: storedUrl },
    select: { id: true, photoUrl: true },
  });

  return NextResponse.json({ ok: true, photoUrl: await resolveFileUrl(updated.photoUrl, { signed: true }) });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'COMPTABLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const eleve = await prisma.eleve.findUnique({
    where: { id: params.id },
    select: { id: true, photoUrl: true },
  });
  if (!eleve) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  if (eleve.photoUrl) {
    await deleteFile(eleve.photoUrl);
  }

  await prisma.eleve.update({
    where: { id: params.id },
    data: { photoUrl: '' },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
