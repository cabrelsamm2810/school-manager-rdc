/**
 * Autorisations de lecture des fichiers stockés.
 *
 * Chaque objet R2 vit dans un bucket privé : `/api/files/<clé>` vérifie donc
 * l'identité de l'appelant puis applique la règle du module propriétaire de la
 * clé (photos de profil, dossiers élèves, documents d'établissement, SchoolChat,
 * bulletins). Le préfixe de la clé détermine la règle ; les conversations et
 * groupes de chat sont en plus vérifiés en base (appartenance).
 */

import prisma from '@/lib/prisma';
import { hasAtLeastRole } from '@/lib/rbac';
import { isUnsafeStorageKey } from '@/lib/file-validation';

export type FileKeyPolicy =
  | 'authenticated'
  | 'direction'
  | 'teacher'
  | 'chat'
  | 'denied';

/** Règle de lecture déduite du préfixe de la clé (dossier logique). */
export function fileKeyAccessPolicy(key: string): FileKeyPolicy {
  if (!key || isUnsafeStorageKey(key)) return 'denied';

  if (key.startsWith('profile-photos/')) return 'authenticated';
  if (key.startsWith('dossiers-eleves/')) return 'authenticated';
  if (key.startsWith('etablissements/')) return 'direction';
  if (key.startsWith('bulletins/')) return 'teacher';
  if (key.startsWith('chat-files/')) return 'chat';

  return 'denied';
}

export type FileReader = {
  id: string;
  role: string;
};

export type FileAccessResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

const DENIED = { ok: false as const, status: 403, error: 'Accès refusé.' };
const NOT_FOUND = { ok: false as const, status: 404, error: 'Fichier introuvable.' };

export async function authorizeFileRead(
  key: string,
  user: FileReader
): Promise<FileAccessResult> {
  const policy = fileKeyAccessPolicy(key);

  if (policy === 'denied') return NOT_FOUND;
  if (policy === 'authenticated') return { ok: true };

  if (policy === 'direction') {
    return hasAtLeastRole(user.role, 'DIRECTION_ECOLE') ? { ok: true } : DENIED;
  }

  if (policy === 'teacher') {
    return hasAtLeastRole(user.role, 'ENSEIGNANT') ? { ok: true } : DENIED;
  }

  // SchoolChat : conversation privée ou groupe — appartenance obligatoire.
  const fileUrl = `/api/files/${key}`;

  const message = await prisma.chatMessage.findFirst({
    where: { fileUrl },
    select: { conversation: { select: { user1Id: true, user2Id: true } } },
  });

  if (message) {
    const conversation = message.conversation;
    const isParticipant =
      conversation.user1Id === user.id || conversation.user2Id === user.id;
    return isParticipant ? { ok: true } : DENIED;
  }

  const groupMessage = await prisma.chatGroupMessage.findFirst({
    where: { fileUrl },
    select: { groupId: true },
  });

  if (groupMessage) {
    const membership = await prisma.chatGroupMember.findUnique({
      where: {
        groupId_userId: { groupId: groupMessage.groupId, userId: user.id },
      },
      select: { id: true },
    });
    return membership ? { ok: true } : DENIED;
  }

  // Clé inconnue en base : on ne sert rien depuis le bucket privé.
  return NOT_FOUND;
}
