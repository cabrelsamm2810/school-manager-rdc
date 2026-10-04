'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { ROLE_LABELS } from '@/lib/rbac';
import { NationalDashboard } from '@/components/dashboards/NationalDashboard';
import { ProvincialDashboard } from '@/components/dashboards/ProvincialDashboard';
import { SousProvincialDashboard } from '@/components/dashboards/SousProvincialDashboard';
import { SchoolDashboard } from '@/components/dashboards/SchoolDashboard';

type SessionUser = {
  id: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
  email: string;
  role: string;
  profilePhotoUrl?: string | null;
  provinceAdministrative?: string;
};

type DashboardStats = {
  totalEleves: number;
  totalEtablissements: number;
  totalEnseignants: number;
  totalClasses: number;
  totalProvinces: number;
  totalDossiers: number;
  totalVisites: number;
  totalSousProvinciales: number;
};

type BreakdownItem = { label: string; value: number; sublabel: string };

type StatsResponse = {
  stats: DashboardStats;
  breakdown: BreakdownItem[];
  activite: string[];
  scope: 'national' | 'provincial' | 'sousProvincial' | 'school';
  provinceLabel: string | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StatsResponse | null) => {
        if (d?.stats) setData(d);
      })
      .catch(() => {});
  }, []);

  const roleLabel = user ? ROLE_LABELS[user.role] ?? user.role : '';

  // Affichage de chargement
  if (!data) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Tableau de bord</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              {user ? `Bienvenue, ${user.prenom}` : 'Vue d\u2019ensemble'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {user ? `${roleLabel} — Chargement des indicateurs…` : 'Chargement…'}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const dashProps = {
    stats: data.stats,
    breakdown: data.breakdown,
    activite: data.activite,
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          {data.scope === 'national' && <NationalDashboard {...dashProps} />}
          {data.scope === 'provincial' && (
            <ProvincialDashboard {...dashProps} provinceLabel={data.provinceLabel} />
          )}
          {data.scope === 'sousProvincial' && (
            <SousProvincialDashboard {...dashProps} provinceLabel={data.provinceLabel} />
          )}
          {data.scope === 'school' && <SchoolDashboard {...dashProps} />}
        </div>
      </div>
    </AppShell>
  );
}
