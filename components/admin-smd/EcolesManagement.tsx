'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { EcoleDetailPanel } from '@/components/admin-smd/EcoleDetailPanel';
import { INSTITUTION_MAP } from '@/lib/institutions';
import { PROVINCES_EDUC_BY_ADMIN } from '@/lib/provinces-rdc';

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
  adresse: string;
  telephone: string;
  email: string;
  chefEcole: string;
  logoUrl: string | null;
  identifiantSM: string | null;
  effectif: number;
  statut: string;
  statutValidation: string;
  createdAt: string;
  coordSousProvinciale?: { id: string; nom: string } | null;
  ecErc?: { id: string; nom: string } | null;
  _count?: { eleves: number; enseignants: number; users: number };
};

type Stats = {
  total: number;
  actifs: number;
  enAttente: number;
  suspendus: number;
  byProvince: { province: string; count: number }[];
  byType: { type: string; count: number }[];
  byInstitution: { institution: string; count: number }[];
};

type Filters = {
  provinces: string[];
  provincesEducationnelles: string[];
  institutions: { code: string; label: string }[];
};

const NIVEAUX = ['Maternelle', 'Primaire', 'Secondaire', 'Humanités', 'Supérieur', 'Professionnel', 'Technique / Professionnel'];
const STATUTS = ['Actif', 'En attente', 'Suspendu', 'Inactif'];

export function EcolesManagement() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [provinceEducFilter, setProvinceEducFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterData, setFilterData] = useState<Filters | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: string; ecole: Ecole } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const pageSize = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statutFilter) params.set('statut', statutFilter);
      if (provinceFilter) params.set('province', provinceFilter);
      if (provinceEducFilter) params.set('provinceEducationnelle', provinceEducFilter);
      if (niveauFilter) params.set('niveau', niveauFilter);
      if (institutionFilter) params.set('institution', institutionFilter);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/admin-smd/ecoles?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEcoles(data.ecoles ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setStats(data.stats ?? null);
        setFilterData(data.filters ?? null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statutFilter, provinceFilter, provinceEducFilter, niveauFilter, institutionFilter, page, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statutFilter, provinceFilter, provinceEducFilter, niveauFilter, institutionFilter]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  async function handleAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin-smd/ecoles/${confirmAction.ecole.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmAction.action }),
      });
      if (res.ok) {
        setConfirmAction(null);
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }

  const actionLabels: Record<string, { title: string; message: string; confirm: string; danger?: boolean }> = {
    validate: { title: 'Valider l\'établissement', message: 'Voulez-vous vraiment valider cet établissement ?', confirm: 'Valider' },
    suspend: { title: 'Suspendre l\'établissement', message: 'Voulez-vous vraiment suspendre cet établissement ?', confirm: 'Suspendre', danger: true },
    reactivate: { title: 'Réactiver l\'établissement', message: 'Voulez-vous vraiment réactiver cet établissement ?', confirm: 'Réactiver' },
    deactivate: { title: 'Désactiver l\'établissement', message: 'Voulez-vous vraiment désactiver cet établissement ?', confirm: 'Désactiver', danger: true },
  };

  if (selectedId) {
    return (
      <EcoleDetailPanel
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onAction={(action, ecole) => setConfirmAction({ action, ecole })}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* ── En-tête professionnel ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">Gestion des établissements</h1>
            <p className="mt-0.5 text-xs text-slate-500">Supervision des établissements scolaires — Admin School Manager RDC</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch((s) => !s)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Icon name="search" className="h-4 w-4" />
              <span className="hidden sm:inline">Rechercher</span>
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Stats compactes */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBox label="Total" value={stats?.total ?? '—'} color="text-slate-900" bg="bg-slate-50" />
          <StatBox label="Actifs" value={stats?.actifs ?? '—'} color="text-green-700" bg="bg-green-50" />
          <StatBox label="En attente" value={stats?.enAttente ?? '—'} color="text-amber-700" bg="bg-amber-50" />
          <StatBox label="Suspendus" value={stats?.suspendus ?? '—'} color="text-red-700" bg="bg-red-50" />
        </div>
      </div>

      {/* ── Barre de recherche ── */}
      {showSearch && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, DINACOPE, adresse, commune, ville, province, responsable, téléphone, e-mail…"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter}
            options={filterData ? [...new Set([...filterData.institutions.map(i => i.code), ...NIVEAUX])] : NIVEAUX} />
          <FilterSelect label="Statut" value={statutFilter} onChange={setStatutFilter} options={STATUTS} />
          <FilterSelect label="Province" value={provinceFilter}
            onChange={(v) => { setProvinceFilter(v); setProvinceEducFilter(''); }}
            options={filterData?.provinces ?? []} />
          {/* Cascade : la province éducationnelle suit la province choisie */}
          <FilterSelect label="Province éduc." value={provinceEducFilter} onChange={setProvinceEducFilter}
            options={provinceFilter
              ? (PROVINCES_EDUC_BY_ADMIN[provinceFilter] ?? []).map((pe) => pe.nom)
              : filterData?.provincesEducationnelles ?? []} />
          <FilterSelect label="Niveau" value={niveauFilter} onChange={setNiveauFilter} options={NIVEAUX} />
          <FilterSelect label="Institution" value={institutionFilter} onChange={setInstitutionFilter}
            options={filterData?.institutions.map((i) => i.code) ?? []} labels={filterData?.institutions} />
        </div>
        {(typeFilter || statutFilter || provinceFilter || provinceEducFilter || niveauFilter || institutionFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setStatutFilter(''); setProvinceFilter(''); setProvinceEducFilter(''); setNiveauFilter(''); setInstitutionFilter(''); }}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            ✕ Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      ) : ecoles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Aucun établissement trouvé.</p>
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
                    <th className="px-3 py-3">DINACOPE</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Province</th>
                    <th className="px-3 py-3">Prov. éduc.</th>
                    <th className="px-3 py-3">Commune</th>
                    <th className="px-3 py-3">Responsable</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ecoles.map((et) => {
                    const inst = INSTITUTION_MAP[et.institution];
                    return (
                      <tr key={et.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => setSelectedId(et.id)}>
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
                              <p className="truncate text-xs text-slate-400">{et.identifiantSM || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">{et.dinacope || '—'}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
                            {inst?.label?.split('—')[0]?.trim() || et.institution}
                          </span>
                          {et.type && <span className="ml-1 text-xs text-slate-500">{et.type}</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{et.province || '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{et.provinceEducationnelle || '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{et.commune || '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{et.chefEcole || '—'}</td>
                        <td className="px-3 py-3"><StatutBadge statut={et.statut} /></td>
                        <td className="px-3 py-3 text-xs text-slate-500">{new Date(et.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setSelectedId(et.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50">Consulter</button>
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
                <div key={et.id} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition active:bg-slate-50" onClick={() => setSelectedId(et.id)}>
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
                        <p className="truncate text-xs text-slate-400">{et.dinacope || 'DINACOPE —'} · {et.identifiantSM || ''}</p>
                      </div>
                    </div>
                    <StatutBadge statut={et.statut} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
                      {inst?.label?.split('—')[0]?.trim() || et.institution}
                    </span>
                    {et.type && <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.type}</span>}
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.province || '—'}</span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.commune || '—'}</span>
                  </div>
                  {(et.chefEcole || et.telephone) && (
                    <p className="mt-2 text-xs text-slate-500">
                      {et.chefEcole && `👤 ${et.chefEcole}`}
                      {et.chefEcole && et.telephone && ' · '}
                      {et.telephone && `📞 ${et.telephone}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-500">
                {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} sur {total}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <span className="flex items-center px-2 text-xs font-medium text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Dialogue de confirmation ── */}
      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          title={actionLabels[confirmAction.action]?.title ?? 'Confirmer'}
          message={actionLabels[confirmAction.action]?.message ?? 'Confirmer cette action ?'}
          confirmLabel={actionLabels[confirmAction.action]?.confirm ?? 'Confirmer'}
          danger={actionLabels[confirmAction.action]?.danger}
          onConfirm={handleAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// ── Sous-composants ──

function StatBox({ label, value, color, bg }: { label: string; value: number | string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl ${bg} px-3 py-2.5`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, labels }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: { code: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Tous</option>
        {options.map((opt) => {
          const label = labels?.find((l) => l.code === opt)?.label ?? opt;
          return <option key={opt} value={opt}>{label}</option>;
        })}
      </select>
    </div>
  );
}
