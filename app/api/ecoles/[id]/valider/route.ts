import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { hasAtLeastRole } from '@/lib/rbac';
import { canTransition } from '@/lib/institutions';
import { logAudit, getClientIP } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['valider', 'rejeter']),
  commentaire: z.string().trim().optional().or(z.literal('')),
});

/** Statuts à partir desquels une école peut être validée ou rejetée. */
const STATUTS_EN_ATTENTE = ['En attente de vérification', 'En cours de vérification'];

/**
 * POST /api/ecoles/[id]/valider — valide ou rejette une école en attente.
 *
 * Body : { action: 'valider' | 'rejeter', commentaire?: string }
 *
 * Règles :
 *  1. Authentification + rôle minimum AGENT_SOUS_PROVINCIAL.
 *  2. L'école doit avoir un statut « en attente ».
 *  3. Périmètre territorial — le validateur doit couvrir le territoire de l'école.
 *  4. La transition doit être autorisée par le flux hiérarchique.
 *  5. Journalisation dans EcoleValidationLog ET AuditLog.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  if (!hasAtLeastRole(user.role, 'AGENT_SOUS_PROVINCIAL')) {
    return NextResponse.json(
      { error: 'Rôle insuffisant. Permission de coordination sous-provinciale requise.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const { action, commentaire } = parsed.data;

  const existing = await prisma.ecole.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  // ── L'école doit être en attente ──
  if (!STATUTS_EN_ATTENTE.includes(existing.statutValidation)) {
    return NextResponse.json(
      { error: `Cette école n'est pas en attente (statut actuel : ${existing.statutValidation}).` },
      { status: 400 },
    );
  }

  // ── Périmètre territorial ──
  if (user.role !== 'SUPER_ADMIN') {
    // Isolation par institution
    if (user.typeInstitution && user.typeInstitution !== existing.institution) {
      return NextResponse.json(
        { error: "Vous ne pouvez valider qu'une école de votre propre institution." },
        { status: 403 },
      );
    }
    // Périmètre sous-provincial
    if (user.coordSousProvincialeId && existing.coordSousProvincialeId !== user.coordSousProvincialeId) {
      return NextResponse.json(
        { error: "Cette école n'appartient pas à votre coordination sous-provinciale." },
        { status: 403 },
      );
    }
    // Périmètre provincial (COORDINATION_PROVINCIALE, AGENT_PROVINCIAL et au-dessus sauf SUPER_ADMIN)
    if (
      (hasAtLeastRole(user.role, 'COORDINATION_PROVINCIALE') || user.role === 'AGENT_PROVINCIAL') &&
      user.provinceAdministrative &&
      existing.province !== user.provinceAdministrative
    ) {
      return NextResponse.json(
        { error: "Cette école n'appartient pas à votre province." },
        { status: 403 },
      );
    }
  }

  // ── Transition hiérarchique ──
  const newStatutValidation = action === 'valider' ? 'Validée' : 'Rejetée';
  const oldStatut = existing.statutValidation;

  if (!canTransition(oldStatut, newStatutValidation, user.role)) {
    return NextResponse.json(
      { error: `Transition non autorisée : ${oldStatut} → ${newStatutValidation}.` },
      { status: 400 },
    );
  }

  // ── Mise à jour ──
  const updateData: { statutValidation: string; statut?: string } = {
    statutValidation: newStatutValidation,
  };
  if (action === 'valider') {
    updateData.statut = 'Actif';
  }

  const ecole = await prisma.ecole.update({
    where: { id: params.id },
    data: updateData,
  });

  const userName = `${user.prenom} ${user.nom}`.trim();
  const ipAddress = getClientIP(request);
  const centralAuditAction = action === 'valider' ? 'ECOLE_VALIDER' : 'ECOLE_REJETER';
  const auditDetails = `${action === 'valider' ? 'École validée' : 'École rejetée'} : ${existing.nom}${commentaire ? ` — ${commentaire}` : ''}`;

  // ── Journal de validation interne ──
  await prisma.ecoleValidationLog.create({
    data: {
      ecoleId: params.id,
      statut: newStatutValidation,
      commentaire: commentaire || auditDetails,
      validateurId: user.id,
      validateurNom: userName,
    },
  });

  // ── Audit par document : validation ou rejet du dossier ──
  const docs = await prisma.ecoleDocument.findMany({ where: { ecoleId: params.id } });
  const auditAction = action === 'valider' ? 'VALIDATE' : 'REJECT';
  const auditComment = action === 'valider'
    ? `Document « {titre} » validé par ${userName}`
    : `Document « {titre} » rejeté par ${userName}`;
  await prisma.ecoleDocumentAudit.createMany({
    data: docs.map((doc) => ({
      ecoleId: params.id,
      documentId: doc.id,
      documentTitre: doc.titre,
      action: auditAction,
      userId: user.id,
      userName,
      userRole: user.role,
      commentaire: auditComment.replace('{titre}', doc.titre) + (commentaire ? ` — ${commentaire}` : ''),
    })),
  });

  // ── Journal d'audit central ──
  await logAudit({
    userId: user.id,
    userRole: user.role,
    userName,
    action: centralAuditAction,
    module: 'ecoles',
    resourceId: params.id,
    details: auditDetails,
    ipAddress,
  });

  // ── Notification ──
  await prisma.notification.create({
    data: {
      titre: action === 'valider'
        ? `École validée : ${existing.nom}`
        : `École rejetée : ${existing.nom}`,
      message: action === 'valider'
        ? `L'école « ${existing.nom} » a été validée par ${userName}.${commentaire ? ` — ${commentaire}` : ''}`
        : `L'école « ${existing.nom} » a été rejetée par ${userName}.${commentaire ? ` — ${commentaire}` : ''}`,
      type: 'École',
    },
  });

  return NextResponse.json({
    ecole,
    action,
    message: action === 'valider'
      ? 'École validée avec succès.'
      : 'École rejetée.',
  });
}
