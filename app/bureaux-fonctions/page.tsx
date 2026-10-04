'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { demoBureaux } from '@/lib/demo-data';

export default function BureauxFonctionsPage() {
  const columns: Column<typeof demoBureaux[0]>[] = [
    { key: 'bureau', label: 'Bureau', render: (b) => <span className="font-medium text-slate-900">{b.bureau}</span> },
    { key: 'fonction', label: 'Fonction' },
    { key: 'titulaire', label: 'Titulaire' },
    { key: 'localisation', label: 'Localisation' },
  ];

  return (
    <ModulePage icon="office" eyebrow="Administration" title="Bureaux & fonctions" description="Gestion des bureaux administratifs et de leurs fonctions.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Bureaux" value={String(demoBureaux.length)} />
        <StatCard label="Fonctions distinctes" value={String(new Set(demoBureaux.map((b) => b.fonction)).size)} />
        <StatCard label="Provinces couvertes" value={String(new Set(demoBureaux.map((b) => b.localisation)).size)} />
        <StatCard label="Titulaires assignés" value={String(demoBureaux.filter((b) => b.titulaire !== '—').length)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouveau bureau</button>
      </div>
      <DataTable columns={columns} data={demoBureaux} />
    </ModulePage>
  );
}
