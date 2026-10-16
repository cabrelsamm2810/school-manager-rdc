'use client';

import { memo } from 'react';
import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';

export type ChatPreviewKind = 'text' | 'audio' | 'image' | 'video' | 'file' | 'missed';

export type ConversationListItemProps = {
  id: string;
  kind: 'conversation' | 'group';
  name: string;
  prenom?: string | null;
  nom?: string | null;
  photoUrl?: string | null;
  /** Texte de l'aperçu du dernier message (ou repli du rôle / de la classe). */
  preview: string;
  previewKind: ChatPreviewKind;
  lastMessageMine?: boolean;
  lastMessageRead?: boolean;
  timeLabel?: string | null;
  unreadCount?: number;
  isActive: boolean;
  onSelect: (id: string, kind: 'conversation' | 'group') => void;
  /** Callback d'appel vidéo rapide (conversations privées uniquement). */
  onQuickCall?: (id: string) => void;
};

const PREVIEW_ICONS: Record<Exclude<ChatPreviewKind, 'text'>, JSX.Element> = {
  audio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  missed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
};

function CheckMark({ read }: { read: boolean }) {
  return (
    <svg viewBox="0 0 18 11" className={clsx('h-3 w-[15px] shrink-0', read ? 'text-[#60a5fa]' : 'text-[#93c5fd]')} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.6 5.6l2.9 2.9L10.3 2.5" />
      {read && <path d="M7.4 6.6l2.5 2.5L16.4 2.5" />}
    </svg>
  );
}

/**
 * Ligne de la liste des conversations — design sombre « Bleu nuit ».
 * Carte arrondie, avatar avec anneau bleu, badges, heure, aperçu.
 */
export const ConversationListItem = memo(function ConversationListItem({
  id,
  kind,
  name,
  prenom,
  nom,
  photoUrl,
  preview,
  previewKind,
  lastMessageMine,
  lastMessageRead,
  timeLabel,
  unreadCount = 0,
  isActive,
  onSelect,
  onQuickCall
}: ConversationListItemProps) {
  const unread = unreadCount > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id, kind)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id, kind); } }}
      aria-current={isActive ? 'true' : undefined}
      className={clsx(
        'sc-item relative flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#60a5fa] focus-visible:outline-offset-2 cursor-pointer',
        isActive ? 'bg-[#1e4a78]' : 'bg-[#132f4c] hover:bg-[#17395d] active:bg-[#1e4a78]'
      )}
      style={{
        boxShadow: isActive ? '0 4px 14px rgba(37,99,235,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {kind === 'group' ? (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-[0_0_0_2px_#1e3a8a]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
      ) : (
        <Avatar
          photoUrl={photoUrl}
          prenom={prenom}
          nom={nom}
          size="md"
          loading="lazy"
          className="ring-2 ring-[#2563eb]"
        />
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={clsx('min-w-0 flex-1 truncate text-[15px] leading-tight', unread ? 'font-bold text-white' : 'font-semibold text-white')}>
            {name}
          </span>
          {timeLabel && (
            <span className="shrink-0 text-[11.5px] tabular-nums leading-tight text-[#60a5fa]">
              {timeLabel}
            </span>
          )}
        </span>

        <span className="mt-1 flex items-center gap-1.5">
          <span className={clsx('flex min-w-0 flex-1 items-center gap-1 text-[13px] leading-tight', previewKind === 'missed' ? 'font-medium text-red-400' : 'text-[#93c5fd]')}>
            {previewKind !== 'text' && PREVIEW_ICONS[previewKind]}
            {lastMessageMine && previewKind !== 'missed' && <CheckMark read={!!lastMessageRead} />}
            <span className="truncate">{preview}</span>
          </span>
          {unread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#60a5fa] px-1.5 text-[11.5px] font-bold text-[#0a1729]">
              {unreadCount}
            </span>
          )}
        </span>
      </span>

      {kind === 'conversation' && onQuickCall && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onQuickCall(id); }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a]/60 text-[#60a5fa] transition hover:bg-[#2563eb] hover:text-white active:scale-90"
          aria-label={`Appel vidéo avec ${name}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      )}
    </div>
  );
});
