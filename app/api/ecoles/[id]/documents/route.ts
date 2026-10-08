import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { uploadFile, resolveFileUrl, deleteFile } from '@/lib/storage';
import path from 'path';

function fullName(user: any) {
  return `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.email || 'Inconnu';
}

/**
 * GET /api/ecoles/[id]/documents
 * Liste les documents justificatifs d'un école.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const documents = await prisma.ecoleDocument.findMany({
    where: { ecoleId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  // Résout les URLs R2 en URLs signées
  const resolved = await Promise.all(
    documents.map(async (d) => ({
      ...d,
      fileUrl: await resolveFileUrl(d.fileUrl, { signed: true }),
    }))
  );

  return NextResponse.json({ documents: resolved });
}

/**
 * POST /api/ecoles/[id]/documents
 * Téléverse un document justificatif (multipart/form-data).
 * Champs: file (File), type (string), titre (string)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
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

  const ext = path.extname(file.name) || '';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { storedUrl } = await uploadFile(`ecoles/${params.id}`, uniqueName, bytes, file.type || ext);

  const document = await prisma.ecoleDocument.create({
    data: {
      ecoleId: params.id,
      type,
      titre,
      fileUrl: storedUrl,
      fileName: file.name,
      fileType: file.type || ext,
    },
  });

  // ── Audit : téléversement du document ──
  const user = (auth as any).user;
  await prisma.ecoleDocumentAudit.create({
    data: {
      ecoleId: params.id,
      documentId: document.id,
      documentTitre: titre,
      action: 'UPLOAD',
      userId: user?.id ?? '',
      userName: fullName(user),
      userRole: user?.role ?? '',
      commentaire: `Document « ${titre} » téléversé`,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}

/**
 * DELETE /api/ecoles/[id]/documents
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

  const doc = await prisma.ecoleDocument.findUnique({
    where: { id: body.documentId, ecoleId: params.id },
  });
  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  await deleteFile(doc.fileUrl);
  await prisma.ecoleDocument.delete({
    where: { id: body.documentId, ecoleId: params.id },
  });

  // ── Audit : suppression du document ──
  const user = (auth as any).user;
  await prisma.ecoleDocumentAudit.create({
    data: {
      ecoleId: params.id,
      documentId: null,
      documentTitre: doc.titre,
      action: 'DELETE',
      userId: user?.id ?? '',
      userName: fullName(user),
      userRole: user?.role ?? '',
      commentaire: `Document « ${doc.titre} » supprimé`,
    },
  });

  return NextResponse.json({ ok: true });
}
