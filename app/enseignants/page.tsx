'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoEnseignants } from '@/lib/demo-data';

export default function EnseignantsPage() {
  const [search, setSearch] = useState('');
  const data = demoEnseignants.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.etablissement.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<typeof demoEnseignants[0]>[] = [
    { key: 'nom', label: 'Nom', render: (e) => <span className="font-medium text-slate-900">{e.nom}</span> },
    { key: 'matricule', label: 'Matricule' },
    { key: 'grade', label: 'Grade' },
    { key: 'etablissement', label: 'Établissement' },
    { key: 'statut', label: 'Statut', render: (e) => statutBadge(e.statut) },
  ];

  return (
    <ModulePage icon="teacher" eyebrow="Gestion scolaire" title="Gestion des enseignants" description="Recensement, affectation et suivi des enseignants.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Enseignants" value={String(demoEnseignants.length)} hint="Total recensés" />
        <StatCard label="Actifs" value={String(demoEnseignants.filter((e) => e.statut === 'Actif').length)} />
        <StatCard label="En congé" value={String(demoEnseignants.filter((e) => e.statut === 'Congé').length)} />
        <StatCard label="Grades distincts" value={String(new Set(demoEnseignants.map((e) => e.grade)).size)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouvel enseignant</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un enseignant…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
