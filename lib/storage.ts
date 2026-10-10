/**
 * Stockage de fichiers — Cloudflare R2 via le SDK S3 (compatible S3).
 *
 * Principes :
 * - Les secrets R2 restent côté serveur, lus uniquement dans les variables
 *   d'environnement (jamais exposés au navigateur ni commités).
 * - Le bucket est privé : les lectures passent par `/api/files/<clé>`, qui
 *   vérifie les autorisations puis soit redirige vers une URL signée temporaire
 *   (`S3_PUBLIC_ENDPOINT` configuré), soit sert l'objet depuis le serveur.
 * - Si R2 n'est pas configuré, on retombe sur le comportement historique
 *   (écriture dans `public/uploads`) pour ne rien casser.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import {
  buildFileUrl,
  buildObjectKey,
  isUploadError,
  parseFileUrl,
  UploadError,
  validateUploadedFile,
  type FileCategory,
} from '@/lib/file-validation';

export type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

/** URL signée : validité courte par défaut (5 minutes). */
export const SIGNED_URL_TTL = Number(process.env.S3_SIGNED_URL_TTL || 300);

export function getStorageConfig(): StorageConfig | null {
  const endpoint = (process.env.S3_ENDPOINT || '').trim();
  const bucket = (process.env.S3_BUCKET || '').trim();
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || '').trim();

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    endpoint,
    region: (process.env.S3_REGION || 'auto').trim(),
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  };
}

export function isStorageEnabled(): boolean {
  return getStorageConfig() !== null;
}

/**
 * Endpoint public (facultatif) : quand il est défini, les lectures redirigent
 * vers une URL signée temporaire servie directement par R2 au navigateur.
 * Sinon l'objet est servi par le serveur applicatif (utile en développement).
 */
function publicEndpoint(): string | null {
  const value = (process.env.S3_PUBLIC_ENDPOINT || '').trim();
  return value || null;
}

export function usesSignedRedirects(): boolean {
  return isStorageEnabled() && publicEndpoint() !== null;
}

let cachedClient: { signature: string; client: S3Client } | null = null;

function createClient(config: StorageConfig, endpoint: string): S3Client {
  return new S3Client({
    endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function getClient(config: StorageConfig): S3Client {
  const signature = `${config.endpoint}|${config.region}|${config.accessKeyId}|${config.forcePathStyle}`;
  if (!cachedClient || cachedClient.signature !== signature) {
    cachedClient = { signature, client: createClient(config, config.endpoint) };
  }
  return cachedClient.client;
}

let bucketChecked = false;

/**
 * Développement uniquement : crée le bucket s'il n'existe pas
 * (`S3_AUTO_CREATE_BUCKET=true`). Sur R2 le bucket est créé dans la console
 * Cloudflare, donc l'option reste désactivée par défaut.
 */
async function ensureBucket(config: StorageConfig, client: S3Client): Promise<void> {
  if (bucketChecked) return;
  bucketChecked = true;
  if (process.env.S3_AUTO_CREATE_BUCKET !== 'true') return;

  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
    } catch {
      // Ignoré : si la création n'est pas permise, l'upload remontera l'erreur réelle.
    }
  }
}

function isNotFound(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
  return name === 'NoSuchKey' || name === 'NotFound' || status === 404;
}

export async function uploadObject(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  const config = getStorageConfig();
  if (!config) throw new UploadError('Stockage R2 non configuré.', 503);

  const client = getClient(config);
  await ensureBucket(config, client);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      })
    );
  } catch (error) {
    console.error('[storage] échec du téléversement R2', key, error);
    throw new UploadError('Échec du téléversement vers le stockage distant.', 502);
  }
}

export type StoredObject = {
  body: Uint8Array;
  contentType: string;
  contentLength: number;
};

export async function readObject(key: string): Promise<StoredObject | null> {
  const config = getStorageConfig();
  if (!config) return null;

  const client = getClient(config);
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      body: bytes,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: bytes.byteLength,
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    console.error('[storage] échec de lecture R2', key, error);
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  const config = getStorageConfig();
  if (!config) return;

  const client = getClient(config);
  try {
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
  } catch (error) {
    if (isNotFound(error)) return;
    console.error('[storage] échec de suppression R2', key, error);
  }
}

/** URL signée temporaire (bucket privé), à utiliser côté navigateur. */
export async function getSignedDownloadUrl(
  key: string,
  options: { expiresIn?: number; fileName?: string } = {}
): Promise<string | null> {
  const config = getStorageConfig();
  if (!config) return null;

  const endpoint = publicEndpoint() || config.endpoint;
  const client =
    endpoint === config.endpoint ? getClient(config) : createClient(config, endpoint);

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ResponseContentDisposition: options.fileName
        ? `inline; filename="${options.fileName}"`
        : undefined,
    }),
    { expiresIn: options.expiresIn ?? SIGNED_URL_TTL }
  );
}

export type SavedUpload = {
  fileUrl: string;
  fileName: string;
  fileType: string;
  storage: 'r2' | 'local';
  key: string | null;
};

export type SaveUploadOptions = {
  category: FileCategory;
  /** Dossier logique : `profile-photos`, `chat-files`, `dossiers-eleves`, `etablissements/<id>`… */
  folder: string;
};

/**
 * Valide puis enregistre un fichier téléversé.
 * R2 si configuré, sinon repli sur `public/uploads` (comportement historique).
 */
export async function saveUploadedFile(
  file: File,
  { category, folder }: SaveUploadOptions
): Promise<SavedUpload> {
  const check = validateUploadedFile(
    { name: file.name, type: file.type, size: file.size },
    category
  );
  if (!check.ok) throw new UploadError(check.error, 400);

  const fileName = file.name || 'fichier';
  const fileType = file.type;
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (isStorageEnabled()) {
    const key = buildObjectKey(folder, fileName);
    await uploadObject(key, bytes, fileType);
    return { fileUrl: buildFileUrl(key), fileName, fileType, storage: 'r2', key };
  }

  const safeFolder = folder
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .filter(Boolean)
    .join('/');
  const uniqueName = buildObjectKey('', fileName);
  const directory = path.join(process.cwd(), 'public', 'uploads', safeFolder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, uniqueName), Buffer.from(bytes));

  return {
    fileUrl: `/uploads/${safeFolder}/${uniqueName}`,
    fileName,
    fileType,
    storage: 'local',
    key: null,
  };
}

/**
 * Supprime le fichier référencé (R2 ou dossier public).
 * Toujours non bloquant : une suppression de fichier ne doit pas faire échouer
 * la suppression de l'entrée en base.
 */
export async function deleteStoredFile(fileUrl: string | null | undefined): Promise<void> {
  const parsed = parseFileUrl(fileUrl);
  if (!parsed) return;

  try {
    if (parsed.storage === 'r2') {
      await deleteObject(parsed.key);
      return;
    }
    if (parsed.storage === 'local') {
      await unlink(path.join(process.cwd(), 'public', 'uploads', parsed.relativePath));
    }
  } catch {
    // Fichier déjà absent ou inaccessible : on ignore.
  }
}

export { isUploadError };
