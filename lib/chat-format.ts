/**
 * Helpers de présentation partagés par SchoolChat (liste, bulles, pièces jointes).
 * Aucune logique métier : uniquement du formatage déterministe, testable et sans état.
 */

export function isImageFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('image/')) return true;
  if (fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)) return true;
  return false;
}

export function isAudioFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('audio/')) return true;
  if (fileUrl && /\.(mp3|wav|ogg|webm|m4a|aac|opus)$/i.test(fileUrl)) return true;
  return false;
}

export function isVideoFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('video/')) return true;
  if (fileUrl && /\.(mp4|webm|ogg|mov|avi|mkv|m4v|3gp)$/i.test(fileUrl)) return true;
  return false;
}

/** Nature d'un message, utilisée pour l'aperçu et les icônes de la liste. */
export type ChatMessageKind = 'text' | 'audio' | 'image' | 'video' | 'file';

export function getMessageKind(msg: {
  content?: string | null;
  fileType?: string | null;
  fileUrl?: string | null;
}): ChatMessageKind {
  if (msg.content && msg.content.trim()) return 'text';
  if (isAudioFile(msg.fileType, msg.fileUrl)) return 'audio';
  if (isVideoFile(msg.fileType, msg.fileUrl)) return 'video';
  if (isImageFile(msg.fileType, msg.fileUrl)) return 'image';
  return 'file';
}

export function getMessagePreview(msg: {
  content?: string | null;
  fileType?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}): string {
  if (msg.content && msg.content.trim()) return msg.content;
  if (isAudioFile(msg.fileType, msg.fileUrl)) return 'Message vocal';
  if (isVideoFile(msg.fileType, msg.fileUrl)) return 'Vidéo';
  if (isImageFile(msg.fileType, msg.fileUrl)) return 'Photo';
  if (msg.fileUrl) return msg.fileName || 'Fichier';
  return '';
}

/** Heure courte d'un message (« 09:42 »). */
export function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Horodatage compact de la liste des conversations. */
export function formatListTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay) return 'Hier';
  if (diff < 7 * oneDay) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
