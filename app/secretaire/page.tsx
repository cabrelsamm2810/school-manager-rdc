'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ClockCard } from '@/components/dashboards/ClockCard';
import { WelcomeCard } from '@/components/dashboards/WelcomeCard';
import { StatCard } from '@/components/ui/Card';
import { useSessionUser } from '@/lib/use-session-user';
import { getInstitutionLabel } from '@/lib/institution';

type SecretaireStats = {
  totalEleves: number;
  totalClasses: number;
  totalDocuments: number;
  totalVisites: number;
};

export default function SecretairePage() {
  const user = useSessionUser();
  const [stats, setStats] = useState<SecretaireStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.stats) {
          setStats({
            totalEleves: data.stats.totalEleves ?? 0,
            totalClasses: data.stats.totalClasses ?? 0,
            totalDocuments: data.stats.totalDocuments ?? 0,
            totalVisites: data.stats.totalVisites ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-5xl">
          <ClockCard institutionLabel={user ? getInstitutionLabel(user) : ''} />
          {user && <WelcomeCard user={user} scope="school" />}

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Élèves" value={stats ? String(stats.totalEleves) : '—'} hint="Inscrits" />
            <StatCard label="Classes" value={stats ? String(stats.totalClasses) : '—'} hint="Niveaux" />
            <StatCard label="Documents" value={stats ? String(stats.totalDocuments) : '—'} hint="Archivés" />
            <StatCard label="Visites" value={stats ? String(stats.totalVisites) : '—'} hint="Numériques" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-4 font-bold text-slate-900">Gestion administrative</h3>
              <div className="space-y-2">
                {[
                  { label: 'Enregistrer un élève', href: '/eleves', icon: '👨‍🎓' },
                  { label: 'Dossiers des élèves', href: '/dossiers-eleves', icon: '📁' },
                  { label: 'Visites numériques', href: '/visites', icon: '🚌' },
                  { label: 'Photo passeport', href: '/photo-passeport', icon: '📷' },
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
