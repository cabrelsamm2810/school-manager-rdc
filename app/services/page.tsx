'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoServices } from '@/lib/demo-data';

export default function ServicesPage() {
  const columns: Column<typeof demoServices[0]>[] = [
    { key: 'service', label: 'Service', render: (s) => <span className="font-medium text-slate-900">{s.service}</span> },
    { key: 'procedures', label: 'Procédures' },
    { key: 'dossiers', label: 'Dossiers', render: (s) => s.dossiers.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (s) => statutBadge(s.statut) },
  ];

  return (
    <ModulePage icon="services" eyebrow="Administration" title="Services administratifs" description="Gestion des services administratifs et de leurs procédures.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Services" value={String(demoServices.length)} />
        <StatCard label="Procédures" value={String(demoServices.reduce((s, svc) => s + svc.procedures, 0))} />
        <StatCard label="Dossiers" value={demoServices.reduce((s, svc) => s + svc.dossiers, 0).toLocaleString('fr-FR')} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouveau service</button>
      </div>
      <DataTable columns={columns} data={demoServices} />
    </ModulePage>
  );
}
