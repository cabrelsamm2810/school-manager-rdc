'use client';

import Link from 'next/link';
import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function PaiementsPage() {
  return (
    <ModulePage icon="card" eyebrow="Services" title="Paiements & premium" description="Suivi des paiements et abonnements.">
      {/* Accès direct au module de frais scolaires piloté par la carte élève. */}
      <Link
        href="/frais-scolaires"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
      >
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 019.07 4h5.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900">Scanner la carte élève</span>
          <span className="block text-xs text-slate-500">
            Situation financière, paiement des frais et reçu numérique
          </span>
        </span>
        <span className="flex-none text-xs font-semibold text-blue-600">Ouvrir</span>
      </Link>

      <CrudManager config={crudConfigs.paiements} />
    </ModulePage>
  );
}
