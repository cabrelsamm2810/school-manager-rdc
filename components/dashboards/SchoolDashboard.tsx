'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from './StatCard';
import { DonutChart, BarCompare } from './Charts';
import { RecentActivity } from './RecentActivity';
import type { BreakdownItem, ChartItem, DashboardStats } from './types';

export function SchoolDashboard({ stats, breakdown, chartData, activite }: {
  stats: DashboardStats;
  breakdown: BreakdownItem[];
  chartData: ChartItem[];
  activite: string[];
}) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Tableau de bord de l'école</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Mon établissement</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Vue d'ensemble de votre établissement — élèves, classes et activité scolaire.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits cette année" icon="users" color="blue" delay={0} />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Actifs" icon="teacher" color="emerald" delay={0.06} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.12} />
        <StatCard label="Documents" value={fmt(stats.totalDocuments)} hint="Dossiers numérisés" icon="document" color="cyan" delay={0.18} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.24} />
        <StatCard label="Notifications" value={fmt(stats.totalNotifications)} hint="Non lues" icon="bell" color="violet" delay={0.3} />
      </div>

      {/* ── Graphiques récapitulatifs ── */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Effectifs d'élèves par classe</h2>
          <div className="mt-5">
            <DonutChart data={chartData} centerValue={fmt(stats.totalEleves)} centerLabel="élèves" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Élèves vs Enseignants</h2>
          <div className="mt-5">
            <BarCompare
              items={[
                { label: 'Élèves', value: stats.totalEleves, color: '#3b82f6' },
                { label: 'Enseignants', value: stats.totalEnseignants, color: '#10b981' },
                { label: 'Classes', value: stats.totalClasses, color: '#f59e0b' },
                { label: 'Dossiers', value: stats.totalDossiers, color: '#f43f5e' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Répartition par classe */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Effectifs par classe</h2>
          <div className="mt-4 space-y-3">
            {breakdown.length > 0 ? breakdown.map((item) => {
              const maxVal = Math.max(...breakdown.map((b) => b.value), 1);
              const pct = Math.round((item.value / maxVal) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-400">{item.value} {item.sublabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-400">Aucun élève enregistré</p>
            )}
          </div>
        </div>

        {/* Activité récente + raccourcis */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
          <div className="mt-4">
            <RecentActivity items={activite} accent="amber" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/eleves" className="flex min-h-[44px] items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
              <Icon name="users" className="h-4 w-4" /> Gérer les élèves
            </Link>
            <Link href="/cahier-de-notes" className="flex min-h-[44px] items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50">
              <Icon name="notebook" className="h-4 w-4" /> Cahier de notes
            </Link>
            <Link href="/cartes-qr" className="flex min-h-[44px] items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50">
              <Icon name="qr" className="h-4 w-4" /> Cartes QR
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
