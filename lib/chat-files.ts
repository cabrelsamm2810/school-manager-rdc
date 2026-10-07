import { stat } from 'fs/promises';
import path from 'path';

const CHAT_FILES_PREFIX = '/uploads/chat-files/';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  // Types génériques que les navigateurs mobiles envoient fréquemment
  'application/octet-stream',
  'binary/octet-stream',
];

/** Extensions de fichiers autorisées (repli quand le type MIME est absent ou générique). */
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'zip', 'mp4', 'mp3', 'm4a', 'wav', 'webm', 'ogg',
]);

/**
 * Valide un fichier envoyé depuis le chat.
 * Sur mobile, le type MIME est souvent `application/octet-stream` ou une chaîne vide :
 * on accepte ces cas et on se replie sur l'extension du fichier.
 * Renvoie `null` si le fichier est valide, sinon un message d'erreur.
 */
export function validateChatFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'Le fichier dépasse 10 Mo.';
  }

  const mime = file.type || '';

  // Type MIME reconnu et autorisé
  if (ALLOWED_FILE_TYPES.includes(mime)) {
    // Pour les types génériques, on vérifie aussi l'extension
    if (mime === 'application/octet-stream' || mime === 'binary/octet-stream' || mime === '') {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return 'Type de fichier non supporté.';
      }
    }
    return null;
  }

  // Type MIME absent ou non reconnu : repli sur l'extension
  if (!mime || mime === 'application/octet-stream' || mime === 'binary/octet-stream') {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) return null;
  }

  return 'Type de fichier non supporté.';
}

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
