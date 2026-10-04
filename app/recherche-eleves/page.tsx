'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { DataTable, type Column } from '@/components/ui/Table';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  etablissement?: { id: string; nom: string; province: string } | null;
};

export default function RechercheElevesPage() {
  const [search, setSearch] = useState('');
  const [classe, setClasse] = useState('');
  const [etablissementId, setEtablissementId] = useState('');
  const [data, setData] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classe) params.set('classe', classe);
      if (etablissementId) params.set('etablissementId', etablissementId);
      const res = await fetch(`/api/eleves?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.eleves ?? []);
        // Extraire les classes uniques
        const uniqueClasses = [...new Set((json.eleves ?? []).map((e: Eleve) => e.classe).filter(Boolean))].sort();
        setClasses(uniqueClasses as string[]);
      }
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
  }, [search, classe, etablissementId]);

  const columns: Column<Eleve>[] = [
    { key: 'matricule', label: 'Matricule', render: (e) => <span className="font-medium text-slate-700">{e.matricule}</span> },
    { key: 'nom', label: 'Nom', render: (e) => <span className="font-medium text-slate-900">{e.nom} {e.prenom}</span> },
    { key: 'classe', label: 'Classe' },
    { key: 'etablissement', label: 'Établissement', render: (e) => e.etablissement?.nom ?? '—' },
    { key: 'province', label: 'Province', render: (e) => e.etablissement?.province ?? '—' },
  ];

  return (
    <ModulePage icon="search" eyebrow="Gestion scolaire" title="Recherche des élèves" description="Recherche multicritère d'élèves par nom, établissement, province ou classe.">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nom ou matricule</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Classe</label>
            <select value={classe} onChange={(e) => setClasse(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="">Toutes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Établissement</label>
            <input type="text" value={etablissementId} onChange={(e) => setEtablissementId(e.target.value)} placeholder="ID établissement…" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">{loading ? 'Chargement…' : `${data.length} résultat(s)`}</p>
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
