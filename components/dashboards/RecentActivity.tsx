'use client';

import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

const ACCENTS = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500'
} as const;

export type ActivityAccent = keyof typeof ACCENTS;

/**
 * Activité récente présentée comme une timeline.
 * Aucune donnée n'est fabriquée : si la liste est vide, un état vide élégant
 * remplace le bloc (jamais de zone blanche).
 */
export function RecentActivity({
  items,
  accent = 'blue'
}: {
  items: string[];
  accent?: ActivityAccent;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
          <Icon name="bell" className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-500">Aucune activité récente</p>
        <p className="mt-1 text-xs text-slate-400">Les dernières actions apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="relative flex gap-3">
          <span className="relative flex w-3 shrink-0 justify-center">
            <span className={clsx('mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white', ACCENTS[accent])} />
            {index < items.length - 1 && (
              <span className="absolute bottom-[-1rem] top-4 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
            )}
          </span>
          <p className="min-w-0 break-words text-sm leading-relaxed text-slate-600">{item}</p>
        </li>
      ))}
    </ol>
  );
}
