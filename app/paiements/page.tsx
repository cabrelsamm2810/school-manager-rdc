'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { statutBadge, demoPaiements, demoPlans } from '@/lib/demo-data';

export default function PaiementsPage() {
  const columns: Column<typeof demoPaiements[0]>[] = [
    { key: 'reference', label: 'Référence', render: (p) => <span className="font-medium text-slate-700">{p.reference}</span> },
    { key: 'description', label: 'Description', render: (p) => <span className="font-medium text-slate-900">{p.description}</span> },
    { key: 'montant', label: 'Montant' },
    { key: 'date', label: 'Date' },
    { key: 'statut', label: 'Statut', render: (p) => statutBadge(p.statut) },
  ];

  return (
    <ModulePage icon="card" eyebrow="Services" title="Paiements & fonctionnalités premium" description="Gestion des paiements, abonnements et fonctionnalités premium.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Transactions" value={String(demoPaiements.length)} />
        <StatCard label="Payées" value={String(demoPaiements.filter((p) => p.statut === 'Payé').length)} />
        <StatCard label="En attente" value={String(demoPaiements.filter((p) => p.statut === 'En attente').length)} />
        <StatCard label="Plan actuel" value="Premium" hint="Abonnement en cours" />
      </div>

      {/* Plans d'abonnement */}
      <h2 className="mb-4 text-lg font-bold text-slate-900">Plans d'abonnement</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {demoPlans.map((plan) => (
          <div key={plan.nom} className={`rounded-2xl border p-5 shadow-soft ${plan.actuel ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{plan.nom}</h3>
              {plan.actuel && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">Actuel</span>}
            </div>
            <p className="text-2xl font-bold text-slate-900">{plan.prix}</p>
            <ul className="mt-4 space-y-2">
              {plan.fonctionnalites.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-green-600">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition ${plan.actuel ? 'border border-slate-300 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`} disabled={plan.actuel}>
              {plan.actuel ? 'Plan actuel' : 'Choisir'}
            </button>
          </div>
        ))}
      </div>

      {/* Historique */}
      <h2 className="mb-4 text-lg font-bold text-slate-900">Historique des paiements</h2>
      <DataTable columns={columns} data={demoPaiements} />
    </ModulePage>
  );
}
