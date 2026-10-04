'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoEcErc } from '@/lib/demo-data';

export default function EcErcPage() {
  const columns: Column<typeof demoEcErc[0]>[] = [
    { key: 'nom', label: 'Entité', render: (e) => <span className="font-medium text-slate-900">{e.nom}</span> },
    { key: 'type', label: 'Type' },
    { key: 'province', label: 'Province' },
    { key: 'ecoles', label: 'Écoles' },
    { key: 'statut', label: 'Statut', render: (e) => statutBadge(e.statut) },
  ];

  return (
    <ModulePage icon="organization" eyebrow="Organisation territoriale" title="Organisation EC-ERC" description="Gestion des entités EC-ERC et de leur structure éducative.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Entités EC" value={String(demoEcErc.filter((e) => e.type === 'Entité EC').length)} />
        <StatCard label="Entités ERC" value={String(demoEcErc.filter((e) => e.type === 'Entité ERC').length)} />
        <StatCard label="Écoles totales" value={demoEcErc.reduce((s, e) => s + e.ecoles, 0).toString()} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouvelle entité</button>
      </div>
      <DataTable columns={columns} data={demoEcErc} />
    </ModulePage>
  );
}
