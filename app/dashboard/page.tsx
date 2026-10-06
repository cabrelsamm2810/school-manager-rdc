'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
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
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <DashboardError onRetry={loadStats} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading || !data || !user) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
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
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <WelcomeCard user={user} scope={data.scope} />
          <QuickActions role={user.role} />
          {data.scope === 'national' && <NationalDashboard {...dashProps} />}
          {data.scope === 'provincial' && (
            <ProvincialDashboard {...dashProps} provinceLabel={data.provinceLabel} />
          )}
          {data.scope === 'sousProvincial' && (
            <SousProvincialDashboard {...dashProps} provinceLabel={data.provinceLabel} />
          )}
          {data.scope === 'school' && <SchoolDashboard {...dashProps} />}
          <ServicesGrid role={user.role} />
        </div>
      </div>
    </AppShell>
  );
}
