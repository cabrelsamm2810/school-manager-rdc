'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/ui/Icon';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { ImportDialog } from '@/components/import/ImportDialog';
import { OcrEcolesImportDialog } from '@/components/import/OcrEcolesImportDialog';
import { TxtImportDialog } from '@/components/import/TxtImportDialog';
import { EcoleForm, emptyForm, type EcoleFormData } from '@/components/ecoles/EcoleForm';
import { EcoleFiche } from '@/components/ecoles/EcoleFiche';
import { NiveauScolaireSelector } from '@/components/ecoles/NiveauScolaireSelector';
import { INSTITUTIONS, INSTITUTION_MAP, VALIDATION_STATUTS } from '@/lib/institutions';
import { PROVINCE_NAMES, PROVINCES_EDUC_BY_ADMIN } from '@/lib/provinces-rdc';
import { getCommunesForProvinceEduc } from '@/lib/communes-rdc';

type Ecole = {
  id: string;
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  commune: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  chefEcole: string;
  identifiantSM: string | null;
  effectif: number;
  statut: string;
  statutValidation: string;
  coordSousProvincialeId: string | null;
  coordSousProvinciale?: { id: string; nom: string } | null;
  ecErcId: string | null;
  ecErc?: { id: string; nom: string } | null;
  _count?: { documents: number; validationLogs: number };
};

type View = 'list' | 'form' | 'fiche';
type TabView = 'liste' | 'carte';

export default function EcolesPage() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [provinceEducFilter, setProvinceEducFilter] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [view, setView] = useState<View>('list');
  const [tabView, setTabView] = useState<TabView>('liste');
  const [showFilters, setShowFilters] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ficheId, setFicheId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [showTxtImport, setShowTxtImport] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<EcoleFormData> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (provinceFilter) params.set('province', provinceFilter);
      if (provinceEducFilter) params.set('provinceEducationnelle', provinceEducFilter);
      if (communeFilter) params.set('commune', communeFilter);
      if (institutionFilter) params.set('institution', institutionFilter);
      if (statutFilter) params.set('statutValidation', statutFilter);
      const res = await fetch(`/api/ecoles?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setEcoles(data.ecoles ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, provinceFilter, provinceEducFilter, communeFilter, institutionFilter, statutFilter]);

  function startCreate() {
    setEditingId(null);
    setInitialFormData(null);
    setView('form');
  }

  function startEdit(et: Ecole) {
    setEditingId(et.id);
    setInitialFormData({
      nom: et.nom, type: et.type, institution: et.institution, dinacope: et.dinacope,
      province: et.province, provinceEducationnelle: et.provinceEducationnelle,
      ville: et.ville, commune: et.commune, adresse: et.adresse,
      telephone: et.telephone, email: et.email, chefEcole: et.chefEcole,
      effectif: String(et.effectif), statut: et.statut, statutValidation: et.statutValidation,
      coordSousProvincialeId: et.coordSousProvincialeId ?? '',
      ecErcId: et.ecErcId ?? '',
      structureRattachementId: et.coordSousProvincialeId ?? '',
      structureRattachementType: '',
    });
    setView('form');
  }

  function showFiche(id: string) {
    setFicheId(id);
    setView('fiche');
  }

  async function handleSubmit(data: EcoleFormData) {
    setFormError('');
    setFormLoading(true);
    try {
      const url = editingId ? `/api/ecoles/${editingId}` : '/api/ecoles';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, effectif: data.effectif ? Number(data.effectif) : 0 }),
      });
      const result = await res.json();
      if (!res.ok) {
        setFormError(result.error ?? 'Erreur lors de l\'enregistrement.');
      } else {
        setView('list');
        setEditingId(null);
        setInitialFormData(null);
        loadData();
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette école ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ecoles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Suppression impossible.');
      } else {
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <AppShell>
      <div className="p-4 pb-24 md:p-6">
        <div className="mx-auto max-w-6xl">
          {view === 'list' && (
            <>
              {/* ── Titre + compteur ── */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Écoles</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {loading ? 'Chargement…' : `${ecoles.length} école(s)`}
                </p>
              </div>

              {/* ── Onglets Liste / Carte ── */}
              <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setTabView('liste')}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                    tabView === 'liste'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setTabView('carte')}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                    tabView === 'carte'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Carte
                </button>
              </div>

              {/* ── Boutons d'action ── */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowOcr(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Icon name="photo" className="h-4 w-4 shrink-0" />
                  <span className="truncate">Importer photo</span>
                </button>
                <button
                  onClick={() => setShowTxtImport(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Icon name="plus" className="h-4 w-4 shrink-0" />
                  <span className="truncate">Ajouter plusieurs</span>
                </button>
                <button
                  onClick={startCreate}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-2 py-2.5 text-xs font-medium text-white transition hover:bg-brand-700"
                >
                  <Icon name="plus" className="h-4 w-4 shrink-0" />
                  <span className="truncate">Nouvelle école</span>
                </button>
              </div>

              {tabView === 'liste' ? (
                <>
                  {/* ── Carte Filtres ── */}
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                    <button
                      onClick={() => setShowFilters((s) => !s)}
                      className="flex w-full items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name="filter" className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Filtres</span>
                      </div>
                      <Icon name="chevron-down" className={`h-4 w-4 text-slate-400 transition ${showFilters ? 'rotate-180' : ''}`} />
                    </button>

                    {showFilters && (
                      <div className="mt-3 space-y-3">
                        {/* Recherche */}
                        <div className="relative">
                          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une école par nom, code ou…"
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                          />
                        </div>

                        {/* Filtres grille */}
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Province administrative</label>
                            <select
                              value={provinceFilter}
                              onChange={(e) => { setProvinceFilter(e.target.value); setProvinceEducFilter(''); }}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            >
                              <option value="">Toutes les provinces</option>
                              {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Province éducationnelle</label>
                            <select
                              value={provinceEducFilter}
                              onChange={(e) => { setProvinceEducFilter(e.target.value); setCommuneFilter(''); }}
                              disabled={!provinceFilter}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 disabled:opacity-40"
                            >
                              <option value="">Toutes les provinces éduc.</option>
                              {(PROVINCES_EDUC_BY_ADMIN[provinceFilter] ?? []).map((pe) => (
                                <option key={pe.nom} value={pe.nom}>{pe.nom}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Commune</label>
                            <select
                              value={communeFilter}
                              onChange={(e) => setCommuneFilter(e.target.value)}
                              disabled={!provinceEducFilter}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 disabled:opacity-40"
                            >
                              <option value="">Toutes les communes</option>
                              {getCommunesForProvinceEduc(provinceEducFilter).map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Institution</label>
                            <select
                              value={institutionFilter}
                              onChange={(e) => setInstitutionFilter(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            >
                              <option value="">Toutes institutions</option>
                              {INSTITUTIONS.map((i) => <option key={i.code} value={i.code}>{i.label.split('—')[0].trim()}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Niveau</label>
                            <NiveauScolaireSelector value={typeFilter} onChange={setTypeFilter} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Statut</label>
                            <select
                              value={statutFilter}
                              onChange={(e) => setStatutFilter(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                            >
                              <option value="">Tous les statuts</option>
                              {VALIDATION_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        {(typeFilter || statutFilter || provinceFilter || provinceEducFilter || communeFilter || institutionFilter) && (
                          <button
                            onClick={() => { setTypeFilter(''); setStatutFilter(''); setProvinceFilter(''); setProvinceEducFilter(''); setCommuneFilter(''); setInstitutionFilter(''); }}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            ✕ Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Liste des écoles ── */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
                    </div>
                  ) : ecoles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                      <p className="text-sm text-slate-500">Aucune école enregistrée pour le moment.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft md:block">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3">École</th>
                              <th className="px-4 py-3">Institution</th>
                              <th className="px-4 py-3">Province</th>
                              <th className="px-4 py-3">Structure</th>
                              <th className="px-4 py-3">Statut</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ecoles.map((et) => {
                              const inst = INSTITUTION_MAP[et.institution];
                              return (
                                <tr key={et.id} className="cursor-pointer hover:bg-slate-50" onClick={() => showFiche(et.id)}>
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-slate-900">{et.nom}</p>
                                    <p className="text-xs text-slate-400">{et.identifiantSM || '—'} · {et.dinacope || 'DINACOPE —'}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
                                      {inst?.label?.split('—')[0]?.trim() || et.institution}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{et.province || '—'}</td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {et.coordSousProvinciale?.nom || et.ecErc?.nom || <span className="text-red-500">Non liée</span>}
                                  </td>
                                  <td className="px-4 py-3"><StatutBadge statut={et.statutValidation} /></td>
                                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1">
                                      <button onClick={() => showFiche(et.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50">Profil</button>
                                      <button onClick={() => startEdit(et)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50">Modifier</button>
                                      <button onClick={() => handleDelete(et.id)} disabled={deletingId === et.id} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                                        {deletingId === et.id ? '…' : 'Désactiver'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards — design du modèle */}
                      <div className="space-y-3 md:hidden">
                        {ecoles.map((et) => {
                          const inst = INSTITUTION_MAP[et.institution];
                          const isSelected = selectedIds.has(et.id);
                          return (
                            <div
                              key={et.id}
                              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft"
                            >
                              {/* Top row: checkbox + logo + content + badge */}
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(et.id)}
                                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                                  <Icon name="school" className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1" onClick={() => showFiche(et.id)}>
                                  <p className="truncate font-semibold text-slate-900">{et.nom}</p>
                                  <p className="truncate text-xs text-slate-500">
                                    {inst?.label?.split('—')[0]?.trim() || et.institution} · {et.dinacope || '—'} · {et.province || 'RDC'}
                                  </p>
                                </div>
                                {et.statut === 'Actif' && (
                                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                                    Active
                                  </span>
                                )}
                              </div>

                              {/* Action row */}
                              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                                <button
                                  onClick={() => showFiche(et.id)}
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                  <Icon name="document" className="h-3.5 w-3.5" />
                                  Profil
                                </button>
                                <button
                                  onClick={() => startEdit(et)}
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                  <Icon name="edit" className="h-3.5 w-3.5" />
                                  Modifier
                                </button>
                                <button
                                  onClick={() => handleDelete(et.id)}
                                  disabled={deletingId === et.id}
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <Icon name="settings" className="h-3.5 w-3.5" />
                                  {deletingId === et.id ? '…' : 'Désactiver'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* ── Vue Carte (placeholder) ── */
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Icon name="map" className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700">Vue carte</p>
                  <p className="mt-2 text-sm text-slate-500">
                    La carte interactive sera disponible prochainément.
                  </p>
                </div>
              )}
            </>
          )}

          {view === 'form' && (
            <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Modifier l\'école' : 'Enregistrer une nouvelle école'}
                </h2>
                <button onClick={() => { setView('list'); setEditingId(null); setInitialFormData(null); }}
                  className="text-sm text-slate-500 transition hover:text-slate-700">
                  ← Retour à la liste
                </button>
              </div>
              <EcoleForm
                initialData={initialFormData}
                onSubmit={handleSubmit}
                onCancel={() => { setView('list'); setEditingId(null); setInitialFormData(null); }}
                submitLabel={editingId ? 'Modifier l\'école' : 'Enregistrer l\'école'}
                loading={formLoading}
                error={formError}
              />
            </div>
          )}

          {view === 'fiche' && ficheId && (
            <EcoleFiche
              id={ficheId}
              onEdit={() => {
                const et = ecoles.find((e) => e.id === ficheId);
                if (et) startEdit(et);
              }}
              onClose={() => { setView('list'); setFicheId(null); }}
            />
          )}

          {showImport && (
            <ImportDialog
              endpoint="/api/import/ecoles"
              moduleName="Écoles"
              columns={['nom', 'type', 'province', 'ville', 'adresse', 'telephone', 'email', 'effectif', 'statut']}
              onImported={loadData}
              onClose={() => setShowImport(false)}
            />
          )}

          {showOcr && (
            <OcrEcolesImportDialog
              onImported={loadData}
              onClose={() => setShowOcr(false)}
            />
          )}

          {showTxtImport && (
            <TxtImportDialog
              onImported={loadData}
              onClose={() => setShowTxtImport(false)}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
