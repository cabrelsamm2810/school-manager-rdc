'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoDossiers } from '@/lib/demo-data';

export default function DossiersPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const data = demoDossiers.filter((d) => {
    const matchSearch = !search || d.objet.toLowerCase().includes(search.toLowerCase()) || d.demandeur.toLowerCase().includes(search.toLowerCase()) || d.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || d.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const columns: Column<typeof demoDossiers[0]>[] = [
    { key: 'reference', label: 'Référence', render: (d) => <span className="font-medium text-slate-700">{d.reference}</span> },
    { key: 'objet', label: 'Objet', render: (d) => <span className="font-medium text-slate-900">{d.objet}</span> },
    { key: 'demandeur', label: 'Demandeur' },
    { key: 'date', label: 'Date' },
    { key: 'statut', label: 'Statut', render: (d) => statutBadge(d.statut) },
  ];

  return (
    <ModulePage icon="folder" eyebrow="Administration" title="Gestion des dossiers" description="Création, suivi et archivage des dossiers administratifs.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Dossiers" value={String(demoDossiers.length)} />
        <StatCard label="En cours" value={String(demoDossiers.filter((d) => d.statut === 'En cours').length)} />
        <StatCard label="En attente" value={String(demoDossiers.filter((d) => d.statut === 'En attente').length)} />
        <StatCard label="Traités" value={String(demoDossiers.filter((d) => d.statut === 'Traité').length)} />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
          <option value="">Tous les statuts</option>
          <option>En cours</option>
          <option>En attente</option>
          <option>Traité</option>
          <option>Rejeté</option>
        </select>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouveau dossier</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un dossier…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
