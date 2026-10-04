'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from './StatCard';
import { DonutChart, BarCompare } from './Charts';

type Stats = {
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

export function NationalDashboard({ stats, breakdown, chartData, activite }: {
  stats: Stats;
  breakdown: BreakdownItem[];
  chartData: ChartItem[];
  activite: string[];
}) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Tableau de bord national</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Vue d'ensemble du pays</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Pilotage national — synthèse de l'ensemble du système éducatif congolais.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Provinces" value={fmt(stats.totalProvinces)} hint="Couverture nationale" icon="globe" color="blue" delay={0} />
        <StatCard label="Sous-divisions" value={fmt(stats.totalSousProvinciales)} hint="Coord. sous-provinciales" icon="district" color="cyan" delay={0.06} />
        <StatCard label="Établissements" value={fmt(stats.totalEtablissements)} hint="Toutes provinces" icon="school" color="violet" delay={0.12} />
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits cette année" icon="users" color="blue" delay={0.18} />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Actifs" icon="teacher" color="emerald" delay={0.24} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.3} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.36} />
        <StatCard label="Visites" value={fmt(stats.totalVisites)} hint="Contrôles numériques" icon="visit" color="violet" delay={0.42} />
      </div>

      {/* ── Graphiques récapitulatifs ── */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Effectifs d'élèves par province</h2>
          <div className="mt-5">
            <DonutChart data={chartData} centerValue={fmt(stats.totalEleves)} centerLabel="élèves" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Élèves vs Enseignants</h2>
          <div className="mt-5">
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

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Répartition par province */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Répartition par province</h2>
          <div className="mt-4 space-y-3">
            {breakdown.length > 0 ? breakdown.map((item) => {
              const maxVal = Math.max(...breakdown.map((b) => b.value), 1);
              const pct = Math.round((item.value / maxVal) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-400">{item.value} écoles · {item.sublabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-400">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        {/* Activité récente */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
          <ul className="mt-4 space-y-3">
            {activite.length > 0 ? activite.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                {item}
              </li>
            )) : (
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                Aucune activité récente
              </li>
            )}
          </ul>
          <div className="mt-5 flex gap-3">
            <Link href="/coordination-nationale" className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              <Icon name="flag" className="h-4 w-4" /> Coordination nationale
            </Link>
            <Link href="/provinces" className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
              <Icon name="globe" className="h-4 w-4" /> Gérer les provinces
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
