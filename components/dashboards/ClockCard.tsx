'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useSessionUser } from '@/lib/use-session-user';

const OTHER_INSTITUTION_TYPES = new Set(['PUBLIQUE', 'CATHOLIQUE', 'ISLAMIQUE', 'INDEPENDANTE']);

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Rotation d'une aiguille autour du centre du cadran (24,24). */
function hand(value: number, max: number) {
  return `rotate(${(value / max) * 360} 24 24)`;
}

/**
 * Carte montre : heure, date et institution.
 *
 * L'heure vient de l'appareil de l'utilisateur et avance en temps réel ; le
 * cadran ne re-rend que lui-même chaque seconde. Le nom affiché est celui de la
 * session serveur — aucune donnée n'est simulée.
 */
export function ClockCard({ institutionLabel }: { institutionLabel?: string | null }) {
  const user = useSessionUser();
  /* Logo EC-ERC par défaut (coordination, direction…), sauf pour un autre type d'école connu. */
  const showEcErc = !OTHER_INSTITUTION_TYPES.has(user?.typeInstitution ?? '');
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '--:--:--';

  const date = now
    ? capitalize(
        now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      )
    : '';

  const seconds = now ? now.getSeconds() : 0;
  const minutes = now ? now.getMinutes() : 0;
  const hours = now ? now.getHours() % 12 : 0;

  return (
    <section className="dash-card relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B21B6] via-[#6D28D9] to-[#8B5CF6] p-4 text-white shadow-lg shadow-violet-900/20">
      <span className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <svg viewBox="0 0 48 48" className="h-[72px] w-[72px] shrink-0 drop-shadow-[0_2px_6px_rgba(124,58,237,0.4)] sm:h-[80px] sm:w-[80px]" aria-hidden="true">
          {/* Cadran extérieur */}
          <circle cx="24" cy="24" r="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
          {/* Anneau intérieur */}
          <circle cx="24" cy="24" r="19" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
          {/* 12 graduations — majeures aux quarts, mineures ailleurs */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30;
            const isMajor = i % 3 === 0;
            return (
              <line
                key={i}
                x1="24"
                y1="3.5"
                x2="24"
                y2={isMajor ? 6 : 4.8}
                stroke={isMajor ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isMajor ? 1.4 : 0.7}
                strokeLinecap="round"
                transform={`rotate(${angle} 24 24)`}
              />
            );
          })}
          {/* Aiguille des heures */}
          <line
            x1="24"
            y1="26"
            x2="24"
            y2="14"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            transform={hand(hours + minutes / 60, 12)}
          />
          {/* Aiguille des minutes */}
          <line
            x1="24"
            y1="27"
            x2="24"
            y2="8.5"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
            transform={hand(minutes + seconds / 60, 60)}
          />
          {/* Aiguille des secondes avec contre-poids */}
          <line
            x1="24"
            y1="29"
            x2="24"
            y2="7"
            stroke="#FBBF24"
            strokeWidth="0.9"
            strokeLinecap="round"
            transform={hand(seconds, 60)}
          />
          <circle cx="24" cy="29" r="1.6" fill="#FBBF24" transform={hand(seconds, 60)} />
          {/* Centre */}
          <circle cx="24" cy="24" r="2.2" fill="#ffffff" />
          <circle cx="24" cy="24" r="1" fill="#7C3AED" />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="tabular-nums text-[28px] font-bold leading-none tracking-tight sm:text-[34px]">{time}</p>
          <p className="mt-1.5 text-[11.5px] font-medium text-violet-100 sm:text-xs">{date || '\u00A0'}</p>
        </div>
      </div>

      {showEcErc ? (
        <div className="relative mt-3.5 flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2.5">
          <img
            src="/illustrations/ec-erc-logo.jpg"
            alt="Logo EC-ERC"
            className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain p-0.5"
          />
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-100">Institution</p>
            <p className="text-[14px] font-bold leading-tight">EC-ERC</p>
            <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-violet-100">
              Écoles Conventionnées des Églises du Réveil du Congo
            </p>
          </div>
        </div>
      ) : (
        <div className="relative mt-3.5 flex items-center gap-2.5 rounded-xl bg-white/15 px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
            <Icon name="teacher" className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-100">Institution</p>
            <p className="truncate text-[13px] font-semibold">{institutionLabel || 'School Manager RDC'}</p>
          </div>
        </div>
      )}
    </section>
  );
}
