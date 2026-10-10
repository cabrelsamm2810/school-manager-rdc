/**
 * Validation des fichiers téléversés (type MIME, extension, taille) et
 * construction des références de stockage.
 *
 * Aucune dépendance externe ici : ces helpers sont utilisés par les routes API
 * (upload, lecture, suppression) et par les tests unitaires.
 */

export type FileCategory =
  | 'profile-photo'
  | 'student-document'
  | 'establishment-document'
  | 'chat-attachment'
  | 'bulletin';

export type UploadLike = { name: string; type: string; size: number };

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const DOCUMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const CHAT_MIME_TYPES = [
  ...DOCUMENT_MIME_TYPES,
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/wav',
];

/** Extension(s) acceptée(s) pour chaque type MIME autorisé. */
const MIME_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'text/plain': ['txt'],
  'text/csv': ['csv'],
  'application/zip': ['zip'],
  'video/mp4': ['mp4'],
  'audio/mpeg': ['mp3'],
  'audio/mp4': ['m4a', 'mp4'],
  'audio/webm': ['webm'],
  'audio/ogg': ['ogg', 'oga'],
  'audio/wav': ['wav'],
};

export type FilePolicy = {
  allowedMimeTypes: string[];
  maxSize: number;
  invalidTypeMessage: string;
};

const MO = 1024 * 1024;

/**
 * Politiques par usage — mêmes limites et mêmes messages que le comportement
 * historique de School Manager RDC (photos 5 Mo, documents/pièces jointes 10 Mo).
 */
export const FILE_POLICIES: Record<FileCategory, FilePolicy> = {
  'profile-photo': {
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSize: 5 * MO,
    invalidTypeMessage: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.',
  },
  'student-document': {
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    maxSize: 10 * MO,
    invalidTypeMessage: 'Type de fichier non supporté.',
  },
  'establishment-document': {
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    maxSize: 10 * MO,
    invalidTypeMessage: 'Type de fichier non supporté.',
  },
  'chat-attachment': {
    allowedMimeTypes: CHAT_MIME_TYPES,
    maxSize: 10 * MO,
    invalidTypeMessage: 'Type de fichier non supporté.',
  },
  bulletin: {
    allowedMimeTypes: ['application/pdf'],
    maxSize: 20 * MO,
    invalidTypeMessage: 'Le bulletin doit être un fichier PDF.',
  },
};

/** Erreur d'upload typée : la route renvoie `error.message` avec `error.status`. */
export class UploadError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

export function isUploadError(error: unknown): error is UploadError {
  return error instanceof UploadError;
}

/** Préfixe des références de fichiers stockés dans R2 (servies par /api/files). */
export const FILE_URL_PREFIX = '/api/files/';
/** Préfixe des fichiers historiques servis par le dossier public Next.js. */
export const LOCAL_UPLOAD_PREFIX = '/uploads/';

export function extensionOf(fileName: string): string {
  const clean = (fileName || '').trim();
  const dot = clean.lastIndexOf('.');
  if (dot <= 0 || dot === clean.length - 1) return '';
  return clean.slice(dot + 1).toLowerCase();
}

/** Conserve le nom d'origine tout en supprimant tout caractère exploitable. */
export function sanitizeFileName(fileName: string): string {
  const base = (fileName || 'fichier').split(/[\\/]/).pop() || 'fichier';
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^[._-]+/, '');
  return safe || 'fichier';
}

/** Taille maximale effective : la plus restrictive entre la politique et FILE_MAX_SIZE. */
export function maxUploadSize(category: FileCategory): number {
  const policy = FILE_POLICIES[category];
  const globalMax = Number(process.env.FILE_MAX_SIZE || 0);
  if (Number.isFinite(globalMax) && globalMax > 0) return Math.min(policy.maxSize, globalMax);
  return policy.maxSize;
}

function formatFileSize(bytes: number): string {
  const mo = bytes / MO;
  return `${Number.isInteger(mo) ? mo : Math.round(mo * 10) / 10} Mo`;
}

/**
 * Valide un fichier entrant : type MIME déclaré, extension cohérente avec ce
 * type, taille non nulle et sous la limite.
 */
export function validateUploadedFile(
  file: UploadLike,
  category: FileCategory
): { ok: true } | { ok: false; error: string } {
  const policy = FILE_POLICIES[category];
  const mimeType = (file?.type || '').toLowerCase().trim();

  if (!mimeType) {
    return { ok: false, error: 'Type de fichier inconnu.' };
  }
  if (!policy.allowedMimeTypes.includes(mimeType)) {
    return { ok: false, error: policy.invalidTypeMessage };
  }

  const allowedExtensions = MIME_EXTENSIONS[mimeType] || [];
  const ext = extensionOf(file.name || '');
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      ok: false,
      error: `L\u2019extension du fichier ne correspond pas à son type (${mimeType}).`,
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: 'Le fichier est vide.' };
  }

  const limit = maxUploadSize(category);
  if (file.size > limit) {
    return { ok: false, error: `Le fichier dépasse ${formatFileSize(limit)}.` };
  }

  return { ok: true };
}

/** Un segment de clé S3 ne doit jamais permettre de sortir du préfixe attendu. */
export function isUnsafeStorageKey(key: string): boolean {
  if (!key) return true;
  if (key.startsWith('/')) return true;
  if (key.includes('\0')) return true;
  if (key.includes('\\')) return true;
  return key.split('/').some((segment) => segment === '..' || segment === '.');
}

function sanitizeFolder(folder: string): string {
  return folder
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/');
}

/** Clé d'objet stable et non devinable : `<dossier>/<horodatage>-<aléatoire>-<nom>`. */
export function buildObjectKey(folder: string, originalName: string): string {
  const cleanFolder = sanitizeFolder(folder);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(originalName)}`;
  return cleanFolder ? `${cleanFolder}/${suffix}` : suffix;
}

/** Référence stockée en base pour un objet R2. */
export function buildFileUrl(key: string): string {
  return `${FILE_URL_PREFIX}${key}`;
}

export type ParsedFileUrl =
  | { storage: 'r2'; key: string }
  | { storage: 'local'; relativePath: string }
  | { storage: 'external'; url: string };

/**
 * Interprète une valeur `fileUrl`/`profilePhotoUrl` stockée en base :
 * - `/api/files/...`  → objet R2 (bucket privé)
 * - `/uploads/...`    → fichier historique du dossier public (compatibilité)
 * - autre             → URL externe fournie par l'utilisateur (lien document)
 */
export function parseFileUrl(fileUrl: string | null | undefined): ParsedFileUrl | null {
  if (!fileUrl) return null;
  const url = fileUrl.trim();
  if (!url) return null;

  if (url.startsWith(FILE_URL_PREFIX)) {
    const key = url.slice(FILE_URL_PREFIX.length).split('?')[0];
    if (isUnsafeStorageKey(key)) return null;
    return { storage: 'r2', key };
  }

  if (url.startsWith(LOCAL_UPLOAD_PREFIX)) {
    const relativePath = url.slice(LOCAL_UPLOAD_PREFIX.length).split('?')[0];
    if (isUnsafeStorageKey(relativePath)) return null;
    return { storage: 'local', relativePath };
  }

  return { storage: 'external', url };
}
