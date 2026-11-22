import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { getNationalUser, requireNationalPermission } from '@/lib/national-access';
import { PERM } from '@/lib/permissions';
import { validateDocumentFile } from '@/lib/file-validation';
import { uploadFile, resolveFileUrl } from '@/lib/storage';
import { logAudit, getClientIP } from '@/lib/audit';
import { nationalFonctionLabel } from '@/lib/national-fonctions';
import { NATIONAL_DOCUMENT_CATEGORY_VALUES } from '@/lib/national-documents';

/**
 * GET /api/coordination-nationale/documents
 * Espace documentaire national : circulaires, décisions, lettres et rapports.
 */
export async function GET(request: NextRequest) {
  const auth = await getNationalUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get('categorie') || '';
  const search = searchParams.get('search') || '';

  const documents = await prisma.nationalDocument.findMany({
    where: {
      ...(categorie ? { categorie } : {}),
      ...(search
        ? {
            OR: [
              { titre: { contains: search, mode: 'insensitive' as const } },
              { reference: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const resolved = await Promise.all(
    documents.map(async (doc) => ({
      ...doc,
      fileUrl: await resolveFileUrl(doc.fileUrl, { signed: true }),
    }))
  );

  return NextResponse.json({ documents: resolved });
}

/**
 * POST /api/coordination-nationale/documents (multipart/form-data)
 * Publier / archiver un document national.
 */
export async function POST(request: NextRequest) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_DOCUMENTS);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const titre = (formData.get('titre') as string)?.trim() || '';
  const categorie = ((formData.get('categorie') as string) || 'circulaire').trim();
  const reference = (formData.get('reference') as string)?.trim() || '';
  const description = (formData.get('description') as string)?.trim() || '';

  if (!file) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  if (!titre) return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });
  if (!NATIONAL_DOCUMENT_CATEGORY_VALUES.includes(categorie)) {
    return NextResponse.json({ error: 'Catégorie de document invalide.' }, { status: 400 });
  }

  const validationError = validateDocumentFile(file);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const ext = path.extname(file.name) || '';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName || `document${ext}`}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { storedUrl } = await uploadFile(
    'national-documents',
    uniqueName,
    bytes,
    file.type || 'application/octet-stream'
  );

  const document = await prisma.nationalDocument.create({
    data: {
      titre,
      categorie,
      reference,
      description,
      fileUrl: storedUrl,
      fileName: file.name,
      fileType: file.type || '',
      fileSize: file.size,
      auteurId: auth.user.id,
      auteurNom: `${auth.user.prenom} ${auth.user.nom}`.trim(),
      auteurFonction: nationalFonctionLabel(auth.user.fonction),
    },
  });

  await logAudit({
    userId: auth.user.id,
    userRole: auth.user.role,
    userName: `${auth.user.prenom} ${auth.user.nom}`.trim(),
    action: 'national.document.publier',
    module: 'coordination-nationale',
    resource: 'national-document',
    resourceId: document.id,
    details: `${categorie} — ${titre}`,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ document }, { status: 201 });
}
