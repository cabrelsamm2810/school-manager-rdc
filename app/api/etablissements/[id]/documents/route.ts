import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { deleteStoredFile, isUploadError, saveUploadedFile } from '@/lib/storage';

/**
 * GET /api/etablissements/[id]/documents
 * Liste les documents justificatifs d'un établissement.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const documents = await prisma.etablissementDocument.findMany({
    where: { etablissementId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ documents });
}

/**
 * POST /api/etablissements/[id]/documents
 * Téléverse un document justificatif (multipart/form-data).
 * Champs: file (File), type (string), titre (string)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.etablissement.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Données de formulaire invalides.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const type = (formData.get('type') as string)?.trim() || '';
  const titre = (formData.get('titre') as string)?.trim() || '';

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
  }
  if (!titre) {
    return NextResponse.json({ error: 'Le titre du document est obligatoire.' }, { status: 400 });
  }

  let saved;
  try {
    saved = await saveUploadedFile(file, {
      category: 'establishment-document',
      folder: `etablissements/${params.id}`,
    });
  } catch (error) {
    if (isUploadError(error)) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }

  const document = await prisma.etablissementDocument.create({
    data: {
      etablissementId: params.id,
      type,
      titre,
      fileUrl: saved.fileUrl,
      fileName: saved.fileName,
      fileType: saved.fileType,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}

/**
 * DELETE /api/etablissements/[id]/documents
 * Supprime un document (body: { documentId }).
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.documentId) {
    return NextResponse.json({ error: 'ID du document requis.' }, { status: 400 });
  }

  const existing = await prisma.etablissementDocument.findFirst({
    where: { id: body.documentId, etablissementId: params.id },
    select: { fileUrl: true },
  });

  await prisma.etablissementDocument.delete({
    where: { id: body.documentId, etablissementId: params.id },
  });
  await deleteStoredFile(existing?.fileUrl);

  return NextResponse.json({ ok: true });
}
