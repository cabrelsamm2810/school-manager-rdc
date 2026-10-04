'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoProvinces } from '@/lib/demo-data';

export default function ProvincesPage() {
  const [search, setSearch] = useState('');
  const data = demoProvinces.filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<typeof demoProvinces[0]>[] = [
    { key: 'nom', label: 'Province', render: (p) => <span className="font-medium text-slate-900">{p.nom}</span> },
    { key: 'chefLieu', label: 'Chef-lieu' },
    { key: 'etablissements', label: 'Établissements' },
    { key: 'eleves', label: 'Élèves', render: (p) => p.eleves.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (p) => statutBadge(p.statut) },
  ];

  return (
    <ModulePage icon="globe" eyebrow="Organisation territoriale" title="Gestion des provinces" description="Administration des provinces administratives et éducationnelles de la RDC.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Provinces" value={String(demoProvinces.length)} />
        <StatCard label="Établissements" value={demoProvinces.reduce((s, p) => s + p.etablissements, 0).toLocaleString('fr-FR')} />
        <StatCard label="Élèves" value={demoProvinces.reduce((s, p) => s + p.eleves, 0).toLocaleString('fr-FR')} />
        <StatCard label="Actives" value={String(demoProvinces.filter((p) => p.statut === 'Actif').length)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Ajouter une province</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une province…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
