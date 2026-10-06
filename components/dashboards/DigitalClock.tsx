'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Montre numérique dynamique : HH:MM:SS puis jour + date complète.
 *
 * L'heure vient de l'appareil de l'utilisateur et les secondes avancent en
 * temps réel. Isolée dans un composant dédié, elle ne re-rend que elle-même
 * chaque seconde (aucun impact sur le reste du tableau de bord).
 */
export function DigitalClock({
  variant = 'full',
  className
}: {
  variant?: 'full' | 'compact';
  className?: string;
}) {
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
    ? capitalize(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    : '';

  if (variant === 'compact') {
    return (
      <div className={clsx('flex flex-col items-end leading-tight', className)} aria-live="off">
        <span className="tabular-nums text-[11px] font-semibold text-slate-900 sm:text-sm">{time}</span>
        <span className="hidden text-[11px] text-slate-400 sm:block">{date || '\u00A0'}</span>
      </div>
    );
  }

  return (
    <div className={clsx('text-center sm:text-right', className)} aria-live="off">
      <p className="tabular-nums text-3xl font-bold tracking-tight text-white sm:text-4xl">{time}</p>
      <p className="mt-1 text-xs font-medium text-blue-100 sm:text-sm">{date || '\u00A0'}</p>
    </div>
  );
}
