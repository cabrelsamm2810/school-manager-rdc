'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoVisites } from '@/lib/demo-data';

export default function VisitesPage() {
  const columns: Column<typeof demoVisites[0]>[] = [
    { key: 'date', label: 'Date', render: (v) => <span className="font-medium text-slate-700">{v.date}</span> },
    { key: 'etablissement', label: 'Établissement', render: (v) => <span className="font-medium text-slate-900">{v.etablissement}</span> },
    { key: 'visiteur', label: 'Visiteur' },
    { key: 'objet', label: 'Objet' },
    { key: 'statut', label: 'Statut', render: (v) => statutBadge(v.statut) },
  ];

  return (
    <ModulePage icon="visit" eyebrow="Administration" title="Visites numériques" description="Planification, suivi et rapports des visites sur le terrain.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Total visites" value={String(demoVisites.length)} />
        <StatCard label="Planifiées" value={String(demoVisites.filter((v) => v.statut === 'Planifiée').length)} />
        <StatCard label="Terminées" value={String(demoVisites.filter((v) => v.statut === 'Terminée').length)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Planifier une visite</button>
      </div>
      <DataTable columns={columns} data={demoVisites} />
    </ModulePage>
  );
}
