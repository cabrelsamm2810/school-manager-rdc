'use client';

import { useEffect, useState } from 'react';
import { PROFIL_ECOLE_SECTIONS, humanitesOptions } from '@/lib/meta-data';

type Props = {
  open: boolean;
  initialSections: string[];
  initialOptions: string[];
  onSave: (sections: string[], options: string[]) => void;
  onClose: () => void;
};

const SECTION_HINTS: Record<string, string> = {
  Maternelle: 'Petite, moyenne et grande section',
  Primaire: '1ère à 6ème année',
  Secondaire: '7ème et 8ème année (CTEB)',
  Humanités: '1ère à 4ème humanités',
};

/**
 * Fenêtre « Configurer les sections et options » du profil de l'école.
 * Le nombre de sections est calculé à partir des sections cochées.
 */
export function SectionsOptionsModal({ open, initialSections, initialOptions, onSave, onClose }: Props) {
  const [sections, setSections] = useState<string[]>(initialSections);
  const [options, setOptions] = useState<string[]>(initialOptions);

  // Réinitialiser la sélection à chaque ouverture.
  useEffect(() => {
    if (open) {
      setSections(initialSections);
      setOptions(initialOptions);
    }
  }, [open, initialSections, initialOptions]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const humanitesSelected = sections.includes('Humanités');

  function toggleSection(section: string) {
    setSections((prev) => {
      const next = prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section];
      if (!next.includes('Humanités')) setOptions([]);
      return next;
    });
  }

  function toggleOption(option: string) {
    setOptions((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sections-modal-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="sections-modal-title" className="text-base font-bold text-slate-900">
              Configurer les sections et options
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Sélectionnez les sections organisées par l&apos;établissement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {PROFIL_ECOLE_SECTIONS.map((section) => {
              const active = sections.includes(section);
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => toggleSection(section)}
                  aria-pressed={active}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition ${
                    active
                      ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                      active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{section}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{SECTION_HINTS[section]}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {humanitesSelected && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-800">Options des humanités</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Sélectionnez les options organisées par l&apos;établissement.
              </p>
              <div className="mt-3 space-y-3">
                {humanitesOptions.map((groupe) => (
                  <div key={groupe.filiere}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{groupe.filiere}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupe.options.map((option) => {
                        const active = options.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            aria-pressed={active}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{sections.length}</span> section(s) sélectionnée(s)
            {humanitesSelected && (
              <>
                {' · '}
                <span className="font-semibold text-slate-900">{options.length}</span> option(s) des humanités
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(sections, humanitesSelected ? options : [])}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Enregistrer la configuration
          </button>
        </div>
      </div>
    </div>
  );
}
