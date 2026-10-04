'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { DataTable, type Column } from '@/components/ui/Table';
import { demoElevesRecherche } from '@/lib/demo-data';

export default function RechercheElevesPage() {
  const [search, setSearch] = useState('');
  const [classe, setClasse] = useState('');
  const [province, setProvince] = useState('');

  const data = demoElevesRecherche.filter((e) => {
    const matchSearch = !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.matricule.toLowerCase().includes(search.toLowerCase());
    const matchClasse = !classe || e.classe === classe;
    const matchProvince = !province || e.province === province;
    return matchSearch && matchClasse && matchProvince;
  });

  const columns: Column<typeof demoElevesRecherche[0]>[] = [
    { key: 'matricule', label: 'Matricule', render: (e) => <span className="font-medium text-slate-700">{e.matricule}</span> },
    { key: 'nom', label: 'Nom', render: (e) => <span className="font-medium text-slate-900">{e.nom}</span> },
    { key: 'classe', label: 'Classe' },
    { key: 'etablissement', label: 'Établissement' },
    { key: 'province', label: 'Province' },
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
              <option>6ème primaire</option>
              <option>5ème primaire</option>
              <option>4ème secondaire</option>
              <option>3ème secondaire</option>
              <option>6ème secondaire</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Province</label>
            <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
              <option value="">Toutes</option>
              <option>Kinshasa</option>
              <option>Kongo Central</option>
              <option>Haut-Katanga</option>
              <option>Nord-Kivu</option>
              <option>Kwilu</option>
            </select>
          </div>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">{data.length} résultat(s)</p>
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
