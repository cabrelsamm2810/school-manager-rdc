import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getScopeLevel } from '@/lib/territory-filter';
import { uploadFile, deleteFile, resolveFileUrl } from '@/lib/storage';

const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Vérifie que l'utilisateur a le droit de modifier cette école :
 * même institution et périmètre territorial compatible.
 */
async function checkAccess(user: any, ecole: { institution: string; province: string; coordSousProvincialeId: string | null }, ecoleId: string) {
  if (user.role === 'SUPER_ADMIN') return null;
  if (user.typeInstitution && user.typeInstitution !== ecole.institution) {
    return 'Accès refusé : institution différente.';
  }
  const scope = getScopeLevel(user.role);
  if (scope === 'school' && user.ecoleId && user.ecoleId !== ecoleId) {
    return 'Accès refusé : école différent.';
  }
  if (scope === 'sousProvincial' && user.coordSousProvincialeId && ecole.coordSousProvincialeId !== user.coordSousProvincialeId) {
    return 'Accès refusé : sous-province différente.';
  }
  if (scope === 'provincial' && user.provinceAdministrative && ecole.province !== user.provinceAdministrative) {
    return 'Accès refusé : province différente.';
  }
  return null;
}

/** POST /api/ecoles/[id]/logo — téléverser le logo de l'établissement. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const ecole = await prisma.ecole.findUnique({
    where: { id: params.id },
    select: { id: true, institution: true, province: true, coordSousProvincialeId: true, logoUrl: true },
  });
  if (!ecole) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  const denied = await checkAccess(auth.user as any, ecole, params.id);
  if (denied) {
    return NextResponse.json({ error: denied }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const file = formData.get('logo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Le fichier dépasse 3 Mo.' }, { status: 400 });
  }

  const ext = file.type.split('/')[1] || 'jpg';
  const bytes = Buffer.from(await file.arrayBuffer());

  const { storedUrl } = await uploadFile(
    'ecole-logos',
    `${params.id}-${Date.now()}.${ext}`,
    bytes,
    file.type,
    true, // logo institutionnel public
  );

  // Remplacer l'ancien logo pour éviter les fichiers orphelins
  if (ecole.logoUrl) {
    await deleteFile(ecole.logoUrl).catch(() => {});
  }

  const updated = await prisma.ecole.update({
    where: { id: params.id },
    data: { logoUrl: storedUrl },
    select: { id: true, logoUrl: true },
  });

  return NextResponse.json({ ok: true, logoUrl: await resolveFileUrl(updated.logoUrl) });
}

/** DELETE /api/ecoles/[id]/logo — retirer le logo de l'établissement. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const ecole = await prisma.ecole.findUnique({
    where: { id: params.id },
    select: { id: true, institution: true, province: true, coordSousProvincialeId: true, logoUrl: true },
  });
  if (!ecole) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  const denied = await checkAccess(auth.user as any, ecole, params.id);
  if (denied) {
    return NextResponse.json({ error: denied }, { status: 403 });
  }

  if (ecole.logoUrl) {
    await deleteFile(ecole.logoUrl).catch(() => {});
  }

  await prisma.ecole.update({
    where: { id: params.id },
    data: { logoUrl: null },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
