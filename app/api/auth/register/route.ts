import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const uploadSchema = z.object({
  ownerId: z.string().min(1),
  folder: z.enum(['profiles', 'students', 'schoolchat', 'communication', 'documents', 'schools']),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().max(Number(process.env.FILE_MAX_SIZE ?? 10 * 1024 * 1024))
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }

    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé.' }, { status: 415 });
    }

    const maxBytes = Number(process.env.FILE_MAX_SIZE ?? 10 * 1024 * 1024);
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Le fichier dépasse la limite autorisée.' }, { status: 413 });
    }

    const ownerId = (formData.get('ownerId') ?? '').toString();
    const folder = (formData.get('folder') ?? 'profiles').toString();

    const parsed = uploadSchema.safeParse({
      ownerId,
      folder,
      fileName: file.name,
      contentType: file.type,
      size: file.size
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
    }

    const key = `${parsed.data.folder}/${parsed.data.ownerId}/${Date.now()}-${parsed.data.fileName}`;
    const publicUrl = `${process.env.S3_ENDPOINT ?? 'https://example.com'}/${process.env.S3_BUCKET ?? 'school-manager-rdc'}/${key}`;

    return NextResponse.json({
      ok: true,
      file: {
        key,
        url: publicUrl,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        ownerId: parsed.data.ownerId,
        folder: parsed.data.folder
      }
    });
  } catch (error) {
    console.error('Upload error', error);

    return NextResponse.json({
      error: 'Erreur lors de l’upload du fichier.'
    }, { status: 500 });
  }
}
