'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { statutBadge, demoUsers } from '@/lib/demo-data';
import { ROLE_LABELS } from '@/lib/rbac';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const data = demoUsers.filter((u) => {
    const matchSearch = !search || u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns: Column<typeof demoUsers[0]>[] = [
    { key: 'nom', label: 'Nom', render: (u) => <span className="font-medium text-slate-900">{u.nom}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle', render: (u) => <Badge color="blue">{ROLE_LABELS[u.role] ?? u.role}</Badge> },
    { key: 'statut', label: 'Statut', render: (u) => statutBadge(u.statut) },
  ];

  return (
    <ModulePage icon="people" eyebrow="Administration" title="Gestion des utilisateurs" description="Création, activation, rôles et permissions des comptes utilisateurs.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={String(demoUsers.length)} />
        <StatCard label="Actifs" value={String(demoUsers.filter((u) => u.statut === 'Actif').length)} />
        <StatCard label="Inactifs" value={String(demoUsers.filter((u) => u.statut === 'Inactif').length)} />
        <StatCard label="Rôles distincts" value={String(new Set(demoUsers.map((u) => u.role)).size)} />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
          <option value="">Tous les rôles</option>
          <option value="SUPER_ADMIN">Super administrateur</option>
          <option value="COORDINATION_PROVINCIALE">Coordination provinciale</option>
          <option value="DIRECTION_ECOLE">Direction d'école</option>
          <option value="ENSEIGNANT">Enseignant</option>
          <option value="PARENT">Parent</option>
          <option value="ELEVE">Élève</option>
        </select>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Nouvel utilisateur</button>
      </div>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou email…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      <DataTable columns={columns} data={data} />
    </ModulePage>
  );
}
