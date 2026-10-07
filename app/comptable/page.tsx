'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ClockCard } from '@/components/dashboards/ClockCard';
import { WelcomeCard } from '@/components/dashboards/WelcomeCard';
import { StatCard } from '@/components/ui/Card';
import { useSessionUser } from '@/lib/use-session-user';
import { getInstitutionLabel } from '@/lib/institution';

type ComptableStats = {
  totalEleves: number;
  totalPaiements: number;
  totalClasses: number;
};

export default function ComptablePage() {
  const user = useSessionUser();
  const [stats, setStats] = useState<ComptableStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/paiements').then((r) => (r.ok ? r.json() : null)),
    ]).then(([dash, paiements]) => {
      if (dash?.stats) {
        setStats({
          totalEleves: dash.stats.totalEleves ?? 0,
          totalPaiements: paiements?.paiements?.length ?? 0,
          totalClasses: dash.stats.totalClasses ?? 0,
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-5xl">
          <ClockCard institutionLabel={user ? getInstitutionLabel(user) : ''} />
          {user && <WelcomeCard user={user} scope="school" />}

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Élèves" value={stats ? String(stats.totalEleves) : '—'} hint="Inscrits" />
            <StatCard label="Paiements" value={stats ? String(stats.totalPaiements) : '—'} hint="Enregistrés" />
            <StatCard label="Classes" value={stats ? String(stats.totalClasses) : '—'} hint="Niveaux" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-slate-900">Gestion financière</h3>
              <div className="space-y-2">
                {[
                  { label: 'Enregistrer un paiement', href: '/paiements', icon: '💳' },
                  { label: 'Liste des élèves', href: '/eleves', icon: '👨‍🎓' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-slate-900">Communication</h3>
              <div className="space-y-2">
                {[
                  { label: 'SchoolChat', href: '/schoolchat', icon: '💬' },
                  { label: 'Notifications', href: '/notifications', icon: '🔔' },
                  { label: 'Paramètres', href: '/parametres', icon: '⚙️' },
                  { label: 'Profil', href: '/profile', icon: '👤' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
