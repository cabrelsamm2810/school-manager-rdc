import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireNationalAccess, displayName } from '@/lib/national-access';
import { uploadFile, resolveFileUrl, deleteFile } from '@/lib/storage';
import { validateDocumentFile } from '@/lib/file-validation';
import { logAudit, getClientIP } from '@/lib/audit';
import {
  NATIONAL_DOCUMENT_TYPE_VALUES,
  NATIONAL_DOCUMENT_STATUTS,
  documentTypeLabel,
} from '@/lib/national-documents';

export const dynamic = 'force-dynamic';

const UPLOAD_CATEGORY = 'documents-nationaux';

/**
 * GET /api/coordination-nationale/documents
 * Circulaires, décisions, lettres officielles, rapports provinciaux et
 * documents administratifs du niveau national.
 */
export async function GET(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type')?.trim() || '';
  const statut = searchParams.get('statut')?.trim() || '';
  const search = searchParams.get('search')?.trim() || '';

  const where: Record<string, unknown> = {};
  if (type && NATIONAL_DOCUMENT_TYPE_VALUES.includes(type)) where.type = type;
  if (statut && (NATIONAL_DOCUMENT_STATUTS as readonly string[]).includes(statut)) {
    where.statut = statut;
  }
  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { province: { contains: search, mode: 'insensitive' } },
    ];
  }

  const documents = await prisma.documentNational.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Aucune URL de stockage n'est exposée : les fichiers sont servis par
  // /api/coordination-nationale/documents/[id]/file, après contrôle du rôle.
  return NextResponse.json({
    documents: documents.map(({ fileUrl, ...document }) => ({
      ...document,
      hasFile: !!fileUrl,
    })),
  });
}

/**
 * POST /api/coordination-nationale/documents
 * Enregistre un document institutionnel (multipart/form-data).
 * Le fichier est optionnel : une circulaire peut être enregistrée avant
 * d'être numérisée.
 */
export async function POST(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;
  const currentUser = auth.user;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const type = (formData.get('type') as string)?.trim() || '';
  const reference = (formData.get('reference') as string)?.trim() || '';
  const titre = (formData.get('titre') as string)?.trim() || '';
  const description = (formData.get('description') as string)?.trim() || '';
  const province = (formData.get('province') as string)?.trim() || '';
  const statut = (formData.get('statut') as string)?.trim() || 'Publié';
  const file = formData.get('file') as File | null;

  if (!NATIONAL_DOCUMENT_TYPE_VALUES.includes(type)) {
    return NextResponse.json({ error: 'Type de document invalide.' }, { status: 400 });
  }
  if (!titre) {
    return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });
  }
  if (!(NATIONAL_DOCUMENT_STATUTS as readonly string[]).includes(statut)) {
    return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
  }

  let storedUrl = '';
  let fileName = '';
  let fileType = '';
  let fileSize = 0;

  if (file && file.size > 0) {
    const validationError = validateDocumentFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const ext = path.extname(file.name) || '';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const upload = await uploadFile(
      UPLOAD_CATEGORY,
      uniqueName,
      bytes,
      file.type || 'application/octet-stream',
    );
    storedUrl = upload.storedUrl;
    fileName = file.name;
    fileType = file.type || ext;
    fileSize = file.size;
  }

  const document = await prisma.documentNational.create({
    data: {
      type,
      reference,
      titre,
      description,
      province,
      statut,
      fileUrl: storedUrl,
      fileName,
      fileType,
      fileSize,
      auteurId: currentUser.id,
      auteurNom: displayName(currentUser),
    },
  });

  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: displayName(currentUser),
    action: 'CREATE_DOCUMENT_NATIONAL',
    module: 'coordination-nationale',
    resource: 'documentNational',
    resourceId: document.id,
    details: `${documentTypeLabel(type)} — ${titre}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json(
    { document: { ...document, fileUrl: await resolveFileUrl(storedUrl, { signed: true }) } },
    { status: 201 },
  );
}

/**
 * DELETE /api/coordination-nationale/documents?id=xxx
 * Supprime un document national (fichier stocké + enregistrement).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireNationalAccess(request);
  if (!auth.ok) return auth.response;
  const currentUser = auth.user;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Identifiant du document manquant.' }, { status: 400 });
  }

  const document = await prisma.documentNational.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  if (document.fileUrl) {
    await deleteFile(document.fileUrl);
  }
  await prisma.documentNational.delete({ where: { id } });

  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName: displayName(currentUser),
    action: 'DELETE_DOCUMENT_NATIONAL',
    module: 'coordination-nationale',
    resource: 'documentNational',
    resourceId: id,
    details: `${documentTypeLabel(document.type)} — ${document.titre}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ ok: true });
}
