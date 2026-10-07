'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

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
        <svg viewBox="0 0 48 48" className="h-16 w-16 shrink-0 sm:h-[70px] sm:w-[70px]" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {[0, 90, 180, 270].map((angle) => (
            <line
              key={angle}
              x1="24"
              y1="5"
              x2="24"
              y2="9"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 24 24)`}
            />
          ))}
          <line
            x1="24"
            y1="24"
            x2="24"
            y2="13.5"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            transform={hand(hours + minutes / 60, 12)}
          />
          <line
            x1="24"
            y1="24"
            x2="24"
            y2="9"
            stroke="#ffffff"
            strokeWidth="1.7"
            strokeLinecap="round"
            transform={hand(minutes + seconds / 60, 60)}
          />
          <line
            x1="24"
            y1="24"
            x2="24"
            y2="8"
            stroke="#DDD6FE"
            strokeWidth="1"
            strokeLinecap="round"
            transform={hand(seconds, 60)}
          />
          <circle cx="24" cy="24" r="1.8" fill="#ffffff" />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="tabular-nums text-[28px] font-bold leading-none tracking-tight sm:text-[34px]">{time}</p>
          <p className="mt-1.5 text-[11.5px] font-medium text-violet-100 sm:text-xs">{date || '\u00A0'}</p>
        </div>
      </div>

      <div className="relative mt-3.5 flex items-center gap-2.5 rounded-xl bg-white/15 px-3 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Icon name="teacher" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-100">Institution</p>
          <p className="truncate text-[13px] font-semibold">{institutionLabel || 'School Manager RDC'}</p>
        </div>
      </div>
    </section>
  );
}
