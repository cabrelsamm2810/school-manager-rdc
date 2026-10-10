/**
 * Tests the full document upload workflow as exercised by the API routes
 * (app/api/ecoles/[id]/documents, app/api/eleves/[id]/documents):
 *
 *   validateDocumentFile → uploadFile → resolveFileUrl → getFileSize → deleteFile
 *
 * These tests run without a database — they cover the storage and validation
 * layers that the routes delegate to.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'fs';
import { rm, readFile } from 'fs/promises';
import path from 'path';

import {
  uploadFile,
  resolveFileUrl,
  deleteFile,
  getFileSize,
  isR2Configured,
} from '@/lib/storage';
import { validateDocumentFile, MAX_DOCUMENT_SIZE } from '@/lib/file-validation';

// ── Helpers ───────────────────────────────────────────────────

function mockFile(name: string, type: string, size: number): File {
  return { name, type, size } as unknown as File;
}

/** Simulates what the route does: validate → upload → resolve → size → delete. */
async function simulateDocumentUpload(
  category: string,
  file: { name: string; type: string; content: Buffer },
) {
  // 1. Validate (as the route does)
  const validationError = validateDocumentFile(
    mockFile(file.name, file.type, file.content.length),
  );
  if (validationError) return { error: validationError };

  // 2. Upload
  const ext = path.extname(file.name);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const { storedUrl, usedR2 } = await uploadFile(
    category,
    uniqueName,
    file.content,
    file.type,
  );

  // 3. Resolve to a browser-accessible URL
  const resolvedUrl = await resolveFileUrl(storedUrl, { signed: true });

  // 4. Get file size
  const size = await getFileSize(storedUrl);

  // 5. Delete
  await deleteFile(storedUrl);

  return { storedUrl, usedR2, resolvedUrl, size };
}

// ── Tests ─────────────────────────────────────────────────────

describe('document upload workflow', () => {
  const testCategory = '__test-doc-upload__';
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', testCategory);

  beforeEach(async () => {
    await rm(uploadsDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(uploadsDir, { recursive: true, force: true });
  });

  it('uploads, resolves, sizes, and deletes a PDF document', async () => {
    const content = Buffer.from('%PDF-1.4 test document content');
    const result = await simulateDocumentUpload(testCategory, {
      name: 'bulletin.pdf',
      type: 'application/pdf',
      content,
    });

    expect(result.error).toBeUndefined();
    expect(result.size).toBe(content.length);
    expect(result.resolvedUrl).toBeTruthy();

    if (!isR2Configured()) {
      // Local: file should be deleted from disk
      expect(result.storedUrl).toMatch(/^\/uploads\//);
      const filePath = path.join(process.cwd(), 'public', result.storedUrl!.slice(1));
      expect(existsSync(filePath)).toBe(false);
    }
  });

  it('uploads a DOCX document through the full workflow', async () => {
    const content = Buffer.alloc(2048, 0x42);
    const result = await simulateDocumentUpload(testCategory, {
      name: 'rapport.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content,
    });

    expect(result.error).toBeUndefined();
    expect(result.size).toBe(content.length);
  });

  it('uploads a JPEG image as a document', async () => {
    const content = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 'JFIF'.split('').map(c => c.charCodeAt(0))].flat() as number[]);
    const result = await simulateDocumentUpload(testCategory, {
      name: 'photo-identite.jpg',
      type: 'image/jpeg',
      content,
    });

    expect(result.error).toBeUndefined();
    expect(result.size).toBe(content.length);
  });

  it('uploads a CSV file with generic MIME but valid extension', async () => {
    const content = Buffer.from('nom,prenom,classe\nDupont,Jean,6A\n');
    const result = await simulateDocumentUpload(testCategory, {
      name: 'eleves.csv',
      type: 'application/octet-stream',
      content,
    });

    expect(result.error).toBeUndefined();
    expect(result.size).toBe(content.length);
  });

  it('rejects an executable file before any storage operation', async () => {
    const content = Buffer.from('MZ\x90\x00 mock exe');
    const result = await simulateDocumentUpload(testCategory, {
      name: 'malware.exe',
      type: 'application/x-msdownload',
      content,
    });

    expect(result.error).toContain('non supporté');
    expect(result.storedUrl).toBeUndefined();
  });

  it('rejects a document exceeding the size limit', async () => {
    const validationError = validateDocumentFile(
      mockFile('huge.pdf', 'application/pdf', MAX_DOCUMENT_SIZE + 1),
    );
    expect(validationError).toContain('10 Mo');
  });

  it('verifies the file size matches after upload (R2 or local)', async () => {
    const content = Buffer.from('exact content verification test 12345');
    const uniqueName = `verify-${Date.now()}.txt`;
    const { storedUrl, usedR2 } = await uploadFile(testCategory, uniqueName, content, 'text/plain');

    expect(await getFileSize(storedUrl)).toBe(content.length);

    if (!usedR2) {
      const filePath = path.join(process.cwd(), 'public', storedUrl.slice(1));
      const onDisk = await readFile(filePath, 'utf-8');
      expect(onDisk).toBe(content.toString());
    }

    await deleteFile(storedUrl);

    if (!usedR2) {
      const filePath = path.join(process.cwd(), 'public', storedUrl.slice(1));
      expect(existsSync(filePath)).toBe(false);
    }
  });

  it('completes upload → delete → re-upload cycle without conflict', async () => {
    const content1 = Buffer.from('first version');
    const content2 = Buffer.from('second version, different size');

    const r1 = await uploadFile(testCategory, `cycle-1-${Date.now()}.txt`, content1, 'text/plain');
    await deleteFile(r1.storedUrl);

    const r2 = await uploadFile(testCategory, `cycle-2-${Date.now()}.txt`, content2, 'text/plain');
    expect(await getFileSize(r2.storedUrl)).toBe(content2.length);

    await deleteFile(r2.storedUrl);
  });
});
