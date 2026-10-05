'use client';

import { useState } from 'react';

export type FileStatus = 'sent' | 'sending' | 'failed';

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : '?';
}

function getFileIconColor(fileType?: string | null): { bg: string; icon: string } {
  if (fileType?.includes('pdf')) return { bg: 'bg-red-500', icon: 'PDF' };
  if (fileType?.includes('word') || fileType?.includes('document')) return { bg: 'bg-blue-600', icon: 'DOC' };
  if (fileType?.includes('excel') || fileType?.includes('sheet')) return { bg: 'bg-green-600', icon: 'XLS' };
  if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return { bg: 'bg-orange-500', icon: 'PPT' };
  if (fileType?.includes('zip')) return { bg: 'bg-amber-600', icon: 'ZIP' };
  if (fileType?.includes('video')) return { bg: 'bg-purple-500', icon: 'VID' };
  if (fileType?.includes('audio')) return { bg: 'bg-pink-500', icon: 'AUD' };
  if (fileType?.includes('image')) return { bg: 'bg-teal-500', icon: 'IMG' };
  return { bg: 'bg-slate-500', icon: 'FILE' };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Bulle pour les fichiers envoyés/reçus dans le chat.
 * Affiche l'icône du type, le nom, l'extension, la taille,
 * un bouton télécharger/ouvrir, et un état d'envoi.
 */
export function FileBubble({
  fileName,
  fileType,
  fileUrl,
  fileSize,
  status,
  onRetry,
  isMe,
}: {
  fileName: string;
  fileType?: string | null;
  fileUrl: string;
  fileSize?: number;
  status?: FileStatus;
  onRetry?: () => void;
  isMe: boolean;
}) {
  const ext = getFileExtension(fileName);
  const { bg, icon } = getFileIconColor(fileType);
  const [progress, setProgress] = useState(0);

  // Simule une barre de progression pour l'état "sending"
  if (status === 'sending' && progress < 95) {
    setTimeout(() => setProgress((p) => Math.min(95, p + 5)), 100);
  }

  return (
    <div className="w-[220px] md:w-[260px]">
      <div className="flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-700/60 p-3 transition hover:bg-slate-200 dark:hover:bg-slate-700">
        {/* Icône du type de fichier */}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg} text-white`}>
          <span className="text-[10px] font-bold tracking-wide">{icon}</span>
        </div>

        {/* Infos fichier */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{fileName}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="rounded bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {ext}
            </span>
            {fileSize != null && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatFileSize(fileSize)}</span>
            )}
          </div>
        </div>

        {/* Bouton télécharger / état */}
        {status === 'sending' ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 animate-spin text-slate-400">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : status === 'failed' ? (
          <button
            onClick={onRetry}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30"
            aria-label="Réessayer l'envoi"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        ) : (
          <a
            href={fileUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-600"
            aria-label="Télécharger"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {/* Barre de progression pendant l'envoi */}
      {status === 'sending' && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status === 'failed' && (
        <p className="mt-1 text-[11px] font-medium text-red-500">Échec de l&apos;envoi — appuyez pour réessayer</p>
      )}
    </div>
  );
}
