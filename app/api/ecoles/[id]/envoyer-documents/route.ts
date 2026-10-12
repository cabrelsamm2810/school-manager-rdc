import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { canTransition } from '@/lib/institutions';
import { logAudit, getClientIP } from '@/lib/audit';
import { sendDocumentSubmissionEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ecoles/[id]/envoyer-documents
 *
 * L'école soumet son dossier de documents à la coordination sous-provinciale
 * et provinciale pour vérification. Le statut passe de « Brouillon » ou
 * « Rejetée » à « En attente de vérification ».
 *
 * Règles :
 *  1. Authentification + rôle DIRECTION_ECOLE (ou rôles école équivalents).
 *  2. L'école doit avoir au moins un document justificatif.
 *  3. La transition doit être autorisée par le flux hiérarchique.
 *  4. Journalisation dans EcoleValidationLog, AuditLog et Notification.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  // Seuls les rôles de l'école peuvent envoyer le dossier
  const SCHOOL_ROLES = ['DIRECTION_ECOLE', 'PROMOTEUR', 'SECRETAIRE', 'COMPTABLE'];
  if (!SCHOOL_ROLES.includes(user.role)) {
    return NextResponse.json(
      { error: 'Seul le chef d\'établissement ou un rôle école peut envoyer le dossier.' },
      { status: 403 },
    );
  }

  const existing = await prisma.ecole.findUnique({
    where: { id: params.id },
    include: {
      documents: true,
      coordSousProvinciale: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: 'École introuvable.' }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient bien à cette école
  if (user.role !== 'SUPER_ADMIN' && user.ecoleId && user.ecoleId !== params.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez envoyer le dossier que de votre propre école.' },
      { status: 403 },
    );
  }

  // L'école doit avoir au moins un document
  if (existing.documents.length === 0) {
    return NextResponse.json(
      { error: 'Veuillez téléverser au moins un document justificatif avant d\'envoyer le dossier.' },
      { status: 400 },
    );
  }

  const oldStatut = existing.statutValidation;
  const newStatut = 'En attente de vérification';

  // Vérifier la transition hiérarchique
  if (!canTransition(oldStatut, newStatut, user.role)) {
    return NextResponse.json(
      { error: `Transition non autorisée : ${oldStatut} → ${newStatut}.` },
      { status: 400 },
    );
  }

  // Mettre à jour le statut
  const ecole = await prisma.ecole.update({
    where: { id: params.id },
    data: { statutValidation: newStatut },
  });

  const userName = `${user.prenom} ${user.nom}`.trim();
  const ipAddress = getClientIP(request);
  const docCount = existing.documents.length;
  const auditDetails = `Dossier envoyé à la coordination : ${docCount} document(s) — par ${userName}`;

  // Journal de validation interne
  await prisma.ecoleValidationLog.create({
    data: {
      ecoleId: params.id,
      statut: newStatut,
      commentaire: auditDetails,
      validateurId: user.id,
      validateurNom: userName,
    },
  });

  // ── Audit par document : soumission du dossier ──
  await prisma.ecoleDocumentAudit.createMany({
    data: existing.documents.map((doc) => ({
      ecoleId: params.id,
      documentId: doc.id,
      documentTitre: doc.titre,
      action: 'SUBMIT',
      userId: user.id,
      userName,
      userRole: user.role,
      commentaire: `Document « ${doc.titre} » soumis à la coordination`,
    })),
  });

  // Journal d'audit central
  await logAudit({
    userId: user.id,
    userRole: user.role,
    userName,
    action: 'ECOLE_ENVOYER_DOSSIER',
    module: 'ecoles',
    resourceId: params.id,
    details: auditDetails,
    ipAddress,
  });

  // Notification à la coordination
  await prisma.notification.create({
    data: {
      titre: `Dossier reçu : ${existing.nom}`,
      message: `L'école « ${existing.nom} » a envoyé son dossier (${docCount} document(s)) pour vérification. Statut : En attente de vérification.`,
      type: 'École',
    },
  });

  // ── Email aux coordinateurs concernés ──
  const coordName = existing.coordSousProvinciale?.nom || 'Coordination sous-provinciale';

  // Coordinateurs sous-provinciaux liés à la sous-division de l'école
  const sousProvincialCoordinators = existing.coordSousProvincialeId
    ? await prisma.user.findMany({
        where: {
          role: 'COORDINATION_SOUS_PROVINCIALE',
          coordSousProvincialeId: existing.coordSousProvincialeId,
          isActive: true,
          NOT: { email: '' },
        },
        select: { email: true, nom: true, prenom: true },
      })
    : [];

  // Coordinateurs provinciaux couvrant la province de l'école
  const provincialCoordinators = existing.province
    ? await prisma.user.findMany({
        where: {
          role: 'COORDINATION_PROVINCIALE',
          provinceAdministrative: existing.province,
          isActive: true,
          NOT: { email: '' },
        },
        select: { email: true, nom: true, prenom: true },
      })
    : [];

  // Envoi des emails (non bloquant — une erreur d'envoi n'empêche pas la soumission)
  for (const coord of [...sousProvincialCoordinators, ...provincialCoordinators]) {
    const coordinatorName = `${coord.prenom} ${coord.nom}`.trim();
    try {
      await sendDocumentSubmissionEmail({
        to: coord.email,
        coordinatorName,
        ecoleNom: existing.nom,
        docCount,
        coordName,
      });
    } catch {
      // Une erreur d'envoi email ne doit pas bloquer le flux
    }
  }

  return NextResponse.json({
    ecole,
    message: 'Dossier envoyé avec succès à la coordination. Votre école est maintenant en attente de vérification.',
  });
}
