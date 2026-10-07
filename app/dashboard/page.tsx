'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { ClockCard } from '@/components/dashboards/ClockCard';
import { WelcomeCard } from '@/components/dashboards/WelcomeCard';
import { QuickActions } from '@/components/dashboards/QuickActions';
import { ServicesGrid } from '@/components/dashboards/ServicesGrid';
import { DashboardError, DashboardSkeleton } from '@/components/dashboards/DashboardStates';
import { NationalDashboard } from '@/components/dashboards/NationalDashboard';
import { ProvincialDashboard } from '@/components/dashboards/ProvincialDashboard';
import { SousProvincialDashboard } from '@/components/dashboards/SousProvincialDashboard';
import { SchoolDashboard } from '@/components/dashboards/SchoolDashboard';
import type { DashboardStatsResponse } from '@/components/dashboards/types';
import { useSessionUser } from '@/lib/use-session-user';
import { getInstitutionLabel } from '@/lib/institution';

export default function DashboardPage() {
  const user = useSessionUser();
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('stats');
      const payload = (await response.json()) as DashboardStatsResponse | null;
      if (!payload?.stats) throw new Error('stats');
      setData(payload);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (error) {
    return (
      <AppShell>
        <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
          <div className="mx-auto max-w-5xl">
            <DashboardError onRetry={loadStats} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading || !data || !user) {
    return (
      <AppShell>
        <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
          <div className="mx-auto max-w-5xl">
            <DashboardSkeleton />
          </div>
        </div>
      </AppShell>
    );
  }

  const dashProps = {
    stats: data.stats,
    breakdown: data.breakdown,
    chartData: data.chartData,
    activite: data.activite
  };

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-5xl">
          <ClockCard institutionLabel={getInstitutionLabel(user)} typeInstitution={user.typeInstitution} />
          <WelcomeCard user={user} scope={data.scope} />
          <QuickActions role={user.role} />
          {data.scope === 'national' && <NationalDashboard {...dashProps} role={user.role} />}
          {data.scope === 'provincial' && (
            <ProvincialDashboard {...dashProps} provinceLabel={data.provinceLabel} />
          )}
          {data.scope === 'sousProvincial' && (
            <SousProvincialDashboard {...dashProps} provinceLabel={data.provinceLabel} />
          )}
          {data.scope === 'school' && <SchoolDashboard {...dashProps} role={user.role} />}
          <ServicesGrid role={user.role} />
        </div>
      </div>
    </AppShell>
  );
}
