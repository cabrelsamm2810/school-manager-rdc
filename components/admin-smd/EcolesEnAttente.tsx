'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
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

/** Bordure gauche colorée selon le statut — indicateur visuel rapide. */
const STATUT_BORDER_CLASSES: Record<string, string> = {
  amber: 'border-l-amber-400',
  blue: 'border-l-blue-400',
  green: 'border-l-green-400',
  red: 'border-l-red-400',
  purple: 'border-l-purple-400',
  slate: 'border-l-slate-300',
};

/** Icône associée à chaque statut. */
const STATUT_ICON: Record<string, string> = {
  amber: 'clock',
  blue: 'activity',
  green: 'check-circle',
  red: 'x-circle',
  purple: 'alert',
  slate: 'document',
};

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
  _count?: { documents: number };
};

type ActionDialog = {
  ecole: Ecole;
  action: 'valider' | 'rejeter';
};

type StatutFilter = 'tous' | 'En attente de vérification' | 'En cours de vérification';

const STATUT_FILTERS: { key: StatutFilter; label: string; icon: string }[] = [
  { key: 'tous', label: 'Tous', icon: 'folder' },
  { key: 'En attente de vérification', label: 'En attente', icon: 'clock' },
  { key: 'En cours de vérification', label: 'En cours', icon: 'activity' },
];

function StatutValidationBadge({ statutValidation }: { statutValidation: string }) {
  const sv = VALIDATION_STATUT_COLORS[statutValidation];
  const cls = sv ? STATUT_BADGE_CLASSES[sv.color] : 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>
      {sv && <Icon name={STATUT_ICON[sv.color] || 'document'} className="h-3 w-3" />}
      {sv?.label || statutValidation}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function EcolesEnAttente() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionDialog | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Filtres & recherche ──
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ecoles-en-attente');
      const data = await res.json();
      if (!res.ok) throw new Error('Erreur lors du chargement');
      setEcoles(data.ecoles ?? []);
    } catch {
      setError('Impossible de charger les écoles en attente.');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Liste filtrée ──
  const filteredEcoles = useMemo(() => {
    let list = ecoles;
    if (statutFilter !== 'tous') {
      list = list.filter((e) => e.statutValidation === statutFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.nom.toLowerCase().includes(q) ||
          (e.identifiantSM ?? '').toLowerCase().includes(q) ||
          (e.dinacope ?? '').toLowerCase().includes(q) ||
          (e.commune ?? '').toLowerCase().includes(q) ||
          (e.province ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [ecoles, statutFilter, search]);

  // ── Navigation entre dossiers ──
  const expandedIndex = useMemo(
    () => filteredEcoles.findIndex((e) => e.id === expandedId),
    [filteredEcoles, expandedId],
  );

  function navigateDetail(direction: 'prev' | 'next') {
    if (expandedIndex < 0) return;
    const newIndex = direction === 'prev' ? expandedIndex - 1 : expandedIndex + 1;
    if (newIndex >= 0 && newIndex < filteredEcoles.length) {
      setExpandedId(filteredEcoles[newIndex].id);
    }
  }

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
  const totalDocs = ecoles.reduce((sum, e) => sum + (e._count?.documents ?? 0), 0);

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
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Icon name="clock" className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-xs font-medium text-slate-500">En attente</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-amber-700">{enAttenteCount}</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Icon name="activity" className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-xs font-medium text-slate-500">En cours</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-blue-700">{enCoursCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Icon name="folder" className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs font-medium text-slate-500">À traiter</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{ecoles.length}</p>
          </div>
          <div className="rounded-xl bg-green-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Icon name="document" className="h-3.5 w-3.5 text-green-500" />
              <p className="text-xs font-medium text-slate-500">Documents</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-green-700">{totalDocs}</p>
          </div>
        </div>
      </div>

      {/* ── Barre de recherche + filtres ── */}
      {!loading && !error && ecoles.length > 0 && (
        <div className="space-y-2.5">
          {/* Recherche */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, identifiant, commune, province…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filtres par statut */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUT_FILTERS.map((f) => {
              const count = f.key === 'tous' ? ecoles.length : ecoles.filter((e) => e.statutValidation === f.key).length;
              const active = statutFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setStatutFilter(f.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon name={f.icon} className="h-3.5 w-3.5" />
                  {f.label}
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
      ) : filteredEcoles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Icon name="check-circle" className="mx-auto mb-2 h-10 w-10 text-green-400" />
          <p className="text-sm font-medium text-slate-600">
            {ecoles.length === 0
              ? 'Aucune école en attente de validation.'
              : 'Aucune école ne correspond à votre recherche.'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {ecoles.length === 0 ? 'Toutes les écoles soumises ont été traitées.' : 'Modifiez vos critères de recherche.'}
          </p>
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
                    <th className="px-3 py-3 text-center">Docs</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEcoles.map((et) => {
                    const inst = INSTITUTION_MAP[et.institution];
                    const sv = VALIDATION_STATUT_COLORS[et.statutValidation];
                    const borderCls = sv ? STATUT_BORDER_CLASSES[sv.color] : 'border-l-slate-300';
                    const docCount = et._count?.documents ?? 0;
                    const isExpanded = expandedId === et.id;
                    return (
                      <Fragment key={et.id}>
                        <tr
                          className={`border-l-4 transition hover:bg-slate-50 ${borderCls} ${isExpanded ? 'bg-blue-50/50' : ''}`}
                        >
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
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : et.id)}
                                className="ml-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                title={isExpanded ? 'Réduire' : 'Voir les détails'}
                              >
                                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{et.province || '—'}</td>
                          <td className="px-3 py-3 text-slate-600">{et.commune || '—'}</td>
                          <td className="px-3 py-3 text-slate-600">{et.chefEcole || '—'}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${docCount > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                              <Icon name="paperclip" className="h-3 w-3" />
                              {docCount}
                            </span>
                          </td>
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
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={7} className="px-4 py-4">
                              <EcoleDetailPanel
                                ecole={et}
                                expandedIndex={expandedIndex}
                                total={filteredEcoles.length}
                                onNavigate={navigateDetail}
                                onValider={() => openDialog(et, 'valider')}
                                onRejeter={() => openDialog(et, 'rejeter')}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 lg:hidden">
            {filteredEcoles.map((et, idx) => {
              const inst = INSTITUTION_MAP[et.institution];
              const sv = VALIDATION_STATUT_COLORS[et.statutValidation];
              const borderCls = sv ? STATUT_BORDER_CLASSES[sv.color] : 'border-l-slate-300';
              const docCount = et._count?.documents ?? 0;
              const isExpanded = expandedId === et.id;
              return (
                <div
                  key={et.id}
                  className={`rounded-2xl border border-slate-200 border-l-4 bg-white shadow-sm transition ${borderCls} ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}
                >
                  <div className="p-3.5">
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
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
                        {inst?.label?.split('—')[0]?.trim() || et.institution}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.province || '—'}</span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.commune || '—'}</span>
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${docCount > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        <Icon name="paperclip" className="h-3 w-3" />
                        {docCount} doc{docCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    {et.chefEcole && (
                      <p className="mt-2 text-xs text-slate-500">
                        <Icon name="user" className="mr-1 inline h-3 w-3" />
                        {et.chefEcole}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : et.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} className="h-4 w-4" />
                        {isExpanded ? 'Réduire' : 'Détails'}
                      </button>
                      <button
                        onClick={() => openDialog(et, 'valider')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        <Icon name="check" className="h-4 w-4" />
                        Valider
                      </button>
                      <button
                        onClick={() => openDialog(et, 'rejeter')}
                        className="flex items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/80 p-3.5">
                      <EcoleDetailPanel
                        ecole={et}
                        expandedIndex={filteredEcoles.findIndex((e) => e.id === et.id)}
                        total={filteredEcoles.length}
                        onNavigate={navigateDetail}
                        onValider={() => openDialog(et, 'valider')}
                        onRejeter={() => openDialog(et, 'rejeter')}
                      />
                    </div>
                  )}
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

/* ── Panneau de détail dépliable ── */
function EcoleDetailPanel({
  ecole,
  expandedIndex,
  total,
  onNavigate,
  onValider,
  onRejeter,
}: {
  ecole: Ecole;
  expandedIndex: number;
  total: number;
  onNavigate: (dir: 'prev' | 'next') => void;
  onValider: () => void;
  onRejeter: () => void;
}) {
  const inst = INSTITUTION_MAP[ecole.institution];
  const docCount = ecole._count?.documents ?? 0;
  const hasPrev = expandedIndex > 0;
  const hasNext = expandedIndex >= 0 && expandedIndex < total - 1;

  const detailRows = [
    { icon: 'region', label: 'Province', value: ecole.province || '—' },
    { icon: 'map', label: 'Prov. éducationnelle', value: ecole.provinceEducationnelle || '—' },
    { icon: 'location', label: 'Commune', value: ecole.commune || '—' },
    { icon: 'location', label: 'Ville', value: ecole.ville || '—' },
    { icon: 'user', label: 'Chef d\'établissement', value: ecole.chefEcole || '—' },
    { icon: 'phone', label: 'Téléphone', value: ecole.telephone || '—' },
    { icon: 'document', label: 'Identifiant SM', value: ecole.identifiantSM || '—' },
    { icon: 'badge', label: 'DINACOPE', value: ecole.dinacope || '—' },
    { icon: 'calendar', label: 'Soumis le', value: formatDate(ecole.createdAt) },
    { icon: 'organization', label: 'Coord. SP', value: ecole.coordSousProvinciale?.nom || '—' },
  ];

  return (
    <div className="space-y-3">
      {/* Navigation entre dossiers */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Dossier {expandedIndex + 1} / {total}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!hasPrev}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon name="chevron-left" className="h-3.5 w-3.5" />
            Précédent
          </button>
          <button
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Suivant
            <Icon name="chevron-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <Icon name={row.icon} className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="text-xs text-slate-500">{row.label}:</span>
            <span className="truncate text-xs font-medium text-slate-700">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Indicateur documents */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
        <Icon name="paperclip" className="h-4 w-4 text-slate-500" />
        <span className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{docCount}</span> document{docCount > 1 ? 's' : ''} justificatif{docCount > 1 ? 's' : ''} soumis{docCount > 1 ? 's' : ''}
        </span>
        {docCount === 0 && (
          <span className="ml-auto text-xs font-medium text-amber-600">Aucun document</span>
        )}
      </div>

      {/* Institution */}
      <div className="flex items-center gap-2">
        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
          {inst?.label || ecole.institution}
        </span>
      </div>

      {/* Actions rapides */}
      <div className="flex gap-2 border-t border-slate-200 pt-3">
        <button
          onClick={onValider}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <Icon name="check" className="h-4 w-4" />
          Valider ce dossier
        </button>
        <button
          onClick={onRejeter}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Icon name="close" className="h-4 w-4" />
          Rejeter
        </button>
      </div>
    </div>
  );
}
