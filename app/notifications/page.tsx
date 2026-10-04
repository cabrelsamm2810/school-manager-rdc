'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { demoNotifications } from '@/lib/demo-data';

const typeColor: Record<string, 'blue' | 'green' | 'amber' | 'purple' | 'slate'> = {
  'Inscription': 'green',
  'Visite': 'blue',
  'Évaluation': 'purple',
  'Dossier': 'amber',
  'Personnel': 'slate',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const data = filter === 'unread' ? demoNotifications.filter((n) => !n.lu) : demoNotifications;

  return (
    <ModulePage icon="bell" eyebrow="Communication" title="Notifications" description="Centre de notifications et alertes en temps réel.">
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Total" value={String(demoNotifications.length)} />
        <StatCard label="Non lues" value={String(demoNotifications.filter((n) => !n.lu).length)} />
      </div>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Toutes</button>
        <button onClick={() => setFilter('unread')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filter === 'unread' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Non lues</button>
        <button className="ml-auto rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Tout marquer comme lu</button>
      </div>
      <div className="space-y-3">
        {data.map((n, i) => (
          <div key={i} className={`rounded-2xl border bg-white p-4 shadow-soft transition ${n.lu ? 'border-slate-200' : 'border-blue-200 bg-blue-50/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {!n.lu && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
                  <p className="font-semibold text-slate-900">{n.titre}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">{n.date}</p>
              </div>
              <Badge color={typeColor[n.type] ?? 'slate'}>{n.type}</Badge>
            </div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
