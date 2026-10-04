'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoCoordProvinciale } from '@/lib/demo-data';

export default function CoordinationProvincialePage() {
  const columns: Column<typeof demoCoordProvinciale[0]>[] = [
    { key: 'province', label: 'Province', render: (p) => <span className="font-medium text-slate-900">{p.province}</span> },
    { key: 'bureaux', label: 'Bureaux' },
    { key: 'agents', label: 'Agents' },
    { key: 'dossiers', label: 'Dossiers actifs', render: (p) => p.dossiers.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (p) => statutBadge(p.statut) },
  ];

  return (
    <ModulePage icon="region" eyebrow="Organisation territoriale" title="Coordinations provinciales" description="Supervision des activités éducatives au niveau provincial.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Provinces" value={String(demoCoordProvinciale.length)} />
        <StatCard label="Bureaux" value={String(demoCoordProvinciale.reduce((s, p) => s + p.bureaux, 0))} />
        <StatCard label="Agents" value={String(demoCoordProvinciale.reduce((s, p) => s + p.agents, 0))} />
        <StatCard label="Dossiers" value={demoCoordProvinciale.reduce((s, p) => s + p.dossiers, 0).toLocaleString('fr-FR')} />
      </div>
      <DataTable columns={columns} data={demoCoordProvinciale} />
    </ModulePage>
  );
}
