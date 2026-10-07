'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { INSTITUTION_MAP, VALIDATION_STATUT_COLORS } from '@/lib/institutions';

/** Mapping statique des couleurs Tailwind pour les badges de statut. */
const STATUT_BADGE_CLASSES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

function StatutValidationBadge({ statutValidation }: { statutValidation: string }) {
  const sv = VALIDATION_STATUT_COLORS[statutValidation];
  const cls = sv ? STATUT_BADGE_CLASSES[sv.color] : 'bg-slate-100 text-slate-700';
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>
      {sv?.label || statutValidation}
    </span>
  );
}

type Ecole = {
  id: string;
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  telephone: string;
  email: string;
  chefEcole: string;
  logoUrl: string | null;
  identifiantSM: string | null;
  statut: string;
  statutValidation: string;
  createdAt: string;
  coordSousProvinciale?: { id: string; nom: string } | null;
};

type ActionDialog = {
  ecole: Ecole;
  action: 'valider' | 'rejeter';
};

export function EcolesEnAttente() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionDialog | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch les deux statuts "en attente" en parallèle
      const [res1, res2] = await Promise.all([
        fetch('/api/admin-smd/ecoles?statutValidation=' + encodeURIComponent('En attente de vérification') + '&pageSize=100'),
        fetch('/api/admin-smd/ecoles?statutValidation=' + encodeURIComponent('En cours de vérification') + '&pageSize=100'),
      ]);
      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      if (!res1.ok || !res2.ok) throw new Error('Erreur lors du chargement');
      const merged = [...(data1.ecoles ?? []), ...(data2.ecoles ?? [])];
      // Trier : plus récent d'abord
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEcoles(merged);
    } catch {
      setError('Impossible de charger les écoles en attente.');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openDialog(ecole: Ecole, action: 'valider' | 'rejeter') {
    setDialog({ ecole, action });
    setCommentaire('');
    setActionResult(null);
  }

  async function handleAction() {
    if (!dialog) return;
    setActionLoading(true);
    setActionResult(null);
    try {
      const res = await fetch(`/api/ecoles/${dialog.ecole.id}/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: dialog.action,
          commentaire: commentaire.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionResult({ type: 'error', message: data.error || 'Erreur lors de l\'action.' });
        return;
      }
      setActionResult({
        type: 'success',
        message: dialog.action === 'valider'
          ? `« ${dialog.ecole.nom} » a été validée avec succès.`
          : `« ${dialog.ecole.nom} » a été rejetée.`,
      });
      // Retirer l'école de la liste et fermer le dialogue après un court délai
      setEcoles((prev) => prev.filter((e) => e.id !== dialog.ecole.id));
      setTimeout(() => {
        setDialog(null);
        setActionResult(null);
        setCommentaire('');
      }, 1500);
    } catch {
      setActionResult({ type: 'error', message: 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setActionLoading(false);
    }
  }

  const enAttenteCount = ecoles.filter((e) => e.statutValidation === 'En attente de vérification').length;
  const enCoursCount = ecoles.filter((e) => e.statutValidation === 'En cours de vérification').length;

  return (
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">Écoles en attente de validation</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Validez ou rejetez les établissements soumis pour vérification
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Stats compactes */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-500">En attente</p>
            <p className="mt-0.5 text-lg font-bold text-amber-700">{enAttenteCount}</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-500">En cours de vérif.</p>
            <p className="mt-0.5 text-lg font-bold text-blue-700">{enCoursCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-500">Total à traiter</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{ecoles.length}</p>
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <Icon name="alert" className="mx-auto mb-2 h-8 w-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setRefreshKey((k) => k + 1)} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            Réessayer
          </button>
        </div>
      ) : ecoles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Icon name="check-circle" className="mx-auto mb-2 h-10 w-10 text-green-400" />
          <p className="text-sm font-medium text-slate-600">Aucune école en attente de validation.</p>
          <p className="mt-1 text-xs text-slate-400">Toutes les écoles soumises ont été traitées.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Établissement</th>
                    <th className="px-3 py-3">Province</th>
                    <th className="px-3 py-3">Commune</th>
                    <th className="px-3 py-3">Responsable</th>
                    <th className="px-3 py-3">Statut validation</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ecoles.map((et) => {
                    const inst = INSTITUTION_MAP[et.institution];
                    return (
                      <tr key={et.id} className="transition hover:bg-slate-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {et.logoUrl ? (
                              <img src={et.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                                {et.nom[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{et.nom}</p>
                              <p className="truncate text-xs text-slate-400">{et.identifiantSM || et.dinacope || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{et.province || '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{et.commune || '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{et.chefEcole || '—'}</td>
                        <td className="px-3 py-3">
                          <StatutValidationBadge statutValidation={et.statutValidation} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openDialog(et, 'valider')}
                              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                            >
                              <Icon name="check" className="h-3.5 w-3.5" />
                              Valider
                            </button>
                            <button
                              onClick={() => openDialog(et, 'rejeter')}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Icon name="close" className="h-3.5 w-3.5" />
                              Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 lg:hidden">
            {ecoles.map((et) => {
              const inst = INSTITUTION_MAP[et.institution];
              return (
                <div key={et.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {et.logoUrl ? (
                        <img src={et.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-400">
                          {et.nom[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{et.nom}</p>
                        <p className="truncate text-xs text-slate-400">{et.identifiantSM || et.dinacope || '—'}</p>
                      </div>
                    </div>
                    <StatutValidationBadge statutValidation={et.statutValidation} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
                      {inst?.label?.split('—')[0]?.trim() || et.institution}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.province || '—'}</span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.commune || '—'}</span>
                  </div>
                  {et.chefEcole && (
                    <p className="mt-2 text-xs text-slate-500">👤 {et.chefEcole}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openDialog(et, 'valider')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <Icon name="check" className="h-4 w-4" />
                      Valider
                    </button>
                    <button
                      onClick={() => openDialog(et, 'rejeter')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Icon name="close" className="h-4 w-4" />
                      Rejeter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Dialogue d'action ── */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !actionLoading && setDialog(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dialog.action === 'valider' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Icon name={dialog.action === 'valider' ? 'check-circle' : 'alert'} className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {dialog.action === 'valider' ? 'Valider l\'école' : 'Rejeter l\'école'}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {dialog.action === 'valider'
                    ? `Confirmez la validation de « ${dialog.ecole.nom} ». L'école sera marquée comme active.`
                    : `Confirmez le rejet de « ${dialog.ecole.nom} ». L'école restera en statut rejeté.`}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Commentaire {dialog.action === 'rejeter' ? '(recommandé)' : '(optionnel)'}
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder={dialog.action === 'rejeter' ? 'Motif du rejet…' : 'Note interne…'}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={actionLoading}
              />
            </div>

            {actionResult && (
              <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${actionResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {actionResult.message}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDialog(null)}
                disabled={actionLoading}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  dialog.action === 'valider' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {dialog.action === 'valider' ? 'Valider' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
