'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoEtablissements } from '@/lib/demo-data';

export default function EtablissementsPage() {
  const [search, setSearch] = useState('');
  const data = demoEtablissements.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.province.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<typeof demoEtablissements[0]>[] = [
    { key: 'nom', label: 'Établissement', render: (e) => <span className="font-medium text-slate-900">{e.nom}</span> },
    { key: 'type', label: 'Type' },
    { key: 'province', label: 'Province' },
    { key: 'effectif', label: 'Effectif', render: (e) => e.effectif.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (e) => statutBadge(e.statut) },
  ];

  return (
    <ModulePage icon="school" eyebrow="Gestion scolaire" title="Gestion des établissements" description="Création, édition et suivi des écoles, collèges, lycées et institutions.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Établissements" value={String(demoEtablissements.length)} hint="Total recensés" />
        <StatCard label="Secondaires" value={String(demoEtablissements.filter((e) => e.type === 'Secondaire').length)} />
        <StatCard label="Primaires" value={String(demoEtablissements.filter((e) => e.type === 'Primaire').length)} />
        <StatCard label="Effectif total" value={demoEtablissements.reduce((s, e) => s + e.effectif, 0).toLocaleString('fr-FR')} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouvel établissement</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un établissement…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
