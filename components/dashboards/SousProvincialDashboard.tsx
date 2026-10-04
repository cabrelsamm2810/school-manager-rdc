'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from './StatCard';

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

export function SousProvincialDashboard({ stats, breakdown, activite, provinceLabel }: {
  stats: Stats;
  breakdown: BreakdownItem[];
  activite: string[];
  provinceLabel: string | null;
}) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Tableau de bord sous-provincial</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Vue de la sous-division</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {provinceLabel ? `Province de ${provinceLabel}` : ''} — indicateurs des établissements de votre sous-division.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Établissements" value={fmt(stats.totalEtablissements)} hint="Dans la sous-division" icon="school" color="violet" delay={0} />
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits" icon="users" color="blue" delay={0.06} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.12} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.18} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Établissements de la sous-division */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Établissements de la sous-division</h2>
          <div className="mt-4 space-y-3">
            {breakdown.length > 0 ? breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.sublabel}</p>
                </div>
                <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-600">
                  {item.value} élèves
                </span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Aucun établissement enregistré</p>
            )}
          </div>
        </div>

        {/* Activité récente */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
          <ul className="mt-4 space-y-3">
            {activite.length > 0 ? activite.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
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
            <Link href="/etablissements" className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
              <Icon name="school" className="h-4 w-4" /> Établissements
            </Link>
            <Link href="/eleves" className="flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-50">
              <Icon name="users" className="h-4 w-4" /> Élèves
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
