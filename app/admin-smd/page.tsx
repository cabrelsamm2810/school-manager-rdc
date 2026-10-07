'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ClockCard } from '@/components/dashboards/ClockCard';
import { WelcomeCard } from '@/components/dashboards/WelcomeCard';
import { StatCard } from '@/components/ui/Card';
import { useSessionUser } from '@/lib/use-session-user';
import { getInstitutionLabel } from '@/lib/institution';

type AdminStats = {
  totalUsers: number;
  totalEcoles: number;
  activeUsers: number;
  pendingAccounts: number;
  totalDossiers: number;
  totalSignalements: number;
};

export default function AdminSMDPage() {
  const user = useSessionUser();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.ok ? r.json() : null),
      fetch('/api/users').then((r) => r.ok ? r.json() : null),
      fetch('/api/dossiers').then((r) => r.ok ? r.json() : null),
    ]).then(([dash, users, dossiers]) => {
      const userList = users?.users ?? [];
      setStats({
        totalUsers: userList.length,
        totalEcoles: dash?.stats?.totalEcoles ?? 0,
        activeUsers: userList.filter((u: any) => u.isActive).length,
        pendingAccounts: userList.filter((u: any) => !u.isActive).length,
        totalDossiers: dossiers?.dossiers?.length ?? 0,
        totalSignalements: 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-5xl">
          <ClockCard institutionLabel={user ? getInstitutionLabel(user) : ''} />
          {user && <WelcomeCard user={user} scope="admin" />}

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Utilisateurs" value={stats ? String(stats.totalUsers) : '—'} hint="Total comptes" />
            <StatCard label="Comptes actifs" value={stats ? String(stats.activeUsers) : '—'} hint="Validés" />
            <StatCard label="En attente" value={stats ? String(stats.pendingAccounts) : '—'} hint="À valider" />
            <StatCard label="Écoles" value={stats ? String(stats.totalEcoles) : '—'} hint="Recensées" />
            <StatCard label="Dossiers" value={stats ? String(stats.totalDossiers) : '—'} hint="Actifs" />
            <StatCard label="Signalements" value={stats ? String(stats.totalSignalements) : '—'} hint="À traiter" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-slate-900">Actions administratives</h3>
              <div className="space-y-2">
                {[
                  { label: 'Gérer les utilisateurs', href: '/admin/users', icon: '👥' },
                  { label: 'Consulter les écoles', href: '/ecoles', icon: '🏫' },
                  { label: 'Consulter les dossiers', href: '/dossiers', icon: '📁' },
                  { label: 'Notifications & annonces', href: '/notifications', icon: '🔔' },
                  { label: 'SchoolChat', href: '/schoolchat', icon: '💬' },
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
              <h3 className="mb-4 font-bold text-slate-900">Supervision</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Statistiques globales</span>
                  <Link href="/dashboard" className="font-medium text-blue-600 hover:underline">Consulter →</Link>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Journal d&apos;audit</span>
                  <span className="text-xs text-slate-400">Bientôt disponible</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Activité utilisateurs</span>
                  <Link href="/admin/users" className="font-medium text-blue-600 hover:underline">Consulter →</Link>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Service client</span>
                  <span className="text-xs text-slate-400">Bientôt disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
