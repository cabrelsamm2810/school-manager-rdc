'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS } from '@/lib/roles';
import { ECOLE_HISTORIQUE_ACTIONS, ECOLE_PROFIL_CHAMP_LABELS } from '@/lib/ecole-profil';
import { profilSectionClass, type EcoleHistoriqueEntry } from '@/components/ecoles/profil/types';

const ACTION_ICON: Record<string, string> = {
  CREATION: 'plus',
  MODIFICATION: 'edit',
  CHEF_ASSOCIE: 'user',
  CHEF_DISSOCIE: 'user',
  SECTION_AJOUT: 'organization',
  SECTION_MODIFICATION: 'organization',
  SECTION_SUPPRESSION: 'organization',
  QR_REGENERATION: 'qr',
};

function champLabel(champ: string): string {
  if (!champ) return '';
  return ECOLE_PROFIL_CHAMP_LABELS[champ]
    ?? ({ codeEcole: 'Code école', chefUserId: 'Chef d’établissement', qrToken: 'Jeton QR' } as Record<string, string>)[champ]
    ?? champ;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Historique des modifications administratives de l'école. */
export function EcoleProfilHistorique({ ecoleId }: { ecoleId: string }) {
  const [entries, setEntries] = useState<EcoleHistoriqueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    fetch(`/api/ecole-profil/historique?ecoleId=${encodeURIComponent(ecoleId)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error ?? 'Chargement impossible.');
        setEntries(json?.historique ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecoleId]);

  return (
    <div className={profilSectionClass}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Historique administratif</h3>
          <p className="text-[11px] text-slate-400">Traçabilité des modifications du profil de l’école.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          aria-label="Actualiser l’historique"
        >
          <Icon name="refresh" className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
          Aucune modification enregistrée.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-slate-200 pl-5">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                <Icon name={ACTION_ICON[entry.action] ?? 'clock'} className="h-3 w-3" />
              </span>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {ECOLE_HISTORIQUE_ACTIONS[entry.action] ?? entry.action}
                    {entry.champ && entry.action === 'MODIFICATION' && (
                      <span className="font-normal text-slate-500"> · {champLabel(entry.champ)}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatDate(entry.createdAt)}</p>
                </div>

                {entry.action === 'MODIFICATION' && (
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="text-slate-400 line-through">{entry.ancienneValeur || '—'}</span>
                    <span className="mx-1.5 text-slate-400">→</span>
                    <span className="font-medium text-slate-900">{entry.nouvelleValeur || '—'}</span>
                  </p>
                )}
                {(entry.action === 'SECTION_AJOUT' || entry.action === 'SECTION_MODIFICATION') && entry.nouvelleValeur && (
                  <p className="mt-1 text-xs text-slate-600">
                    {entry.champ && <span className="text-slate-400">{entry.champ} · </span>}
                    <span className="font-medium text-slate-900">{entry.nouvelleValeur}</span>
                  </p>
                )}
                {entry.action === 'SECTION_SUPPRESSION' && entry.ancienneValeur && (
                  <p className="mt-1 text-xs text-slate-600">
                    {entry.champ && <span className="text-slate-400">{entry.champ} · </span>}
                    <span className="text-slate-400 line-through">{entry.ancienneValeur}</span>
                  </p>
                )}
                {entry.action === 'CREATION' && entry.nouvelleValeur && (
                  <p className="mt-1 text-xs text-slate-600">
                    Code école : <span className="font-mono font-semibold text-slate-900">{entry.nouvelleValeur}</span>
                  </p>
                )}

                <p className="mt-1 text-[11px] text-slate-400">
                  {entry.userName || 'Système'}
                  {entry.userRole && ` · ${ROLE_LABELS[entry.userRole] ?? entry.userRole}`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
