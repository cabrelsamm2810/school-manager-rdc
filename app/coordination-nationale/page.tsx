'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoCoordNationale } from '@/lib/demo-data';

export default function CoordinationNationalePage() {
  const columns: Column<typeof demoCoordNationale[0]>[] = [
    { key: 'province', label: 'Province', render: (p) => <span className="font-medium text-slate-900">{p.province}</span> },
    { key: 'coordonnateur', label: 'Coordonnateur' },
    { key: 'ecoles', label: 'Écoles' },
    { key: 'eleves', label: 'Élèves', render: (p) => p.eleves.toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut', render: (p) => statutBadge(p.statut) },
  ];

  return (
    <ModulePage icon="flag" eyebrow="Organisation territoriale" title="Coordination nationale" description="Pilotage national de School Manager RDC et supervision des coordinations.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Provinces supervisées" value={String(demoCoordNationale.length)} />
        <StatCard label="Écoles totales" value={demoCoordNationale.reduce((s, p) => s + p.ecoles, 0).toLocaleString('fr-FR')} />
        <StatCard label="Élèves totaux" value={demoCoordNationale.reduce((s, p) => s + p.eleves, 0).toLocaleString('fr-FR')} />
        <StatCard label="Postes vacants" value={String(demoCoordNationale.filter((p) => p.statut === 'Vacant').length)} />
      </div>
      <DataTable columns={columns} data={demoCoordNationale} />
    </ModulePage>
  );
}
