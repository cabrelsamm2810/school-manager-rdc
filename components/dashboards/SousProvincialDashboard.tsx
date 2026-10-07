'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from './StatCard';
import { DonutChart, BarCompare } from './Charts';
import { RecentActivity } from './RecentActivity';
import type { BreakdownItem, ChartItem, DashboardStats } from './types';

export function SousProvincialDashboard({ stats, breakdown, chartData, activite, provinceLabel }: {
  stats: DashboardStats;
  breakdown: BreakdownItem[];
  chartData: ChartItem[];
  activite: string[];
  provinceLabel: string | null;
}) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <>
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand-600">Tableau de bord sous-provincial</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">Vue de la sous-division</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          {provinceLabel ? `Province de ${provinceLabel}` : ''} — indicateurs des institutions de votre sous-division.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Institutions" value={fmt(stats.totalEcoles)} hint="Dans la sous-division" icon="school" color="violet" delay={0} />
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits" icon="users" color="blue" delay={0.06} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.12} />
        <StatCard label="Documents" value={fmt(stats.totalDocuments)} hint="Dossiers numérisés" icon="document" color="cyan" delay={0.18} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.24} />
        <StatCard label="Notifications" value={fmt(stats.totalNotifications)} hint="Non lues" icon="bell" color="violet" delay={0.3} />
      </div>

      {/* ── Graphiques récapitulatifs ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Effectifs d'élèves par institution</h2>
          <div className="mt-4">
            <DonutChart data={chartData} centerValue={fmt(stats.totalEleves)} centerLabel="élèves" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Élèves vs Enseignants</h2>
          <div className="mt-4">
            <BarCompare
              items={[
                { label: 'Élèves', value: stats.totalEleves, color: '#3b82f6' },
                { label: 'Enseignants', value: stats.totalEnseignants, color: '#10b981' },
                { label: 'Institutions', value: stats.totalEcoles, color: '#2563eb' },
                { label: 'Classes', value: stats.totalClasses, color: '#f59e0b' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Écoles de la sous-division */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Institutions de la sous-division</h2>
          <div className="mt-4 space-y-2.5">
            {breakdown.length > 0 ? breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.sublabel}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-[13px] font-bold text-brand-600">
                  {item.value} élèves
                </span>
              </div>
            )) : (
              <p className="text-[13px] text-slate-400">Aucune institution enregistrée</p>
            )}
          </div>
        </div>

        {/* Activité récente */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Activité récente</h2>
          <div className="mt-4">
            <RecentActivity items={activite} accent="violet" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/ecoles" className="flex min-h-[40px] items-center gap-2 rounded-full bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700">
              <Icon name="school" className="h-4 w-4" /> Institutions
            </Link>
            <Link href="/eleves" className="flex min-h-[40px] items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-brand-600 transition hover:bg-brand-50">
              <Icon name="users" className="h-4 w-4" /> Élèves
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
