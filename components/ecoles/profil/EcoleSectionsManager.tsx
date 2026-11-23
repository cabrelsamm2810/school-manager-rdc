'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CYCLES_RDC } from '@/lib/curriculum-rdc';
import {
  profilInputClass,
  profilLabelFieldClass,
  profilSectionClass,
  type EcoleSection,
} from '@/components/ecoles/profil/types';

const TYPE_META: Record<string, { label: string; hint: string; badge: string }> = {
  Section: { label: 'Sections', hint: 'Filières générales organisées', badge: 'bg-blue-50 text-blue-700' },
  Option: { label: 'Options', hint: 'Spécialités techniques organisées', badge: 'bg-purple-50 text-purple-700' },
};

/** Gestion des sections et options de l'école, regroupées par type. */
export function EcoleSectionsManager({
  ecoleId,
  sections,
  canEdit,
  onChanged,
}: {
  ecoleId: string;
  sections: EcoleSection[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [type, setType] = useState<'Section' | 'Option'>('Section');
  const [nom, setNom] = useState('');
  const [cycle, setCycle] = useState('');
  const [ordre, setOrdre] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function add() {
    if (!nom.trim()) {
      setError('Le nom de la section ou de l’option est obligatoire.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/ecole-profil/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ecoleId, type, nom: nom.trim(), cycle, ordre: Number(ordre || 0) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Ajout impossible.');
      } else {
        setNom('');
        setCycle('');
        setOrdre('0');
        onChanged();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(section: EcoleSection) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/ecole-profil/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: section.statut === 'Actif' ? 'Inactif' : 'Actif' }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? 'Modification impossible.');
      } else {
        onChanged();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(section: EcoleSection) {
    if (!confirm(`Supprimer « ${section.nom} » de cette école ?`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/ecole-profil/sections/${section.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? 'Suppression impossible.');
      } else {
        onChanged();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className={profilSectionClass}>
          <h3 className="mb-3 text-sm font-bold text-slate-900">Ajouter une section ou une option</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={profilLabelFieldClass}>Type</label>
              <select className={profilInputClass} value={type} onChange={(e) => setType(e.target.value as 'Section' | 'Option')}>
                <option value="Section">Section</option>
                <option value="Option">Option</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className={profilLabelFieldClass}>Nom</label>
              <input
                className={profilInputClass}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={type === 'Section' ? 'Ex. Scientifique' : 'Ex. Électricité'}
              />
            </div>
            <div>
              <label className={profilLabelFieldClass}>Cycle</label>
              <select className={profilInputClass} value={cycle} onChange={(e) => setCycle(e.target.value)}>
                <option value="">— Tous —</option>
                {CYCLES_RDC.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={profilLabelFieldClass}>Ordre</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  className={profilInputClass}
                  value={ordre}
                  onChange={(e) => setOrdre(e.target.value)}
                />
                <button
                  type="button"
                  onClick={add}
                  disabled={busy}
                  className="shrink-0 rounded-xl bg-brand-600 px-3 text-white transition hover:bg-brand-700 disabled:opacity-60"
                  aria-label="Ajouter"
                >
                  <Icon name="plus" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(['Section', 'Option'] as const).map((kind) => {
          const items = sections.filter((s) => s.type === kind);
          const meta = TYPE_META[kind];
          return (
            <div key={kind} className={profilSectionClass}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{meta.label}</h3>
                  <p className="text-[11px] text-slate-400">{meta.hint}</p>
                </div>
                <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                  Aucune {kind === 'Section' ? 'section' : 'option'} enregistrée.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((section) => (
                    <li
                      key={section.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${section.statut === 'Actif' ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                          {section.nom}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {section.cycle || 'Tous les cycles'}
                          {section.ordre > 0 && ` · ordre ${section.ordre}`}
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggle(section)}
                            disabled={busy}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-50"
                          >
                            {section.statut === 'Actif' ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(section)}
                            disabled={busy}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600 disabled:opacity-50"
                            aria-label={`Supprimer ${section.nom}`}
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
