'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoGrades } from '@/lib/demo-data';

export default function GradesPage() {
  const columns: Column<typeof demoGrades[0]>[] = [
    { key: 'grade', label: 'Grade', render: (g) => <span className="font-medium text-slate-900">{g.grade}</span> },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'effectif', label: 'Effectif', render: (g) => g.effectif.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (g) => statutBadge(g.statut) },
  ];

  return (
    <ModulePage icon="badge" eyebrow="Administration" title="Gestion des grades" description="Définition et attribution des grades et statuts du personnel.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Grades" value={String(demoGrades.length)} />
        <StatCard label="Catégories" value={String(new Set(demoGrades.map((g) => g.categorie)).size)} />
        <StatCard label="Personnel total" value={demoGrades.reduce((s, g) => s + g.effectif, 0).toLocaleString('fr-FR')} />
        <StatCard label="Grades actifs" value={String(demoGrades.filter((g) => g.statut === 'Actif').length)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouveau grade</button>
      </div>
      <DataTable columns={columns} data={demoGrades} />
    </ModulePage>
  );
}
