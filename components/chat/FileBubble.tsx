'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { formatFileSize } from '@/lib/chat-format';

export type FileStatus = 'sent' | 'sending' | 'failed';

function getFileTypeStyle(fileType?: string | null, fileName?: string | null): { bg: string; label: string } {
  const ext = fileName?.split('.').pop()?.toUpperCase().slice(0, 4);
  if (fileType?.includes('pdf')) return { bg: 'bg-red-500', label: 'PDF' };
  if (fileType?.includes('word') || fileType?.includes('document')) return { bg: 'bg-blue-600', label: 'DOC' };
  if (fileType?.includes('excel') || fileType?.includes('sheet') || fileType?.includes('csv')) return { bg: 'bg-emerald-600', label: 'XLS' };
  if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return { bg: 'bg-orange-500', label: 'PPT' };
  if (fileType?.includes('zip')) return { bg: 'bg-amber-600', label: 'ZIP' };
  if (fileType?.includes('video')) return { bg: 'bg-purple-500', label: 'VID' };
  if (fileType?.includes('audio')) return { bg: 'bg-pink-500', label: 'AUD' };
  if (fileType?.includes('image')) return { bg: 'bg-teal-500', label: 'IMG' };
  return { bg: 'bg-slate-500', label: ext && ext.length <= 4 ? ext : 'FT' };
}

/**
 * Carte compacte de pièce jointe : icône du type, nom du fichier, extension et taille,
 * avec ouverture / téléchargement (ou état d'envoi et nouvelle tentative).
 */
export function FileBubble({
  fileName,
  fileType,
  fileUrl,
  fileSize,
  status,
  onRetry,
  isMe
}: {
  fileName: string;
  fileType?: string | null;
  fileUrl: string;
  fileSize?: number | null;
  status?: FileStatus;
  onRetry?: () => void;
  isMe: boolean;
}) {
  const { bg, label } = getFileTypeStyle(fileType, fileName);
  const [progress, setProgress] = useState(0);

  // Progression indicatrice pendant l'envoi (jamais dans le rendu).
  useEffect(() => {
    if (status !== 'sending') return;
    const id = setInterval(() => setProgress((p) => Math.min(95, p + 5)), 120);
    return () => clearInterval(id);
  }, [status]);

  const sending = status === 'sending';
  const failed = status === 'failed';

  return (
    <div className="w-full">
      <div
        className={clsx(
          'flex items-center gap-2.5 rounded-xl p-2 ring-1',
          isMe ? 'bg-white/15 ring-white/25' : 'bg-slate-50 ring-slate-200/80'
        )}
      >
        <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide text-white', bg)}>
          {label}
        </span>

        <div className="min-w-0 flex-1">
          <p className={clsx('truncate text-[13px] font-medium', isMe ? 'text-white' : 'text-slate-800')}>{fileName}</p>
          {fileSize != null && (
            <p className={clsx('mt-0.5 text-[11px]', isMe ? 'text-white/70' : 'text-slate-500')}>
              {formatFileSize(fileSize)}
            </p>
          )}
        </div>

        {sending ? (
          <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center', isMe ? 'text-white/80' : 'text-slate-400')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
        ) : failed ? (
          <button
            onClick={onRetry}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-200 transition hover:bg-white/15"
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
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
              isMe ? 'text-white/85 hover:bg-white/15' : 'text-slate-500 hover:bg-slate-200/70'
            )}
            aria-label="Ouvrir le fichier"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {sending && (
        <div className={clsx('mt-1 h-1 w-full overflow-hidden rounded-full', isMe ? 'bg-white/25' : 'bg-slate-200')}>
          <div className={clsx('h-full rounded-full transition-all duration-200', isMe ? 'bg-white/80' : 'bg-[#2563eb]')} style={{ width: `${progress}%` }} />
        </div>
      )}
      {failed && <p className="mt-1 text-[11px] font-medium text-red-200">Échec de l&apos;envoi — appuyez pour réessayer</p>}
    </div>
  );
}
