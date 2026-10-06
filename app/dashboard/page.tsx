'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DashboardHeader } from '@/components/dashboards/DashboardHeader';
import { QuickActions } from '@/components/dashboards/QuickActions';
import { ServicesGrid } from '@/components/dashboards/ServicesGrid';
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
  provinceAdministrative?: string | null;
  typeInstitution?: string | null;
  institutionName?: string | null;
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
type ChartItem = { label: string; value: number };

type StatsResponse = {
  stats: DashboardStats;
  breakdown: BreakdownItem[];
  chartData: ChartItem[];
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

  // Affichage de chargement
  if (!data || !user) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    chartData: data.chartData,
    activite: data.activite,
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <DashboardHeader user={user} scope={data.scope} />
          <QuickActions role={user.role} />
          <ServicesGrid role={user.role} />
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
