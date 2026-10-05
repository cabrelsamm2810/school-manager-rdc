import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const docs = await prisma.dossierEleveDocument.findMany({
    where: { eleveId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(docs);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const eleve = await prisma.eleve.findUnique({ where: { id: params.id } });
  if (!eleve) return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

    const type = (formData.get('type') as string)?.trim() || '';
    const titre = (formData.get('titre') as string)?.trim() || '';
    const description = (formData.get('description') as string)?.trim() || '';
    const file = formData.get('file');

    if (!titre) return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Type de fichier non supporté.' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Le fichier dépasse 10 Mo.' }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'dossiers-eleves');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, uniqueName), Buffer.from(bytes));

    const doc = await prisma.dossierEleveDocument.create({
      data: {
        eleveId: params.id,
        type,
        titre,
        description,
        fileUrl: `/uploads/dossiers-eleves/${uniqueName}`,
        fileName: file.name,
        fileType: file.type,
        uploadedBy: `${user.prenom} ${user.nom}`.trim(),
      },
    });

    return NextResponse.json(doc, { status: 201 });
  }

  // JSON mode (link-based document, no file upload)
  const body = await request.json();
  const { type, titre, description, fileUrl } = body as { type?: string; titre: string; description?: string; fileUrl?: string };

  if (!titre?.trim()) return NextResponse.json({ error: 'Le titre est obligatoire.' }, { status: 400 });

  const doc = await prisma.dossierEleveDocument.create({
    data: {
      eleveId: params.id,
      type: type || '',
      titre: titre.trim(),
      description: description || '',
      fileUrl: fileUrl || '',
      fileName: '',
      fileType: '',
      uploadedBy: `${user.prenom} ${user.nom}`.trim(),
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('docId');
  if (!docId) return NextResponse.json({ error: 'ID document manquant.' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const { titre, type, description, newEleveId } = body as { titre?: string; type?: string; description?: string; newEleveId?: string };

  const existing = await prisma.dossierEleveDocument.findFirst({
    where: { id: docId, eleveId: params.id },
  });
  if (!existing) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });

  const data: Record<string, string> = {};
  if (titre !== undefined) data.titre = titre.trim();
  if (type !== undefined) data.type = type.trim();
  if (description !== undefined) data.description = description.trim();

  // Déplacement vers un autre dossier élève
  if (newEleveId !== undefined && newEleveId.trim() && newEleveId !== params.id) {
    const target = await prisma.eleve.findUnique({ where: { id: newEleveId.trim() } });
    if (!target) return NextResponse.json({ error: 'Élève de destination introuvable.' }, { status: 404 });
    data.eleveId = newEleveId.trim();
  }

  const updated = await prisma.dossierEleveDocument.update({
    where: { id: docId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('docId');
  if (!docId) return NextResponse.json({ error: 'ID document manquant.' }, { status: 400 });

  await prisma.dossierEleveDocument.delete({ where: { id: docId, eleveId: params.id } });
  return NextResponse.json({ ok: true });
}
