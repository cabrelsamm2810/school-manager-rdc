'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from './StatCard';
import { DonutChart, BarCompare } from './Charts';
import { RecentActivity } from './RecentActivity';
import type { BreakdownItem, ChartItem, DashboardStats } from './types';

export function ProvincialDashboard({ stats, breakdown, chartData, activite, provinceLabel }: {
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
        <p className="text-[11px] uppercase tracking-[0.18em] text-blue-600">Tableau de bord provincial</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
          {provinceLabel ? `Province de ${provinceLabel}` : 'Vue provinciale'}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Pilotage provincial — indicateurs des établissements et sous-divisions de votre province.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Sous-divisions" value={fmt(stats.totalSousProvinciales)} hint="Dans la province" icon="district" color="cyan" delay={0} />
        <StatCard label="Établissements" value={fmt(stats.totalEtablissements)} hint="Dans la province" icon="school" color="violet" delay={0.06} />
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits dans la province" icon="users" color="blue" delay={0.12} />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Actifs" icon="teacher" color="emerald" delay={0.18} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.24} />
        <StatCard label="Documents" value={fmt(stats.totalDocuments)} hint="Dossiers numérisés" icon="document" color="cyan" delay={0.3} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.36} />
        <StatCard label="Notifications" value={fmt(stats.totalNotifications)} hint="Non lues" icon="bell" color="violet" delay={0.42} />
      </div>

      {/* ── Graphiques récapitulatifs ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Effectifs d'élèves par sous-division</h2>
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
                { label: 'Établis.', value: stats.totalEtablissements, color: '#8b5cf6' },
                { label: 'Classes', value: stats.totalClasses, color: '#f59e0b' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Répartition par sous-division */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Sous-divisions de la province</h2>
          <div className="mt-4 space-y-2.5">
            {breakdown.length > 0 ? breakdown.map((item) => {
              const maxVal = Math.max(...breakdown.map((b) => b.value), 1);
              const pct = Math.round((item.value / maxVal) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-400">{item.value} écoles · {item.sublabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-[13px] text-slate-400">Aucune sous-division enregistrée</p>
            )}
          </div>
        </div>

        {/* Activité récente */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Activité récente</h2>
          <div className="mt-4">
            <RecentActivity items={activite} accent="cyan" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/coordination-provinciale" className="flex min-h-[40px] items-center gap-2 rounded-full bg-cyan-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-cyan-700">
              <Icon name="region" className="h-4 w-4" /> Coord. provinciale
            </Link>
            <Link href="/coordination-sous-provinciale" className="flex min-h-[40px] items-center gap-2 rounded-full border border-cyan-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-cyan-600 transition hover:bg-cyan-50">
              <Icon name="district" className="h-4 w-4" /> Sous-divisions
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
