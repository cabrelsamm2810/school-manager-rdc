'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CrudManager } from '@/components/CrudManager';
import { Icon } from '@/components/ui/Icon';
import { crudConfigs } from '@/lib/crud-configs';

type Tab = 'provinciales' | 'sous-provinciales';

/**
 * Supervision des coordinations EC-ERC par la Coordination nationale.
 * Réutilise les modules CRUD existants (mêmes tables, mêmes API) : aucune
 * donnée n'est dupliquée, le périmètre institution reste appliqué côté serveur.
 */
export default function CoordinationsPage() {
  const [tab, setTab] = useState<Tab>('provinciales');

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">Coordination nationale EC-ERC</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">Gestion des coordinations</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Supervision des coordinations provinciales et sous-provinciales, puis des établissements scolaires EC-ERC.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setTab('provinciales')}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition ${tab === 'provinciales' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              <Icon name="region" className="h-4 w-4" /> Coordinations provinciales
            </button>
            <button
              onClick={() => setTab('sous-provinciales')}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition ${tab === 'sous-provinciales' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              <Icon name="district" className="h-4 w-4" /> Coordinations sous-provinciales
            </button>
          </div>

          {tab === 'provinciales' ? (
            <CrudManager config={crudConfigs['coordination-provinciale']} />
          ) : (
            <CrudManager config={crudConfigs['coordination-sous-provinciale']} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
