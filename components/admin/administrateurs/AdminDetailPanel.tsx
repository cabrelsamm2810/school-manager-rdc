'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

type HistoryEntry = {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  result: string;
  details: string;
  createdAt: string;
};

type Detail = {
  id: string;
  email: string;
  nom: string;
  postNom: string;
  prenom: string;
  telephone: string;
  statut: string;
  statutPrevu: string;
  createdAt: string;
  revokedAt: string | null;
  user: { id: string; email: string; isActive: boolean; userStatus: string; createdAt: string } | null;
  createdBy: { nom: string; prenom: string } | null;
};

const STATUS_BADGE: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  COMPTE_CREE: 'bg-green-100 text-green-700',
  REVOQUE: 'bg-red-100 text-red-700',
};

export const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  COMPTE_CREE: 'Compte créé',
  REVOQUE: 'Révoqué',
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Panneau de détail d'un administrateur préenregistré : identité, autorisation,
 * compte lié et historique des activités (journal d'audit).
 */
export function AdminDetailPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { setDetail(null); setHistory([]); return; }
    let active = true;
    setLoading(true);
    setError('');
    fetch(`/api/admin/administrateurs/${id}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? 'Impossible de charger le dossier.');
        return data;
      })
      .then((data) => {
        if (!active) return;
        setDetail(data.administrateur);
        setHistory(data.history ?? []);
      })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Fiche administrateur</p>
            <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
              {detail ? `${detail.prenom} ${detail.nom}` : 'Chargement…'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && <div className="py-10 text-center text-sm text-slate-500">Chargement du dossier…</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {detail && (
            <>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Autorisation</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[detail.statut] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUT_LABELS[detail.statut] ?? detail.statut}
                  </span>
                </div>
                <dl className="space-y-2 text-sm">
                  {[
                    { label: 'Adresse Gmail', value: detail.email },
                    { label: 'Post-nom', value: detail.postNom || '—' },
                    { label: 'Téléphone', value: detail.telephone || '—' },
                    { label: 'Rôle', value: 'Admin School Manager RDC' },
                    { label: 'Activation prévue', value: detail.statutPrevu === 'INACTIF' ? 'Inactive (activation manuelle)' : 'Active après vérification' },
                    { label: 'Préenregistré le', value: formatDateTime(detail.createdAt) },
                    { label: 'Préenregistré par', value: detail.createdBy ? `${detail.createdBy.prenom} ${detail.createdBy.nom}` : '—' },
                    ...(detail.revokedAt ? [{ label: 'Révoqué le', value: formatDateTime(detail.revokedAt) }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <dt className="text-slate-500">{row.label}</dt>
                      <dd className="max-w-[60%] break-words text-right font-medium text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Compte lié</p>
                {detail.user ? (
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Statut du compte</dt>
                      <dd className="font-medium text-slate-900">{detail.user.isActive ? 'Actif' : detail.user.userStatus}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Compte créé le</dt>
                      <dd className="font-medium text-slate-900">{formatDateTime(detail.user.createdAt)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">Aucun compte n’a encore été créé avec cette adresse.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Historique des activités</p>
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune activité enregistrée.</p>
                ) : (
                  <ol className="space-y-3">
                    {history.map((entry) => (
                      <li key={entry.id} className="border-l-2 border-blue-200 pl-3">
                        <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)} · {entry.userName || 'Système'}</p>
                        {entry.details && <p className="mt-1 text-xs text-slate-600">{entry.details}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
