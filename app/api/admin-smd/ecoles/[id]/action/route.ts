import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { can, PERM } from '@/lib/permissions';
import { logAudit, getClientIP } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum([
    'validate',
    'suspend',
    'reactivate',
    'deactivate',
  ]),
  commentaire: z.string().trim().optional().or(z.literal('')),
});

/**
 * POST /api/admin-smd/ecoles/[id]/action — action sensible sur un établissement.
 *
 * Actions : validate (valider), suspend (suspendre), reactivate (réactiver),
 * deactivate (désactiver).
 *
 * Toutes les actions sont enregistrées dans le journal d'audit ET dans
 * l'historique de validation de l'établissement (EcoleValidationLog).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (!can(currentUser.role, PERM.ADMIN_ECOLES)) {
    return NextResponse.json({ error: 'Permission insuffisante.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Action invalide.' },
      { status: 400 },
    );
  }

  const { action, commentaire } = parsed.data;

  const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Établissement introuvable.' }, { status: 404 });
  }

  const userName = `${currentUser.prenom} ${currentUser.nom}`.trim();
  const ipAddress = getClientIP(request);

  // ── Mapping action → nouveaux statuts ──
  let newStatut = existing.statut;
  let newStatutValidation = existing.statutValidation;
  let auditAction = '';
  let auditDetails = '';

  switch (action) {
    case 'validate':
      newStatutValidation = 'Validée';
      newStatut = 'Actif';
      auditAction = 'ECOLE_VALIDATE';
      auditDetails = `Établissement validé : ${existing.nom}`;
      break;
    case 'suspend':
      newStatut = 'Suspendu';
      newStatutValidation = 'Suspendue';
      auditAction = 'ECOLE_SUSPEND';
      auditDetails = `Établissement suspendu : ${existing.nom}`;
      break;
    case 'reactivate':
      newStatut = 'Actif';
      newStatutValidation = 'Validée';
      auditAction = 'ECOLE_REACTIVATE';
      auditDetails = `Établissement réactivé : ${existing.nom}`;
      break;
    case 'deactivate':
      newStatut = 'Inactif';
      auditAction = 'ECOLE_DEACTIVATE';
      auditDetails = `Établissement désactivé : ${existing.nom}`;
      break;
  }

  const ecole = await prisma.ecole.update({
    where: { id: params.id },
    data: {
      statut: newStatut,
      statutValidation: newStatutValidation,
    },
  });

  // ── Log de validation interne ──
  await prisma.ecoleValidationLog.create({
    data: {
      ecoleId: params.id,
      statut: newStatutValidation,
      commentaire: commentaire || auditDetails,
      validateurId: currentUser.id,
      validateurNom: userName,
    },
  });

  // ── Journal d'audit central ──
  await logAudit({
    userId: currentUser.id,
    userRole: currentUser.role,
    userName,
    action: auditAction,
    module: 'ecoles',
    resourceId: params.id,
    details: `${auditDetails}${commentaire ? ` — ${commentaire}` : ''}`,
    ipAddress,
  });

  return NextResponse.json({ ecole, action });
}
