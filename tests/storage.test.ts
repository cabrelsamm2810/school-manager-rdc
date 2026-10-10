import { describe, expect, it } from 'vitest';
import {
  buildFileUrl,
  buildObjectKey,
  extensionOf,
  isUnsafeStorageKey,
  parseFileUrl,
  sanitizeFileName,
  validateUploadedFile,
} from '@/lib/file-validation';
import { fileKeyAccessPolicy } from '@/lib/file-access';

const upload = (name: string, type: string, size: number) => ({ name, type, size });

describe('validation des fichiers téléversés', () => {
  it('accepte une image conforme pour une photo de profil', () => {
    expect(validateUploadedFile(upload('photo.png', 'image/png', 1024), 'profile-photo')).toEqual({ ok: true });
  });

  it('refuse un type MIME non autorisé', () => {
    const result = validateUploadedFile(upload('notes.txt', 'text/plain', 1024), 'profile-photo');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('Format non supporté');
  });

  it('refuse une extension incohérente avec le type MIME', () => {
    const result = validateUploadedFile(upload('photo.png', 'image/jpeg', 1024), 'profile-photo');
    expect(result.ok).toBe(false);
  });

  it('refuse un fichier dépassant la limite du module', () => {
    const result = validateUploadedFile(upload('photo.png', 'image/png', 6 * 1024 * 1024), 'profile-photo');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('5 Mo');
  });

  it('refuse un fichier vide', () => {
    expect(validateUploadedFile(upload('photo.png', 'image/png', 0), 'profile-photo').ok).toBe(false);
  });

  it('accepte un document PDF et une note vocale pour SchoolChat', () => {
    expect(validateUploadedFile(upload('bulletin.pdf', 'application/pdf', 1024), 'student-document')).toEqual({ ok: true });
    expect(validateUploadedFile(upload('vocal.webm', 'audio/webm', 2048), 'chat-attachment')).toEqual({ ok: true });
  });

  it('refuse une pièce jointe de chat hors politique', () => {
    expect(validateUploadedFile(upload('archive.rar', 'application/vnd.rar', 1024), 'chat-attachment').ok).toBe(false);
  });
});

describe('références de stockage', () => {
  it('neutralise les caractères dangereux', () => {
    expect(sanitizeFileName('../../etc/pa sswd.png')).toBe('pa_sswd.png');
    expect(extensionOf('photo.JPG')).toBe('jpg');
    expect(extensionOf('sans-extension')).toBe('');
  });

  it('construit des clés rangées par dossier', () => {
    const key = buildObjectKey('chat-files', 'photo de classe.png');
    expect(key.startsWith('chat-files/')).toBe(true);
    expect(key).toMatch(/^chat-files\/\d+-[a-z0-9]{6}-photo_de_classe\.png$/);
  });

  it('détecte les clés tentant de sortir du bucket', () => {
    expect(isUnsafeStorageKey('../../etc/passwd')).toBe(true);
    expect(isUnsafeStorageKey('/etc/passwd')).toBe(true);
    expect(isUnsafeStorageKey('chat-files/photo.png')).toBe(false);
  });

  it('interprète les trois formes d\u2019URL stockées', () => {
    expect(parseFileUrl(buildFileUrl('chat-files/a.png'))).toEqual({ storage: 'r2', key: 'chat-files/a.png' });
    expect(parseFileUrl('/uploads/chat-files/a.png?t=1')).toEqual({ storage: 'local', relativePath: 'chat-files/a.png' });
    expect(parseFileUrl('https://exemple.com/a.png')).toEqual({ storage: 'external', url: 'https://exemple.com/a.png' });
    expect(parseFileUrl('')).toBeNull();
  });
});

describe('règles de lecture des fichiers', () => {
  it('applique la règle du module propriétaire de la clé', () => {
    expect(fileKeyAccessPolicy('profile-photos/a.png')).toBe('authenticated');
    expect(fileKeyAccessPolicy('dossiers-eleves/a.pdf')).toBe('authenticated');
    expect(fileKeyAccessPolicy('chat-files/a.webm')).toBe('chat');
    expect(fileKeyAccessPolicy('etablissements/abc/a.pdf')).toBe('direction');
    expect(fileKeyAccessPolicy('bulletins/a.pdf')).toBe('teacher');
  });

  it('refuse tout ce qui sort des dossiers connus', () => {
    expect(fileKeyAccessPolicy('secrets/cles.txt')).toBe('denied');
    expect(fileKeyAccessPolicy('../etc/passwd')).toBe('denied');
    expect(fileKeyAccessPolicy('')).toBe('denied');
  });
});
