/**
 * Storage abstraction layer.
 *
 * When Cloudflare R2 is configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME all present), new uploads go to R2.
 * Otherwise, files are stored on the local filesystem in public/uploads/ —
 * the original behaviour — so the app keeps working without R2.
 *
 * Stored URL formats in the database:
 *   - Local file:  /uploads/<category>/<filename>        (backward compatible)
 *   - R2 file:     r2://<category>/<filename>            (resolved to signed URL on read)
 *   - R2 public:   https://<R2_PUBLIC_URL>/<key>         (for public assets like profile photos)
 *   - Data URL:    data:image/...                         (registration photos, untouched)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { writeFile, mkdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ── R2 configuration ──────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const R2_PREFIX = 'r2://';

/** Returns true when all required R2 credentials are set. */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

// ── Helpers ───────────────────────────────────────────────────

export function isR2Url(url: string | null | undefined): boolean {
  return !!url && url.startsWith(R2_PREFIX);
}

function r2Key(url: string): string {
  return url.slice(R2_PREFIX.length);
}

// ── Upload ────────────────────────────────────────────────────

export interface UploadResult {
  /** Value to store in the database (fileUrl / profilePhotoUrl column). */
  storedUrl: string;
  /** True if the file was sent to R2, false if written locally. */
  usedR2: boolean;
}

/**
 * Uploads a file to R2 (when configured) or the local filesystem.
 *
 * @param category  Sub-folder, e.g. "chat-files", "profile-photos".
 * @param filename  Unique filename (already sanitised by the caller).
 * @param buffer    File content.
 * @param contentType  MIME type.
 * @param public_  When true and R2_PUBLIC_URL is set, the returned URL is a
 *                 permanent public URL (no signing needed). Use for profile
 *                 photos that are already public locally. When false, the
 *                 returned URL is an opaque `r2://` reference that must be
 *                 resolved via `resolveFileUrl()` before sending to the client.
 */
export async function uploadFile(
  category: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
  public_ = false,
): Promise<UploadResult> {
  if (isR2Configured()) {
    const key = `${category}/${filename}`;
    await getS3().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    if (public_ && R2_PUBLIC_URL) {
      return { storedUrl: `${R2_PUBLIC_URL}/${key}`, usedR2: true };
    }
    return { storedUrl: `${R2_PREFIX}${key}`, usedR2: true };
  }

  // ── Local fallback (original behaviour) ──
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', category);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  await writeFile(path.join(uploadDir, filename), buffer);
  return { storedUrl: `/uploads/${category}/${filename}`, usedR2: false };
}

// ── Resolve (stored URL → browser-accessible URL) ─────────────

/**
 * Converts a stored URL to a URL the browser can fetch.
 *
 * - `/uploads/...` and `https://...` and `data:...` are returned as-is.
 * - `r2://...` is resolved to a signed R2 URL (default 1 h expiry) or,
 *   if `R2_PUBLIC_URL` is set and `signed` is false, to the public URL.
 */
export async function resolveFileUrl(
  storedUrl: string | null | undefined,
  opts?: { signed?: boolean; expiresIn?: number },
): Promise<string | null> {
  if (!storedUrl) return null;
  if (!isR2Url(storedUrl)) return storedUrl;

  const key = r2Key(storedUrl);

  // Public URL (no signing)
  if (R2_PUBLIC_URL && !opts?.signed) {
    return `${R2_PUBLIC_URL}/${key}`;
  }

  // Signed URL
  if (isR2Configured()) {
    return getSignedUrl(
      getS3(),
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
      { expiresIn: opts?.expiresIn ?? 3600 },
    );
  }

  return null;
}

/**
 * Convenience: resolve an array of objects in-place, mapping a `urlField`
 * property from `r2://` to a signed/public URL.
 */
export async function resolveFileUrls<T extends Record<string, any>>(
  items: T[],
  urlField: keyof T,
  opts?: { signed?: boolean; expiresIn?: number },
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      [urlField]: await resolveFileUrl(item[urlField] as string, opts),
    })),
  );
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteFile(storedUrl: string | null | undefined): Promise<void> {
  if (!storedUrl) return;

  if (isR2Url(storedUrl) && isR2Configured()) {
    await getS3().send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: r2Key(storedUrl) }),
    );
    return;
  }

  // Local file
  if (storedUrl.startsWith('/uploads/')) {
    try {
      await unlink(path.join(process.cwd(), 'public', storedUrl.slice(1)));
    } catch {
      /* file may already be gone — ignore */
    }
  }
}

// ── File size ─────────────────────────────────────────────────

export async function getFileSize(storedUrl: string | null | undefined): Promise<number | null> {
  if (!storedUrl) return null;

  if (isR2Url(storedUrl) && isR2Configured()) {
    try {
      const res = await getS3().send(
        new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: r2Key(storedUrl) }),
      );
      return res.ContentLength ?? null;
    } catch {
      return null;
    }
  }

  // Local file
  if (storedUrl.startsWith('/uploads/')) {
    try {
      const info = await stat(path.join(process.cwd(), 'public', storedUrl.slice(1)));
      return info.size;
    } catch {
      return null;
    }
  }

  return null;
}
