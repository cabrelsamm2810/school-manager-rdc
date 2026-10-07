'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { formatFileSize } from '@/lib/chat-format';

export type FileStatus = 'sent' | 'sending' | 'failed';

function getFileTypeStyle(fileType?: string | null, fileName?: string | null): { bg: string; label: string; icon: JSX.Element } {
  const ext = fileName?.split('.').pop()?.toUpperCase().slice(0, 4);
  if (fileType?.includes('pdf'))
    return {
      bg: 'from-red-500 to-red-600',
      label: 'PDF',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    };
  if (fileType?.includes('word') || fileType?.includes('document'))
    return {
      bg: 'from-blue-500 to-blue-600',
      label: 'DOC',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    };
  if (fileType?.includes('excel') || fileType?.includes('sheet') || fileType?.includes('csv'))
    return {
      bg: 'from-emerald-500 to-emerald-600',
      label: 'XLS',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    };
  if (fileType?.includes('powerpoint') || fileType?.includes('presentation'))
    return {
      bg: 'from-orange-500 to-orange-600',
      label: 'PPT',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    };
  if (fileType?.includes('zip'))
    return {
      bg: 'from-amber-500 to-amber-600',
      label: 'ZIP',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      ),
    };
  if (fileType?.includes('video'))
    return {
      bg: 'from-purple-500 to-purple-600',
      label: 'VID',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    };
  if (fileType?.includes('audio'))
    return {
      bg: 'from-pink-500 to-pink-600',
      label: 'AUD',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      ),
    };
  if (fileType?.includes('image'))
    return {
      bg: 'from-teal-500 to-teal-600',
      label: 'IMG',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    };
  return {
    bg: 'from-slate-500 to-slate-600',
    label: ext && ext.length <= 4 ? ext : 'FT',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  };
}

/**
 * Carte de pièce jointe élégante : icône colorée selon le type, nom du fichier,
 * taille, et bouton d'ouverture / téléchargement clairement identifiable.
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
  const { bg, label, icon } = getFileTypeStyle(fileType, fileName);
  const [progress, setProgress] = useState(0);

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
          'flex items-center gap-3 rounded-xl p-2.5 ring-1 transition',
          isMe ? 'bg-white/15 ring-white/20' : 'bg-slate-50 ring-slate-200/70'
        )}
      >
        {/* Icône du type de fichier avec dégradé */}
        <span
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
            bg
          )}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className={clsx('truncate text-[13px] font-semibold leading-tight', isMe ? 'text-white' : 'text-slate-800')}>
            {fileName}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={clsx('rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide', isMe ? 'bg-white/20 text-white/90' : 'bg-slate-200 text-slate-600')}>
              {label}
            </span>
            {fileSize != null && (
              <span className={clsx('text-[11px] tabular-nums', isMe ? 'text-white/65' : 'text-slate-500')}>
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>

        {sending ? (
          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center', isMe ? 'text-white/80' : 'text-slate-400')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
        ) : failed ? (
          <button
            onClick={onRetry}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-200 transition hover:bg-white/15"
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
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-90',
              isMe ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300'
            )}
            aria-label="Ouvrir le fichier"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {sending && (
        <div className={clsx('mt-1.5 h-1 w-full overflow-hidden rounded-full', isMe ? 'bg-white/25' : 'bg-slate-200')}>
          <div className={clsx('h-full rounded-full transition-all duration-200', isMe ? 'bg-white/80' : 'bg-[#2563eb]')} style={{ width: `${progress}%` }} />
        </div>
      )}
      {failed && <p className="mt-1 text-[11px] font-medium text-red-200">Échec de l&apos;envoi — appuyez pour réessayer</p>}
    </div>
  );
}
