import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getNationalUser, requireNationalPermission } from '@/lib/national-access';
import { PERM } from '@/lib/permissions';
import { logAudit, getClientIP } from '@/lib/audit';

const COMMUNICATION_TYPE = 'communication_nationale';

const createSchema = z.object({
  titre: z.string().trim().min(3, 'Le titre est obligatoire.'),
  message: z.string().trim().min(3, 'Le message est obligatoire.'),
  province: z.string().trim().optional().or(z.literal('')),
});

/**
 * GET /api/coordination-nationale/communications
 * Communications officielles déjà envoyées (table `notifications`).
 */
export async function GET(request: NextRequest) {
  const auth = await getNationalUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const communications = await prisma.notification.findMany({
    where: { type: COMMUNICATION_TYPE },
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: { id: true, titre: true, message: true, createdAt: true },
  });

  return NextResponse.json({ communications });
}

/**
 * POST /api/coordination-nationale/communications
 * Envoie une communication officielle : elle apparaît dans les notifications
 * de l'application (aucun doublon de messagerie n'est créé).
 */
export async function POST(request: NextRequest) {
  const auth = await requireNationalPermission(request, PERM.NATIONAL_COMMUNICATIONS);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }

  const { titre, message, province } = parsed.data;
  const finalTitre = province ? `${titre} — ${province}` : titre;

  const notification = await prisma.notification.create({
    data: { titre: finalTitre, message, type: COMMUNICATION_TYPE, lu: false },
  });

  await logAudit({
    userId: auth.user.id,
    userRole: auth.user.role,
    userName: `${auth.user.prenom} ${auth.user.nom}`.trim(),
    action: 'national.communication.envoyer',
    module: 'coordination-nationale',
    resource: 'notification',
    resourceId: notification.id,
    details: finalTitre,
    ipAddress: getClientIP(request),
  });

  return NextResponse.json({ communication: notification }, { status: 201 });
}
