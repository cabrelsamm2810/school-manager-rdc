import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

/** GET — historique des modifications d'une cote. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const cahierDeCoteId = searchParams.get('cahierDeCoteId');

  if (!cahierDeCoteId) {
    return NextResponse.json({ error: 'Identifiant de cote requis.' }, { status: 400 });
  }

  const history = await prisma.cahierDeCoteHistory.findMany({
    where: { cahierDeCoteId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ history });
}
