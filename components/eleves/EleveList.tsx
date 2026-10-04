'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('/api/etablissements')
      .then((res) => res.json())
      .then((data) => {
        if (data.etablissements) setEtablissements(data.etablissements);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (etablissementFilter) params.set('etablissementId', etablissementFilter);
      try {
        const res = await fetch(`/api/eleves?${params.toString()}`);
        const data = await res.json();
        if (active && res.ok) setEleves(data.eleves ?? []);
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
  }, [refreshKey, search, etablissementFilter]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Chargement des élèves…</p>;
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
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-64"
        >
          <option value="">Tous les établissements</option>
          {etablissements.map((et) => (
            <option key={et.id} value={et.id}>{et.nom}</option>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes mobile */}
      <div className="space-y-3 md:hidden">
        {eleves.map((eleve) => (
          <div key={eleve.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                {eleve.nom} {eleve.postNom} {eleve.prenom}
              </p>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {eleve.classe}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Matricule : {eleve.matricule}</p>
            {eleve.etablissement && (
              <p className="mt-0.5 text-xs text-slate-500">Établissement : {eleve.etablissement.nom}</p>
            )}
            <div className="mt-2 space-y-0.5 text-sm text-slate-600">
              {eleve.telephone && <p>Tél : {eleve.telephone}</p>}
              {eleve.nomTuteur && <p>Tuteur : {eleve.nomTuteur} — {eleve.telephoneTuteur || '—'}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
