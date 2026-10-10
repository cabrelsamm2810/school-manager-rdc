import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { rm, readFile } from 'fs/promises';
import path from 'path';

import {
  isR2Url,
  isR2Configured,
  uploadFile,
  resolveFileUrl,
  deleteFile,
  getFileSize,
} from '@/lib/storage';
import {
  validatePhotoFile,
  validateDocumentFile,
  MAX_PHOTO_SIZE,
  MAX_DOCUMENT_SIZE,
} from '@/lib/file-validation';

// ── Utility function tests (no side effects) ──────────────────

describe('storage utilities', () => {
  it('isR2Url detects r2:// prefix', () => {
    expect(isR2Url('r2://chat-files/file.jpg')).toBe(true);
    expect(isR2Url('r2://')).toBe(true);
    expect(isR2Url('/uploads/chat-files/file.jpg')).toBe(false);
    expect(isR2Url('https://example.com/file.jpg')).toBe(false);
    expect(isR2Url('data:image/png;base64,abc')).toBe(false);
    expect(isR2Url(null)).toBe(false);
    expect(isR2Url(undefined)).toBe(false);
    expect(isR2Url('')).toBe(false);
  });

  it('isR2Configured returns false without env vars', () => {
    expect(isR2Configured()).toBe(false);
  });
});

// ── Local file operations (upload, resolve, delete, size) ─────

describe('local storage operations', () => {
  const testCategory = '__test-storage__';
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', testCategory);

  beforeEach(async () => {
    await rm(uploadsDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(uploadsDir, { recursive: true, force: true });
  });

  it('uploads a file to local filesystem and returns a /uploads/ URL', async () => {
    const buffer = Buffer.from('test content for upload');
    const filename = 'test-upload.txt';

    const result = await uploadFile(testCategory, filename, buffer, 'text/plain');

    expect(result.usedR2).toBe(false);
    expect(result.storedUrl).toBe(`/uploads/${testCategory}/${filename}`);

    const filePath = path.join(process.cwd(), 'public', result.storedUrl.slice(1));
    expect(existsSync(filePath)).toBe(true);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toBe('test content for upload');
  });

  it('resolves a local /uploads/ URL as-is', async () => {
    const url = `/uploads/${testCategory}/test.txt`;
    const resolved = await resolveFileUrl(url);
    expect(resolved).toBe(url);
  });

  it('resolves null and empty URLs to null', async () => {
    expect(await resolveFileUrl(null)).toBeNull();
    expect(await resolveFileUrl(undefined)).toBeNull();
    expect(await resolveFileUrl('')).toBeNull();
  });

  it('resolves https URLs as-is', async () => {
    const url = 'https://example.com/photo.jpg';
    expect(await resolveFileUrl(url)).toBe(url);
  });

  it('resolves data URLs as-is', async () => {
    const url = 'data:image/png;base64,iVBORw0KGgo=';
    expect(await resolveFileUrl(url)).toBe(url);
  });

  it('gets file size for a local file', async () => {
    const content = 'size test content';
    const buffer = Buffer.from(content);
    const { storedUrl } = await uploadFile(testCategory, 'size-test.txt', buffer, 'text/plain');
    const size = await getFileSize(storedUrl);
    expect(size).toBe(buffer.length);
  });

  it('returns null size for non-existent file', async () => {
    expect(await getFileSize('/uploads/__test-storage__/nonexistent.txt')).toBeNull();
  });

  it('deletes a local file', async () => {
    const buffer = Buffer.from('to be deleted');
    const { storedUrl } = await uploadFile(testCategory, 'delete-test.txt', buffer, 'text/plain');
    const filePath = path.join(process.cwd(), 'public', storedUrl.slice(1));
    expect(existsSync(filePath)).toBe(true);

    await deleteFile(storedUrl);
    expect(existsSync(filePath)).toBe(false);
  });

  it('deleteFile does not throw for null or non-existent URLs', async () => {
    await expect(deleteFile(null)).resolves.toBeUndefined();
    await expect(deleteFile(undefined)).resolves.toBeUndefined();
    await expect(deleteFile('')).resolves.toBeUndefined();
    await expect(deleteFile('/uploads/__test-storage__/nonexistent.txt')).resolves.toBeUndefined();
  });
});

// ── Authorization / edge-case tests ────────────────────────────

describe('storage authorization edge cases', () => {
  // These verify the storage layer safely handles unauthorized or
  // malformed inputs without leaking data. API-level authorization
  // (session/role checks) is enforced in each route handler before
  // any storage operation is called.

  it('resolveFileUrl returns null for r2:// when R2 is not configured (no data leak)', async () => {
    expect(await resolveFileUrl('r2://private/secret.pdf')).toBeNull();
  });

  it('deleteFile silently ignores r2:// URLs when R2 is not configured', async () => {
    await expect(deleteFile('r2://private/secret.pdf')).resolves.toBeUndefined();
  });

  it('getFileSize returns null for r2:// URLs when R2 is not configured', async () => {
    expect(await getFileSize('r2://private/secret.pdf')).toBeNull();
  });
});

// ── File validation tests ──────────────────────────────────────

describe('file validation', () => {
  function mockFile(name: string, type: string, size: number): File {
    return { name, type, size } as unknown as File;
  }

  it('validates a correct photo', () => {
    expect(validatePhotoFile(mockFile('photo.jpg', 'image/jpeg', 1024))).toBeNull();
  });

  it('rejects a photo that is too large', () => {
    const result = validatePhotoFile(mockFile('photo.jpg', 'image/jpeg', MAX_PHOTO_SIZE + 1));
    expect(result).toContain('5 Mo');
  });

  it('rejects a photo with unsupported type', () => {
    const result = validatePhotoFile(mockFile('photo.bmp', 'image/bmp', 1024));
    expect(result).toContain('Format non supporté');
  });

  it('validates a correct document', () => {
    expect(validateDocumentFile(mockFile('doc.pdf', 'application/pdf', 1024))).toBeNull();
  });

  it('rejects a document that is too large', () => {
    const result = validateDocumentFile(mockFile('doc.pdf', 'application/pdf', MAX_DOCUMENT_SIZE + 1));
    expect(result).toContain('10 Mo');
  });

  it('rejects a document with unsupported type', () => {
    const result = validateDocumentFile(mockFile('script.exe', 'application/x-msdownload', 1024));
    expect(result).toContain('non supporté');
  });

  it('accepts a document with generic MIME but valid extension', () => {
    expect(validateDocumentFile(mockFile('doc.pdf', 'application/octet-stream', 1024))).toBeNull();
  });

  it('rejects a document with generic MIME and invalid extension', () => {
    const result = validateDocumentFile(mockFile('script.exe', 'application/octet-stream', 1024));
    expect(result).toContain('non supporté');
  });
});
