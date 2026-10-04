'use client';

import { ModulePage } from '@/components/ModulePage';
import { DataTable, type Column } from '@/components/ui/Table';
import { demoNotes } from '@/lib/demo-data';

export default function CahierDeNotesPage() {
  const columns: Column<typeof demoNotes[0]>[] = [
    { key: 'eleve', label: 'Élève', render: (e) => <span className="font-medium text-slate-900">{e.eleve}</span> },
    { key: 'devoir1', label: 'Devoir 1' },
    { key: 'devoir2', label: 'Devoir 2' },
    { key: 'examen', label: 'Examen' },
    { key: 'moyenne', label: 'Moyenne', render: (e) => <span className="font-semibold text-blue-600">{e.moyenne}</span> },
    { key: 'mention', label: 'Mention', render: (e) => <span className="text-slate-600">{e.mention}</span> },
  ];

  return (
    <ModulePage icon="notebook" eyebrow="Gestion scolaire" title="Cahier de notes / cahier de cotes" description="Saisie, calcul et édition des notes et cotes par classe et période.">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
          <option>6ème primaire</option>
          <option>4ème secondaire</option>
          <option>3ème secondaire</option>
        </select>
        <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
          <option>1er trimestre</option>
          <option>2ème trimestre</option>
          <option>3ème trimestre</option>
        </select>
        <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
          <option>Mathématiques</option>
          <option>Français</option>
          <option>Sciences</option>
        </select>
      </div>
      <DataTable columns={columns} data={demoNotes} />
    </ModulePage>
  );
}
