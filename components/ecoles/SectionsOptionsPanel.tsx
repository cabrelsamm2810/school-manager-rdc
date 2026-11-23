'use client';

import { useCallback, useEffect, useState } from 'react';
import { SECTIONS_SCOLAIRES } from '@/lib/ecole-sections';

type Option = { id: string; nom: string; statut: string };
type Section = { id: string; nom: string; statut: string; options: Option[] };

/**
 * Configuration des sections et options d'un établissement.
 * Chaque section et chaque option est rattachée à l'école par son identifiant ;
 * une option est toujours liée à une section. Les doublons sont refusés
 * côté client et côté API (409).
 */
export function SectionsOptionsPanel({ ecoleId, canEdit }: { ecoleId: string; canEdit: boolean }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newOption, setNewOption] = useState<Record<string, string>>({});
  const [renaming, setRenaming] = useState<{ id: string; nom: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ecoles/${ecoleId}/sections`);
      const data = await res.json();
      if (res.ok) setSections(data.sections ?? []);
    } catch {
      setError('Impossible de charger les sections.');
    } finally {
      setLoading(false);
    }
  }, [ecoleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Opération impossible.');
        return false;
      }
      await load();
      return true;
    } catch {
      setError('Impossible de joindre le serveur.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function addSection(nom: string) {
    if (sections.some((s) => s.nom.toLowerCase() === nom.toLowerCase())) {
      setError(`La section « ${nom} » est déjà configurée.`);
      return;
    }
    call(`/api/ecoles/${ecoleId}/sections`, 'POST', { nom });
  }

  function removeSection(section: Section) {
    call(`/api/ecoles/${ecoleId}/sections/${section.id}`, 'DELETE');
  }

  function addOption(section: Section) {
    const nom = (newOption[section.id] ?? '').trim();
    if (nom.length < 2) return;
    if (section.options.some((o) => o.nom.toLowerCase() === nom.toLowerCase())) {
      setError(`L'option « ${nom} » existe déjà dans la section ${section.nom}.`);
      return;
    }
    call(`/api/ecoles/${ecoleId}/sections/${section.id}/options`, 'POST', { nom }).then((ok) => {
      if (ok) setNewOption((current) => ({ ...current, [section.id]: '' }));
    });
  }

  function renameOption(section: Section, option: Option) {
    const nom = renaming?.nom.trim() ?? '';
    if (!nom || nom.toLowerCase() === option.nom.toLowerCase()) {
      setRenaming(null);
      return;
    }
    call(`/api/ecoles/${ecoleId}/sections/${section.id}/options/${option.id}`, 'PATCH', { nom }).then((ok) => {
      if (ok) setRenaming(null);
    });
  }

  function removeOption(section: Section, option: Option) {
    call(`/api/ecoles/${ecoleId}/sections/${section.id}/options/${option.id}`, 'DELETE');
  }

  const activeSections = sections.filter((s) => s.statut === 'Actif');
  const nbOptionsActives = activeSections.reduce(
    (total, s) => total + s.options.filter((o) => o.statut === 'Actif').length,
    0,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Sections & options</h3>
        <div className="flex gap-2 text-xs">
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
            {activeSections.length} section{activeSections.length > 1 ? 's' : ''} active{activeSections.length > 1 ? 's' : ''}
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            {nbOptionsActives} option{nbOptionsActives > 1 ? 's' : ''} active{nbOptionsActives > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Sélectionnez les sections que l&apos;établissement organise. Les modules d&apos;inscription, de classes,
        d&apos;enseignants et de bulletins ne proposeront que ces sections et leurs options.
      </p>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="py-4 text-sm text-slate-500">Chargement…</p>
      ) : (
        <>
          {/* Choix des sections */}
          <div className="flex flex-wrap gap-2">
            {SECTIONS_SCOLAIRES.map((nom) => {
              const configured = activeSections.find((s) => s.nom === nom);
              return (
                <button
                  key={nom}
                  type="button"
                  disabled={!canEdit || busy}
                  onClick={() => (configured ? removeSection(configured) : addSection(nom))}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    configured
                      ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {configured ? `✓ ${nom}` : `+ ${nom}`}
                </button>
              );
            })}
          </div>

          {/* Options par section */}
          {activeSections.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Aucune section configurée. Ajoutez au moins une section organisée par l&apos;établissement.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {activeSections.map((section) => {
                const options = section.options.filter((o) => o.statut === 'Actif');
                return (
                  <div key={section.id} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {section.nom}
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {options.length} option{options.length > 1 ? 's' : ''}
                        </span>
                      </p>
                      {canEdit && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeSection(section)}
                          className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                        >
                          Retirer la section
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.length === 0 && (
                        <span className="text-xs text-slate-400">Aucune option organisée dans cette section.</span>
                      )}
                      {options.map((option) => (
                        <span
                          key={option.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {renaming?.id === option.id ? (
                            <>
                              <input
                                value={renaming.nom}
                                onChange={(e) => setRenaming({ id: option.id, nom: e.target.value })}
                                className="w-32 rounded border border-slate-300 px-1.5 py-0.5 text-xs outline-none focus:border-blue-500"
                                autoFocus
                              />
                              <button type="button" onClick={() => renameOption(section, option)} className="text-blue-600">
                                OK
                              </button>
                              <button type="button" onClick={() => setRenaming(null)} className="text-slate-500">
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              {option.nom}
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setRenaming({ id: option.id, nom: option.nom })}
                                    className="text-slate-400 transition hover:text-blue-600"
                                    aria-label={`Modifier ${option.nom}`}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => removeOption(section, option)}
                                    className="text-slate-400 transition hover:text-red-600 disabled:opacity-50"
                                    aria-label={`Supprimer ${option.nom}`}
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </span>
                      ))}
                    </div>

                    {canEdit && (
                      <div className="mt-2.5 flex gap-2">
                        <input
                          value={newOption[section.id] ?? ''}
                          onChange={(e) => setNewOption((current) => ({ ...current, [section.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOption(section);
                            }
                          }}
                          placeholder={
                            section.nom === 'Humanités'
                              ? 'Option des Humanités (ex. Sciences, Latin-Philosophie…)'
                              : 'Nouvelle option…'
                          }
                          className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          disabled={busy || (newOption[section.id] ?? '').trim().length < 2}
                          onClick={() => addOption(section)}
                          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          Ajouter
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
