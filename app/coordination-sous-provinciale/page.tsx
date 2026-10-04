'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoCoordSousProvinciale } from '@/lib/demo-data';

export default function CoordinationSousProvincialePage() {
  const columns: Column<typeof demoCoordSousProvinciale[0]>[] = [
    { key: 'nom', label: 'Sous-division', render: (s) => <span className="font-medium text-slate-900">{s.nom}</span> },
    { key: 'province', label: 'Province' },
    { key: 'bureaux', label: 'Bureaux' },
    { key: 'agents', label: 'Agents' },
    { key: 'statut', label: 'Statut', render: (s) => statutBadge(s.statut) },
  ];

  return (
    <ModulePage icon="district" eyebrow="Organisation territoriale" title="Coordinations sous-provinciales" description="Gestion des coordinations sous-provinciales et de leurs bureaux.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Sous-divisions" value={String(demoCoordSousProvinciale.length)} />
        <StatCard label="Bureaux" value={String(demoCoordSousProvinciale.reduce((s, p) => s + p.bureaux, 0))} />
        <StatCard label="Agents" value={String(demoCoordSousProvinciale.reduce((s, p) => s + p.agents, 0))} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouvelle sous-division</button>
      </div>
      <DataTable columns={columns} data={demoCoordSousProvinciale} />
    </ModulePage>
  );
}
