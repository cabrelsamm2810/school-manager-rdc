import { stat } from 'fs/promises';
import path from 'path';

const CHAT_FILES_PREFIX = '/uploads/chat-files/';

/**
 * Taille en octets d'une pièce jointe déjà stockée sur disque.
 * Renvoie `null` si l'URL ne pointe pas vers le dossier des pièces jointes de chat
 * ou si le fichier n'existe plus — l'interface affiche alors simplement moins d'informations.
 */
export async function getStoredFileSize(fileUrl?: string | null): Promise<number | null> {
  if (!fileUrl || !fileUrl.startsWith(CHAT_FILES_PREFIX)) return null;
  try {
    const info = await stat(path.join(process.cwd(), 'public', fileUrl.slice(1)));
    return info.size;
  } catch {
    return null;
  }
}
