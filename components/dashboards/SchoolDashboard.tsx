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

export function SchoolDashboard({ stats, breakdown, activite }: {
  stats: Stats;
  breakdown: BreakdownItem[];
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits cette année" icon="users" color="blue" delay={0} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.06} />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Actifs" icon="teacher" color="emerald" delay={0.12} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.18} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Répartition par classe */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
          <ul className="mt-4 space-y-3">
            {activite.length > 0 ? activite.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                {item}
              </li>
            )) : (
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                Aucune activité récente
              </li>
            )}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/eleves" className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
              <Icon name="users" className="h-4 w-4" /> Gérer les élèves
            </Link>
            <Link href="/cahier-de-notes" className="flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50">
              <Icon name="notebook" className="h-4 w-4" /> Cahier de notes
            </Link>
            <Link href="/cartes-qr" className="flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50">
              <Icon name="qr" className="h-4 w-4" /> Cartes QR
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
