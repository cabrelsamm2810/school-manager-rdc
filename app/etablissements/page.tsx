'use client';

import { useEffect, useState, FormEvent } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ImportDialog } from '@/components/import/ImportDialog';
import { OcrImportDialog } from '@/components/import/OcrImportDialog';
import { StatutBadge } from '@/components/ui/StatutBadge';

type Etablissement = {
  id: string;
  nom: string;
  type: string;
  province: string;
  ville: string;
  adresse: string;
  telephone: string;
  email: string;
  effectif: number;
  statut: string;
};

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

const emptyForm = {
  nom: '', type: '', province: '', ville: '', adresse: '',
  telephone: '', email: '', effectif: '', statut: 'Actif',
};

export default function EtablissementsPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (provinceFilter) params.set('province', provinceFilter);
      const res = await fetch(`/api/etablissements?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setEtablissements(data.etablissements ?? []);
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
  }, [search, typeFilter, provinceFilter]);

  function startEdit(et: Etablissement) {
    setEditingId(et.id);
    setForm({
      nom: et.nom, type: et.type, province: et.province, ville: et.ville,
      adresse: et.adresse, telephone: et.telephone, email: et.email,
      effectif: String(et.effectif), statut: et.statut,
    });
    setShowForm(true);
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const url = editingId ? `/api/etablissements/${editingId}` : '/api/etablissements';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          effectif: form.effectif ? Number(form.effectif) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Erreur lors de l\'enregistrement.');
      } else {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        loadData();
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet établissement ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/etablissements/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ModulePage icon="school" eyebrow="Gestion scolaire" title="Gestion des établissements" description="Création, édition et suivi des écoles, collèges, lycées et institutions.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Établissements" value={String(etablissements.length)} hint="Total recensés" />
        <StatCard label="Secondaires" value={String(etablissements.filter((e) => e.type === 'Secondaire').length)} />
        <StatCard label="Primaires" value={String(etablissements.filter((e) => e.type === 'Primaire').length)} />
        <StatCard label="Effectif total" value={etablissements.reduce((s, e) => s + e.effectif, 0).toLocaleString('fr-FR')} />
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button onClick={() => setShowImport(true)} className="btn-secondary-light px-4 py-2.5 text-sm">
          ⬆ Importer (Excel/CSV)
        </button>
        <button onClick={() => setShowOcr(true)} className="btn-secondary-light px-4 py-2.5 text-sm">
          📸 Importer (OCR)
        </button>
        <button onClick={startCreate} className="btn-primary px-4 py-2.5 text-sm">
          + Nouvel établissement
        </button>
      </div>

      {showForm ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Modifier l\'établissement' : 'Enregistrer un nouvel établissement'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-sm text-slate-500 transition hover:text-slate-700">
              ← Retour à la liste
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="etab-nom">Nom *</label>
                <input id="etab-nom" type="text" required value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className={inputClass} placeholder="Ex. Institut Tuendelee" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-type">Type</label>
                <select id="etab-type" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={inputClass}>
                  <option value="">—</option>
                  <option value="Primaire">Primaire</option>
                  <option value="Secondaire">Secondaire</option>
                  <option value="Supérieur">Supérieur</option>
                  <option value="Professionnel">Professionnel</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-province">Province</label>
                <input id="etab-province" type="text" value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className={inputClass} placeholder="Ex. Kinshasa" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-ville">Ville</label>
                <input id="etab-ville" type="text" value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-tel">Téléphone</label>
                <input id="etab-tel" type="tel" value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className={inputClass} placeholder="+243 ..." />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-email">Email</label>
                <input id="etab-email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-effectif">Effectif</label>
                <input id="etab-effectif" type="number" min="0" value={form.effectif}
                  onChange={(e) => setForm({ ...form, effectif: e.target.value })}
                  className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-statut">Statut</label>
                <select id="etab-statut" value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value })}
                  className={inputClass}>
                  <option value="Actif">Actif</option>
                  <option value="En attente">En attente</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="etab-adresse">Adresse</label>
                <input id="etab-adresse" type="text" value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  className={inputClass} />
              </div>
            </div>

            {formError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
            )}

            <button type="submit" disabled={formLoading}
              className={`btn-primary px-8 py-3 text-sm ${formLoading ? 'btn-loading' : ''}`}>
              {formLoading ? (<><span className="btn-spinner" /> Enregistrement…</>) : editingId ? 'Modifier l\'établissement' : 'Enregistrer l\'établissement'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un établissement…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-48">
              <option value="">Tous les types</option>
              <option value="Primaire">Primaire</option>
              <option value="Secondaire">Secondaire</option>
              <option value="Supérieur">Supérieur</option>
              <option value="Professionnel">Professionnel</option>
            </select>
            <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-48">
              <option value="">Toutes les provinces</option>
              {[...new Set(etablissements.map((e) => e.province).filter(Boolean))].sort().map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
          ) : etablissements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Aucun établissement enregistré pour le moment.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Établissement</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Province</th>
                      <th className="px-4 py-3">Ville</th>
                      <th className="px-4 py-3">Effectif</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {etablissements.map((et) => (
                      <tr key={et.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{et.nom}</td>
                        <td className="px-4 py-3 text-slate-600">{et.type || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{et.province || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{et.ville || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{et.effectif.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3">{<StatutBadge statut={et.statut} />}</td>
                        <td className="px-4 py-3">
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
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {etablissements.map((et) => (
                  <div key={et.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">{et.nom}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{et.type || '—'} · {et.province || '—'}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {<StatutBadge statut={et.statut} />}
                      <span className="text-xs text-slate-500">{et.effectif.toLocaleString('fr-FR')} élèves</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(et)}
                        className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(et.id)} disabled={deletingId === et.id}
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                        {deletingId === et.id ? 'Suppression…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showImport && (
        <ImportDialog
          endpoint="/api/import/etablissements"
          moduleName="Établissements"
          columns={['nom', 'type', 'province', 'ville', 'adresse', 'telephone', 'email', 'effectif', 'statut']}
          onImported={loadData}
          onClose={() => setShowImport(false)}
        />
      )}

      {showOcr && (
        <OcrImportDialog
          endpoint="/api/import/etablissements"
          moduleName="Établissements"
          columns={['nom', 'type', 'province', 'ville', 'adresse', 'telephone', 'email', 'effectif', 'statut']}
          onImported={loadData}
          onClose={() => setShowOcr(false)}
        />
      )}
    </ModulePage>
  );
}
