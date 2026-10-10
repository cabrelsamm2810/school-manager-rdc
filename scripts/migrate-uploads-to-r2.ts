/**
 * Migration progressive des fichiers historiques (`public/uploads/...`) vers
 * Cloudflare R2.
 *
 * - Ne supprime JAMAIS de fichier ni de donnée : les fichiers locaux et les
 *   entrées en base sont conservés, seule la référence (`fileUrl`) est mise à jour
 *   vers `/api/files/<clé>`.
 * - Idempotent : les références déjà migrées sont ignorées.
 * - Sans `--apply`, le script ne fait qu'afficher ce qu'il ferait (dry-run).
 *
 * Usage (dans le service `web`) :
 *   npx tsx scripts/migrate-uploads-to-r2.ts
 *   npx tsx scripts/migrate-uploads-to-r2.ts --apply
 */

import { readFile } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { isStorageEnabled, uploadObject } from '@/lib/storage';
import { buildFileUrl, parseFileUrl } from '@/lib/file-validation';

const LOCALES = '/uploads/';

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
};

function contentTypeFor(relativePath: string): string {
  const ext = relativePath.split('.').pop()?.toLowerCase() || '';
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

type PendingFile = {
  label: string;
  fileUrl: string;
  update: (fileUrl: string) => Promise<unknown>;
};

async function collectPendingFiles(): Promise<PendingFile[]> {
  const pending: PendingFile[] = [];

  const documents = await prisma.dossierEleveDocument.findMany({
    where: { fileUrl: { startsWith: LOCALES } },
    select: { id: true, fileUrl: true },
  });
  for (const row of documents) {
    pending.push({
      label: `document élève ${row.id}`,
      fileUrl: row.fileUrl,
      update: (fileUrl) => prisma.dossierEleveDocument.update({ where: { id: row.id }, data: { fileUrl } }),
    });
  }

  const etablissementDocuments = await prisma.etablissementDocument.findMany({
    where: { fileUrl: { startsWith: LOCALES } },
    select: { id: true, fileUrl: true },
  });
  for (const row of etablissementDocuments) {
    pending.push({
      label: `document établissement ${row.id}`,
      fileUrl: row.fileUrl,
      update: (fileUrl) => prisma.etablissementDocument.update({ where: { id: row.id }, data: { fileUrl } }),
    });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { fileUrl: { startsWith: LOCALES } },
    select: { id: true, fileUrl: true },
  });
  for (const row of messages) {
    pending.push({
      label: `message ${row.id}`,
      fileUrl: row.fileUrl as string,
      update: (fileUrl) => prisma.chatMessage.update({ where: { id: row.id }, data: { fileUrl } }),
    });
  }

  const groupMessages = await prisma.chatGroupMessage.findMany({
    where: { fileUrl: { startsWith: LOCALES } },
    select: { id: true, fileUrl: true },
  });
  for (const row of groupMessages) {
    pending.push({
      label: `message de groupe ${row.id}`,
      fileUrl: row.fileUrl as string,
      update: (fileUrl) => prisma.chatGroupMessage.update({ where: { id: row.id }, data: { fileUrl } }),
    });
  }

  const users = await prisma.user.findMany({
    where: { profilePhotoUrl: { startsWith: LOCALES } },
    select: { id: true, profilePhotoUrl: true },
  });
  for (const row of users) {
    pending.push({
      label: `photo de profil ${row.id}`,
      fileUrl: row.profilePhotoUrl as string,
      update: (fileUrl) => prisma.user.update({ where: { id: row.id }, data: { profilePhotoUrl: fileUrl } }),
    });
  }

  const etablissements = await prisma.etablissement.findMany({
    where: { logoUrl: { startsWith: LOCALES } },
    select: { id: true, logoUrl: true },
  });
  for (const row of etablissements) {
    pending.push({
      label: `logo établissement ${row.id}`,
      fileUrl: row.logoUrl as string,
      update: (fileUrl) => prisma.etablissement.update({ where: { id: row.id }, data: { logoUrl: fileUrl } }),
    });
  }

  const bulletins = await prisma.bulletin.findMany({
    where: { pdfUrl: { startsWith: LOCALES } },
    select: { id: true, pdfUrl: true },
  });
  for (const row of bulletins) {
    pending.push({
      label: `bulletin ${row.id}`,
      fileUrl: row.pdfUrl as string,
      update: (fileUrl) => prisma.bulletin.update({ where: { id: row.id }, data: { pdfUrl: fileUrl } }),
    });
  }

  return pending;
}

async function main() {
  const apply = process.argv.includes('--apply');

  if (!isStorageEnabled()) {
    console.error('Stockage R2 non configuré : renseignez S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY.');
    process.exitCode = 1;
    return;
  }

  const pending = await collectPendingFiles();
  console.log(`${pending.length} fichier(s) historique(s) référencé(s) dans public/uploads.`);

  let migrated = 0;
  let missing = 0;
  let failed = 0;

  for (const item of pending) {
    const parsed = parseFileUrl(item.fileUrl);
    if (!parsed || parsed.storage !== 'local') continue;

    const key = parsed.relativePath;
    const absolute = path.join(process.cwd(), 'public', 'uploads', key);

    let bytes: Buffer;
    try {
      bytes = await readFile(absolute);
    } catch {
      console.warn(`Fichier local absent, ignoré : ${item.label} (${absolute})`);
      missing++;
      continue;
    }

    if (!apply) {
      console.log(`[dry-run] ${item.label} : ${item.fileUrl} → ${buildFileUrl(key)}`);
      continue;
    }

    try {
      await uploadObject(key, new Uint8Array(bytes), contentTypeFor(key));
      await item.update(buildFileUrl(key));
      migrated++;
      console.log(`Migré : ${item.label} → ${buildFileUrl(key)}`);
    } catch (error) {
      failed++;
      console.error(`Échec pour ${item.label}`, error);
    }
  }

  if (apply) {
    console.log(`Terminé : ${migrated} migré(s), ${missing} absent(s), ${failed} en échec. Aucun fichier local supprimé.`);
  } else {
    console.log('Mode dry-run : relancez avec --apply pour effectuer la migration.');
  }
}

main()
  .catch((error) => {
    console.error('Migration interrompue.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
