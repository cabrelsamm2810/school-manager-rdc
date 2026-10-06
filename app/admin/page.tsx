'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';

type AdminStats = {
  totalUsers: number;
  totalEtablissements: number;
  totalProvinces: number;
  totalDossiers: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.ok ? r.json() : null),
      fetch('/api/users').then((r) => r.ok ? r.json() : null),
      fetch('/api/dossiers').then((r) => r.ok ? r.json() : null),
    ]).then(([dash, users, dossiers]) => {
      setStats({
        totalUsers: users?.users?.length ?? 0,
        totalEtablissements: dash?.stats?.totalEtablissements ?? 0,
        totalProvinces: dash?.stats?.totalProvinces ?? 0,
        totalDossiers: dossiers?.dossiers?.length ?? 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <ModulePage icon="shield" eyebrow="Administration" title="Administration générale" description="Configuration globale, paramètres système et supervision de School Manager RDC.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats ? String(stats.totalUsers) : '—'} hint="Total comptes" />
        <StatCard label="Établissements" value={stats ? String(stats.totalEtablissements) : '—'} hint="Recensés" />
        <StatCard label="Provinces" value={stats ? String(stats.totalProvinces) : '—'} hint="Couvertes" />
        <StatCard label="Dossiers" value={stats ? String(stats.totalDossiers) : '—'} hint="Actifs" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="mb-4 font-bold text-slate-900">État du système</h3>
          <div className="space-y-3">
            {[
              { label: 'Base de données', value: 'PostgreSQL 16', status: 'Opérationnel' },
              { label: 'Serveur applicatif', value: 'Next.js 14', status: 'Opérationnel' },
              { label: 'Authentification', value: 'Session cookie', status: 'Opérationnel' },
              { label: 'Stockage fichiers', value: 'Non configuré', status: 'En attente' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.value}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'Opérationnel' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="mb-4 font-bold text-slate-900">Actions rapides</h3>
          <div className="space-y-2">
            {[
              { label: 'Gérer les utilisateurs', href: '/admin/users' },
              { label: 'Paramètres généraux', href: '/parametres' },
              { label: 'Provinces & territoire', href: '/provinces' },
              { label: 'Établissements', href: '/etablissements' },
              { label: 'Dossiers administratifs', href: '/dossiers' },
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                {action.label}
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
