/**
 * Shared server-side file validation for document and photo uploads.
 *
 * Chat file validation lives in lib/chat-files.ts (kept separate because chat
 * accepts a wider set of MIME types and has mobile-specific fallback logic).
 *
 * All validators return `null` when the file is acceptable, or a French error
 * message suitable for the API response body.
 */

// ── Size limits (bytes) ───────────────────────────────────────

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;       // 5 Mo
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;   // 10 Mo

// ── Allowed MIME types ─────────────────────────────────────────

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_DOCUMENT_TYPES = [
  ...ALLOWED_PHOTO_TYPES,
  'image/heic',
  'image/heif',
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
];

// ── Allowed extensions (fallback when MIME is absent/generic) ─

const ALLOWED_PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'zip',
]);

// ── Helpers ────────────────────────────────────────────────────

function getExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase();
}

function isGenericMime(mime: string): boolean {
  return !mime || mime === 'application/octet-stream' || mime === 'binary/octet-stream';
}

// ── Validators ─────────────────────────────────────────────────

/**
 * Validates a profile photo upload.
 * @returns `null` if valid, otherwise an error message.
 */
export function validatePhotoFile(file: File): string | null {
  if (file.size > MAX_PHOTO_SIZE) {
    return 'Le fichier dépasse 5 Mo.';
  }

  const mime = file.type || '';

  if (ALLOWED_PHOTO_TYPES.includes(mime)) {
    return null;
  }

  // Fallback: check extension when MIME is absent or generic
  if (isGenericMime(mime)) {
    const ext = getExtension(file.name);
    if (ALLOWED_PHOTO_EXTENSIONS.has(ext)) return null;
  }

  return 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.';
}

/**
 * Validates an administrative document or student file upload.
 * @returns `null` if valid, otherwise an error message.
 */
export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_SIZE) {
    return 'Le fichier dépasse 10 Mo.';
  }

  const mime = file.type || '';

  if (ALLOWED_DOCUMENT_TYPES.includes(mime)) {
    // For generic MIME, also verify the extension
    if (isGenericMime(mime)) {
      const ext = getExtension(file.name);
      if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
        return 'Type de fichier non supporté.';
      }
    }
    return null;
  }

  // Fallback: check extension when MIME is absent or generic
  if (isGenericMime(mime)) {
    const ext = getExtension(file.name);
    if (ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) return null;
  }

  return 'Type de fichier non supporté.';
}
