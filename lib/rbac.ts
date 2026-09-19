export const MAX_FILE_SIZE = Number(process.env.FILE_MAX_SIZE ?? 10 * 1024 * 1024);

export const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

export const STORAGE_FOLDERS = ['profiles', 'students', 'schoolchat', 'communication', 'documents', 'schools'] as const;

export function isAllowedFileType(contentType: string): boolean {
  return ALLOWED_FILE_TYPES.has(contentType);
}

export function isAllowedFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function getSafeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}
