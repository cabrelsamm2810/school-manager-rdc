import { describe, expect, it } from 'vitest';
import {
  deleteObject,
  getSignedDownloadUrl,
  getStorageConfig,
  isStorageEnabled,
  readObject,
  uploadObject,
} from '@/lib/storage';

/**
 * Test d'intégration du stockage S3 compatible (Cloudflare R2 en production,
 * bucket S3 local en développement).
 * Ignoré sauf si RUN_STORAGE_TESTS=true et si les variables S3_* sont présentes :
 * `RUN_STORAGE_TESTS=true npm test`.
 */
const enabled = process.env.RUN_STORAGE_TESTS === 'true' && isStorageEnabled();

describe.skipIf(!enabled)('stockage S3 compatible (R2)', () => {
  const key = `tests/integration-${Date.now()}.txt`;
  const body = new TextEncoder().encode('school-manager-rdc');

  it('téléverse, relit puis supprime un objet du bucket privé', async () => {
    await uploadObject(key, body, 'text/plain');

    const stored = await readObject(key);
    expect(stored).not.toBeNull();
    expect(new TextDecoder().decode(stored?.body)).toBe('school-manager-rdc');
    expect(stored?.contentType).toContain('text/plain');

    await deleteObject(key);
    expect(await readObject(key)).toBeNull();
  });

  it('génère une URL signée temporaire pour un objet privé', async () => {
    await uploadObject(key, body, 'text/plain');

    const url = await getSignedDownloadUrl(key, { expiresIn: 60 });
    expect(url).toBeTruthy();
    expect(url).toContain(getStorageConfig()?.bucket as string);
    expect(url).toContain(key);
    expect(url).toContain('X-Amz-Expires=60');

    await deleteObject(key);
  });

  it('renvoie null pour un objet inexistant', async () => {
    expect(await readObject('tests/objet-absent-xyz.bin')).toBeNull();
  });
});
