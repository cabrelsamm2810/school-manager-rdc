import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireNationalPermission } from '@/lib/national-access';
import { PERM } from '@/lib/permissions';
import { deleteFile } from '@/lib/storage';
import { logAudit, getClientIP } from '@/lib/audit';

/** DELETE /api/coordination-nationale/documents/[id] — supprimer un document national. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_DOCUMENTS);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const document = await prisma.nationalDocument.findUnique({ where: { id: params.id } });
  if (!document) return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });

  await deleteFile(document.fileUrl);
  await prisma.nationalDocument.delete({ where: { id: document.id } });

  await logAudit({
    userId: auth.user.id,
    userRole: auth.user.role,
    userName: `${auth.user.prenom} ${auth.user.nom}`.trim(),
    action: 'national.document.supprimer',
    module: 'coordination-nationale',
    resource: 'national-document',
    resourceId: document.id,
    details: document.titre,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ ok: true });
}
