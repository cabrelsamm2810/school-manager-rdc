'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Liste exhaustive des niveaux scolaires disponibles.
 * Inclut les options existantes (Primaire, Secondaire, Supérieur, Professionnel)
 * et les niveaux demandés (Maternelle, Humanités, Technique / Professionnel).
 * Aucune option existante n'a été supprimée.
 */
export const NIVEAUX_SCOLAIRES: string[] = [
  'Maternelle',
  'Primaire',
  'Secondaire',
  'Humanités',
  'Supérieur',
  'Professionnel',
  'Technique / Professionnel',
];

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function NiveauScolaireSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = NIVEAUX_SCOLAIRES.length;
  const selectedLabel = value || `Niveau scolaire (${count})`;

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-blue-500 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
      >
        <span className="flex items-center gap-2 truncate">
          {value && (
            <svg className="h-4 w-4 flex-shrink-0 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-blue-100 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-blue-200 bg-white shadow-lg shadow-blue-900/10">
          {/* Header */}
          <div className="border-b border-slate-100 bg-blue-50/60 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Niveau scolaire ({count})
            </span>
          </div>

          {/* Options — scrollable on mobile */}
          <div className="max-h-72 overflow-y-auto py-1">
            {/* Clear / all */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                value === '' ? 'font-semibold text-blue-700' : 'text-slate-600'
              }`}
            >
              <span>Tous les niveaux</span>
              {value === '' && <CheckIcon />}
            </button>

            <div className="my-1 border-t border-slate-100" />

            {NIVEAUX_SCOLAIRES.map((niveau) => {
              const isActive = value === niveau;
              return (
                <button
                  key={niveau}
                  type="button"
                  onClick={() => { onChange(niveau); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                    isActive ? 'font-semibold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span>{niveau}</span>
                  {isActive && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
