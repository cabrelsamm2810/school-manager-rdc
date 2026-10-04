'use client';

import { useEffect, useState } from 'react';
import { EleveForm } from './EleveForm';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  telephone: string;
  email: string;
  nomTuteur: string;
  telephoneTuteur: string;
  etablissement: { id: string; nom: string } | null;
  etablissementId: string | null;
  sexe: string;
  dateNaissance: string | null;
  lieuNaissance: string;
  adresse: string;
};

type Etablissement = {
  id: string;
  nom: string;
};

export function EleveList({ refreshKey }: { refreshKey: number }) {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [etablissementFilter, setEtablissementFilter] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/etablissements')
      .then((res) => res.json())
      .then((data) => {
        if (data.etablissements) setEtablissements(data.etablissements);
      })
      .catch(() => {});
  }, []);

  async function loadData() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (etablissementFilter) params.set('etablissementId', etablissementFilter);
    if (classeFilter) params.set('classe', classeFilter);
    try {
      const res = await fetch(`/api/eleves?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEleves(data.eleves ?? []);
        if (!classeFilter) {
          setClasses([...new Set((data.eleves ?? []).map((e: Eleve) => e.classe))].sort());
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (etablissementFilter) params.set('etablissementId', etablissementFilter);
      if (classeFilter) params.set('classe', classeFilter);
      try {
        const res = await fetch(`/api/eleves?${params.toString()}`);
        const data = await res.json();
        if (active && res.ok) {
          setEleves(data.eleves ?? []);
          if (!classeFilter) {
            setClasses([...new Set((data.eleves ?? []).map((e: Eleve) => e.classe))].sort());
          }
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [refreshKey, search, etablissementFilter, classeFilter]);

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet élève ? Cette action est irréversible.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/eleves/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && eleves.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">Chargement des élèves…</p>;
  }

  if (editingEleve) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Modifier l'élève</h2>
          <button
            onClick={() => setEditingEleve(null)}
            className="text-sm text-slate-500 transition hover:text-slate-700"
          >
            ← Retour à la liste
          </button>
        </div>
        <EleveForm
          eleve={editingEleve}
          onUpdated={() => {
            setEditingEleve(null);
            loadData();
          }}
        />
      </div>
    );
  }

  if (eleves.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Aucun élève enregistré pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou matricule…"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <select
          value={etablissementFilter}
          onChange={(e) => setEtablissementFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-56"
        >
          <option value="">Tous les établissements</option>
          {etablissements.map((et) => (
            <option key={et.id} value={et.id}>{et.nom}</option>
          ))}
        </select>
        <select
          value={classeFilter}
          onChange={(e) => setClasseFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-48"
        >
          <option value="">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe} value={classe}>{classe}</option>
          ))}
        </select>
      </div>

      {/* Tableau desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Matricule</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Classe</th>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Tuteur</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {eleves.map((eleve) => (
              <tr key={eleve.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{eleve.matricule}</td>
                <td className="px-4 py-3 text-slate-900">
                  {eleve.nom} {eleve.postNom} {eleve.prenom}
                </td>
                <td className="px-4 py-3 text-slate-600">{eleve.classe}</td>
                <td className="px-4 py-3 text-slate-600">{eleve.etablissement?.nom ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{eleve.telephone || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {eleve.nomTuteur ? `${eleve.nomTuteur} (${eleve.telephoneTuteur || '—'})` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditingEleve(eleve)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(eleve.id)}
                      disabled={deletingId === eleve.id}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === eleve.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes mobile */}
      <div className="space-y-3 md:hidden">
        {eleves.map((eleve) => (
          <div key={eleve.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {eleve.nom} {eleve.postNom} {eleve.prenom}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Matricule : {eleve.matricule}</p>
                <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {eleve.classe}
                </span>
              </div>
            </div>
            {eleve.etablissement && (
              <p className="mt-1 text-xs text-slate-500">Établissement : {eleve.etablissement.nom}</p>
            )}
            <div className="mt-2 space-y-0.5 text-sm text-slate-600">
              {eleve.telephone && <p>Tél : {eleve.telephone}</p>}
              {eleve.nomTuteur && <p>Tuteur : {eleve.nomTuteur} — {eleve.telephoneTuteur || '—'}</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setEditingEleve(eleve)}
                className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(eleve.id)}
                disabled={deletingId === eleve.id}
                className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === eleve.id ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
