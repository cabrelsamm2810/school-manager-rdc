'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { ImportDialog } from '@/components/import/ImportDialog';
import { OcrImportDialog } from '@/components/import/OcrImportDialog';
import { EcoleForm, emptyForm, type EcoleFormData } from '@/components/ecoles/EcoleForm';
import { EcoleFiche } from '@/components/ecoles/EcoleFiche';
import { NiveauScolaireSelector } from '@/components/ecoles/NiveauScolaireSelector';
import { INSTITUTIONS, INSTITUTION_MAP, VALIDATION_STATUTS } from '@/lib/institutions';
import { PROVINCE_NAMES, PROVINCES_EDUC_BY_ADMIN } from '@/lib/provinces-rdc';

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

export default function EcolesPage() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [provinceEducFilter, setProvinceEducFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [view, setView] = useState<View>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ficheId, setFicheId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<EcoleFormData> | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (provinceFilter) params.set('province', provinceFilter);
      if (provinceEducFilter) params.set('provinceEducationnelle', provinceEducFilter);
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
  }, [search, typeFilter, provinceFilter, provinceEducFilter, institutionFilter, statutFilter]);

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

  return (
    <ModulePage icon="school" eyebrow="Gestion scolaire" title="Gestion des écoles" description="Enregistrement, validation et suivi des écoles par institution.">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Écoles" value={String(ecoles.length)} hint="Total recensés" />
        <StatCard label="Validés" value={String(ecoles.filter((e) => e.statutValidation === 'Validée').length)} />
        <StatCard label="En attente" value={String(ecoles.filter((e) => e.statutValidation === 'En attente de vérification' || e.statutValidation === 'En cours de vérification').length)} />
        <StatCard label="Effectif total" value={ecoles.reduce((s, e) => s + e.effectif, 0).toLocaleString('fr-FR')} />
      </div>

      {view === 'list' && (
        <>
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary-light px-4 py-2.5 text-sm">
              ⬆ Importer (Excel/CSV)
            </button>
            <button onClick={() => setShowOcr(true)} className="btn-secondary-light px-4 py-2.5 text-sm">
              📸 Importer (OCR)
            </button>
            <button onClick={startCreate} className="btn-primary px-4 py-2.5 text-sm">
              + Enregistrer une école
            </button>
          </div>

          {/* Filtres */}
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, DINACOPE, ID)…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            <select value={institutionFilter} onChange={(e) => setInstitutionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">Toutes institutions</option>
              {INSTITUTIONS.map((i) => <option key={i.code} value={i.code}>{i.label}</option>)}
            </select>
            <NiveauScolaireSelector value={typeFilter} onChange={setTypeFilter} />
            <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">Tous les statuts</option>
              {VALIDATION_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={provinceFilter}
              onChange={(e) => { setProvinceFilter(e.target.value); setProvinceEducFilter(''); }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
              <option value="">Toutes les provinces</option>
              {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={provinceEducFilter} onChange={(e) => setProvinceEducFilter(e.target.value)}
              disabled={!provinceFilter}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-40">
              <option value="">Toutes les provinces éduc.</option>
              {(PROVINCES_EDUC_BY_ADMIN[provinceFilter] ?? []).map((pe) => (
                <option key={pe.nom} value={pe.nom}>{pe.nom}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
          ) : ecoles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Aucune école enregistrée pour le moment.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
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
                              {inst?.label || et.institution}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{et.province || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {et.coordSousProvinciale?.nom || et.ecErc?.nom || <span className="text-red-500">Non liée</span>}
                          </td>
                          <td className="px-4 py-3"><StatutBadge statut={et.statutValidation} /></td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button onClick={() => startEdit(et)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                                Modifier
                              </button>
                              <button onClick={() => handleDelete(et.id)} disabled={deletingId === et.id}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                                {deletingId === et.id ? '…' : 'Supprimer'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {ecoles.map((et) => {
                  const inst = INSTITUTION_MAP[et.institution];
                  return (
                    <div key={et.id} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4" onClick={() => showFiche(et.id)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{et.nom}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{et.identifiantSM || '—'}</p>
                        </div>
                        <StatutBadge statut={et.statutValidation} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor || 'bg-slate-100'} ${inst?.color || 'text-slate-600'}`}>
                          {inst?.label || et.institution}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.type || '—'}</span>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{et.province || '—'}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {et.coordSousProvinciale?.nom || et.ecErc?.nom
                          ? `🏫 ${et.coordSousProvinciale?.nom || et.ecErc?.nom}`
                          : <span className="text-red-500">Non liée à une structure</span>}
                      </p>
                      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => startEdit(et)}
                          className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(et.id)} disabled={deletingId === et.id}
                          className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                          {deletingId === et.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
        <OcrImportDialog
          endpoint="/api/import/ecoles"
          moduleName="Écoles"
          columns={['nom', 'type', 'province', 'ville', 'adresse', 'telephone', 'email', 'effectif', 'statut']}
          onImported={loadData}
          onClose={() => setShowOcr(false)}
        />
      )}
    </ModulePage>
  );
}
