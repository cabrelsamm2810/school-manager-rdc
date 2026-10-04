'use client';

import { useEffect, useState, FormEvent } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ImportDialog } from '@/components/import/ImportDialog';
import { statutBadge } from '@/lib/demo-data';

type Etablissement = {
  id: string;
  nom: string;
  type: string;
  province: string;
  ville: string;
  telephone: string;
  email: string;
  effectif: number;
  statut: string;
};

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

const emptyForm = {
  nom: '',
  type: '',
  province: '',
  ville: '',
  adresse: '',
  telephone: '',
  email: '',
  effectif: '',
  statut: 'Actif',
};

function statutBadgeLocal(statut: string) {
  return statutBadge(statut);
}

export default function EtablissementsPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
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
  }, [search]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/etablissements', {
        method: 'POST',
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
        setShowForm(false);
        loadData();
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setFormLoading(false);
    }
  }

  const columns: Column<Etablissement>[] = [
    { key: 'nom', label: 'Établissement', render: (e) => <span className="font-medium text-slate-900">{e.nom}</span> },
    { key: 'type', label: 'Type' },
    { key: 'province', label: 'Province' },
    { key: 'ville', label: 'Ville' },
    { key: 'effectif', label: 'Effectif', render: (e) => e.effectif.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (e) => statutBadgeLocal(e.statut) },
  ];

  return (
    <ModulePage icon="school" eyebrow="Gestion scolaire" title="Gestion des établissements" description="Création, édition et suivi des écoles, collèges, lycées et institutions.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Établissements" value={String(etablissements.length)} hint="Total recensés" />
        <StatCard label="Secondaires" value={String(etablissements.filter((e) => e.type === 'Secondaire').length)} />
        <StatCard label="Primaires" value={String(etablissements.filter((e) => e.type === 'Primaire').length)} />
        <StatCard label="Effectif total" value={etablissements.reduce((s, e) => s + e.effectif, 0).toLocaleString('fr-FR')} />
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setShowImport(true)}
          className="btn-secondary-light px-4 py-2.5 text-sm"
        >
          ⬆ Importer (Excel/CSV)
        </button>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary px-4 py-2.5 text-sm"
        >
          {showForm ? '← Retour à la liste' : '+ Nouvel établissement'}
        </button>
      </div>

      {showForm ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Enregistrer un nouvel établissement</h2>
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

            <button
              type="submit"
              disabled={formLoading}
              className={`btn-primary px-8 py-3 text-sm ${formLoading ? 'btn-loading' : ''}`}
            >
              {formLoading ? (<><span className="btn-spinner" /> Enregistrement…</>) : 'Enregistrer l\'établissement'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un établissement…"
            className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
          ) : etablissements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Aucun établissement enregistré pour le moment.</p>
              <p className="mt-1 text-xs text-slate-400">Cliquez sur « + Nouvel établissement » ou importez un fichier Excel/CSV.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={etablissements} />
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
    </ModulePage>
  );
}
