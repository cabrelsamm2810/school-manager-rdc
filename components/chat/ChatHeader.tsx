'use client';

import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';

/**
 * En-tête compact d'une conversation (56 px) : photo, nom, sous-titre
 * (rôle ou classe du groupe) et actions à droite — recherche, appel vocal, appel vidéo.
 * Le statut de présence n'est pas fourni par le système : aucun indicateur n'est inventé.
 */
export function ChatHeader({
  name,
  prenom,
  nom,
  photoUrl,
  subtitle,
  isGroup,
  canCall,
  searchOpen,
  onBack,
  onToggleSearch,
  onCall
}: {
  name: string;
  prenom?: string | null;
  nom?: string | null;
  photoUrl?: string | null;
  subtitle: string;
  isGroup: boolean;
  canCall: boolean;
  searchOpen: boolean;
  onBack: () => void;
  onToggleSearch: () => void;
  onCall: (type: 'audio' | 'video') => void;
}) {
  const actionClass =
    'flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white active:scale-90';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-2.5 sm:px-3.5">
      <button onClick={onBack} className={clsx(actionClass, 'md:hidden')} aria-label="Retour aux conversations">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {isGroup ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
      ) : (
        <Avatar photoUrl={photoUrl} prenom={prenom} nom={nom} size="sm" className="ring-1 ring-white/25" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-tight text-white">{name}</p>
        <p className="truncate text-[11.5px] leading-tight text-white/70">{subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={onToggleSearch}
          className={clsx(actionClass, searchOpen && 'bg-white/15 text-white')}
          aria-pressed={searchOpen}
          aria-label="Rechercher dans la conversation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {canCall && (
          <>
            <button onClick={() => onCall('audio')} className={actionClass} aria-label="Appel vocal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
            <button onClick={() => onCall('video')} className={actionClass} aria-label="Appel vidéo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
