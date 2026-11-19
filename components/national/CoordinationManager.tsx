'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ProvincialCoordinatorPanel } from './ProvincialCoordinatorPanel';
import { SupervisionPanel } from './SupervisionPanel';

const TABS = [
  { key: 'comptes', label: 'Comptes des coordinateurs provinciaux', icon: 'people' },
  { key: 'supervision', label: 'Supervision & établissements', icon: 'district' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Gestion administrative nationale : comptes provinciaux et supervision. */
export function CoordinationManager() {
  const [tab, setTab] = useState<TabKey>('comptes');

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition ${
              tab === item.key ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
            }`}
          >
            <Icon name={item.icon} className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'comptes' ? <ProvincialCoordinatorPanel /> : <SupervisionPanel />}
    </div>
  );
}
