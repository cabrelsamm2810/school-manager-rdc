'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';
import { FinanceScannerPanel } from '@/components/finances/FinanceScannerPanel';
import { useSessionUser } from '@/lib/use-session-user';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';

type Tab = 'scan' | 'categories' | 'modes';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'scan', label: 'Scanner' },
  { id: 'categories', label: 'Catégories de frais' },
  { id: 'modes', label: 'Modes de paiement' },
];

/**
 * Module « Frais scolaires » : identification de l'élève par sa carte scolaire
 * (QR signé) ou par recherche manuelle, situation financière, paiements, reçus
 * numériques, et réglages des frais/modes de paiement de l'établissement.
 */
export default function FraisScolairesPage() {
  const user = useSessionUser();
  const [tab, setTab] = useState<Tab>('scan');

  const canView = canFinance(user, FINANCE_PERM.VIEW);
  const canConfig = canFinance(user, FINANCE_PERM.CONFIG);
  const canPay = canFinance(user, FINANCE_PERM.PAY);

  const visibleTabs = TABS.filter((item) => item.id === 'scan' || canConfig);

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 text-center">
            <h1 className="text-xl font-bold text-slate-900">Gestion des frais scolaires</h1>
            <p className="mt-1 text-sm text-slate-500">
              Carte scolaire, situation financière et reçus numériques
            </p>
          </div>

          {user && !canView && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Accès non autorisé</p>
              <p className="mt-1 text-xs text-slate-500">
                Votre rôle ne permet pas de consulter les dossiers financiers des élèves.
              </p>
            </div>
          )}

          {canView && visibleTabs.length > 1 && (
            <div className="mb-4 flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    tab === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {canView && tab === 'scan' && <FinanceScannerPanel canPay={canPay} />}

          {tab === 'categories' && canConfig && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <CrudManager config={crudConfigs.fraisCategories} />
            </div>
          )}

          {tab === 'modes' && canConfig && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <CrudManager config={crudConfigs.modesPaiementFrais} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
