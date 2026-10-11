'use client';

import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

const ACCENTS = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-brand-500'
} as const;

export type ActivityAccent = keyof typeof ACCENTS;

/**
 * Activité récente présentée comme une timeline compacte.
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
          <Icon name="bell" className="h-[18px] w-[18px]" />
        </span>
        <p className="mt-2.5 text-[13px] font-medium text-slate-500">Aucune activité récente</p>
        <p className="mt-0.5 text-[11px] text-slate-400">Les dernières actions apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="relative flex gap-2.5">
          <span className="relative flex w-3 shrink-0 justify-center">
            <span className={clsx('mt-1.5 h-2 w-2 rounded-full ring-4 ring-white', ACCENTS[accent])} />
            {index < items.length - 1 && (
              <span className="absolute bottom-[-0.75rem] top-3.5 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
            )}
          </span>
          <p className="min-w-0 break-words text-[13px] leading-relaxed text-slate-600">{item}</p>
        </li>
      ))}
    </ol>
  );
}
