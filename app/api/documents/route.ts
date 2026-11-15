import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { uploadFile, resolveFileUrl, deleteFile } from '@/lib/storage';
import { validatePhotoFile, validateDocumentFile } from '@/lib/file-validation';
import path from 'path';

/**
 * GET /api/documents?categorie=document|photo
 * Liste les documents de l'utilisateur connecté.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get('categorie') || '';

  const docs = await prisma.userDocument.findMany({
    where: {
      userId: user.id,
      ...(categorie ? { categorie } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const resolved = await Promise.all(
    docs.map(async (d) => ({
      ...d,
      fileUrl: await resolveFileUrl(d.fileUrl, { signed: true }),
    })),
  );

  return NextResponse.json(resolved);
}

/**
 * POST /api/documents
 * Téléverse un document ou une photo (multipart/form-data).
 * Champs: file (File), titre (string), categorie (string), type (string), description (string)
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const titre = (formData.get('titre') as string)?.trim() || '';
  const categorie = (formData.get('categorie') as string)?.trim() || 'document';
  const type = (formData.get('type') as string)?.trim() || '';
  const description = (formData.get('description') as string)?.trim() || '';

  if (!file) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  if (!titre) return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });

  // Validation selon la catégorie
  const validationError =
    categorie === 'photo' ? validatePhotoFile(file) : validateDocumentFile(file);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const ext = path.extname(file.name) || '';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { storedUrl } = await uploadFile(
    `user-documents/${user.id}`,
    uniqueName,
    bytes,
    file.type || 'application/octet-stream',
  );

  const doc = await prisma.userDocument.create({
    data: {
      userId: user.id,
      categorie,
      type,
      titre,
      fileUrl: storedUrl,
      fileName: file.name,
      fileType: file.type || ext,
      fileSize: file.size,
      description,
    },
  });

  return NextResponse.json(
    { ...doc, fileUrl: await resolveFileUrl(storedUrl, { signed: true }) },
    { status: 201 },
  );
}

/**
 * DELETE /api/documents?docId=xxx
 * Supprime un document (fichier R2 + enregistrement base).
 */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('docId');
  if (!docId) return NextResponse.json({ error: 'ID document manquant.' }, { status: 400 });

  const doc = await prisma.userDocument.findFirst({
    where: { id: docId, userId: user.id },
  });
  if (!doc) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });

  await deleteFile(doc.fileUrl);
  await prisma.userDocument.delete({ where: { id: docId, userId: user.id } });

  return NextResponse.json({ ok: true });
}
