'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { DossierEleveDetail } from '@/components/dossiers-eleves/DossierEleveDetail';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  sexe: string;
  ecole: { id: string; nom: string } | null;
};

export default function DossiersElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (classeFilter) params.set('classe', classeFilter);
    try {
      const res = await fetch(`/api/eleves?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEleves(data.eleves ?? []);
        if (!classeFilter) {
          const cls = [...new Set((data.eleves ?? []).map((e: Eleve) => e.classe).filter(Boolean))].sort() as string[];
          setClasses(cls);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [search, classeFilter]);

  const selectedEleve = eleves.find((e) => e.id === selectedId) || null;

  return (
    <ModulePage
      icon="folder"
      eyebrow="Gestion scolaire"
      title="Dossiers des élèves"
      description="Documents, résultats scolaires et historique des interactions de chaque élève."
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Liste des élèves */}
        <div className="lg:w-80 lg:shrink-0">
          <div className="mb-3 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Rechercher un élève…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <select
              value={classeFilter}
              onChange={(e) => setClasseFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Chargement…</div>
            ) : eleves.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">Aucun élève trouvé.</div>
            ) : (
              eleves.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-50 ${selectedId === e.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {e.prenom[0]}{e.nom[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {e.prenom} {e.nom}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {e.matricule} • {e.classe}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Détail de l'élève */}
        <div className="flex-1">
          {selectedEleve ? (
            <DossierEleveDetail eleve={selectedEleve} />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">Sélectionnez un élève</p>
              <p className="mt-1 text-xs text-slate-500">Consultez son dossier complet : documents, résultats et historique.</p>
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
