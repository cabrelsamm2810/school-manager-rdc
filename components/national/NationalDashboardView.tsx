'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from '@/components/dashboards/StatCard';
import { DonutChart, BarCompare } from '@/components/dashboards/Charts';
import { RecentActivity } from '@/components/dashboards/RecentActivity';
import { documentTypeLabel } from '@/lib/national-documents';

type ProvinceRow = { province: string; ecoles: number; eleves: number };

type DocumentRow = {
  id: string;
  type: string;
  titre: string;
  reference: string;
  province: string;
  statut: string;
  createdAt: string;
};

type ActivityRow = {
  id: string;
  action: string;
  module: string;
  userName: string;
  result: string;
  createdAt: string;
};

type DashboardData = {
  stats: {
    totalEcoles: number;
    totalEleves: number;
    totalEnseignants: number;
    totalCoordProvinciales: number;
    totalCoordSousProvinciales: number;
    totalProvinces: number;
    totalCoordinateurs: number;
    totalDocuments: number;
    totalRapports: number;
    ecolesReferentiel: number;
    elevesReferentiel: number;
  };
  presences: {
    total: number;
    presents: number;
    retards: number;
    absents: number;
    justifies: number;
    taux: number;
  };
  ecolesParProvince: ProvinceRow[];
  documentsRecents: DocumentRow[];
  activites: ActivityRow[];
};

const fmt = (n: number) => n.toLocaleString('fr-FR');

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PRESENCE_ITEMS = [
  { key: 'presents', label: 'Présents', color: 'bg-emerald-500', text: 'text-emerald-600' },
  { key: 'retards', label: 'Retards', color: 'bg-amber-500', text: 'text-amber-600' },
  { key: 'absents', label: 'Absents', color: 'bg-rose-500', text: 'text-rose-600' },
  { key: 'justifies', label: 'Justifiés', color: 'bg-sky-500', text: 'text-sky-600' },
] as const;

/** Tableau de bord national : agrégats de tout le pays (aucune valeur inventée). */
export function NationalDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/coordination-nationale/dashboard');
      if (!response.ok) throw new Error('dashboard');
      setData((await response.json()) as DashboardData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">Impossible de charger les statistiques nationales.</p>
        <button
          onClick={load}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-rose-700"
        >
          <Icon name="refresh" className="h-4 w-4" /> Réessayer
        </button>
      </div>
    );
  }

  const { stats, presences, ecolesParProvince, documentsRecents, activites } = data;
  const activiteItems = activites.map((entry) => {
    const who = entry.userName || 'Système';
    const where = entry.module ? ` · ${entry.module}` : '';
    return `${who} — ${entry.action}${where}`;
  });

  return (
    <>
      {/* ── Indicateurs nationaux ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Écoles" value={fmt(stats.totalEcoles)} hint={`${fmt(stats.ecolesReferentiel)} au référentiel`} icon="school" color="blue" delay={0} />
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint={`${fmt(stats.elevesReferentiel)} au référentiel`} icon="users" color="violet" delay={0.04} />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Registre national" icon="teacher" color="emerald" delay={0.08} />
        <StatCard label="Provinces" value={fmt(stats.totalProvinces)} hint="Couverture nationale" icon="globe" color="cyan" delay={0.12} />
        <StatCard label="Coord. provinciales" value={fmt(stats.totalCoordProvinciales)} hint="Structures provinciales" icon="region" color="blue" delay={0.16} />
        <StatCard label="Coord. sous-provinciales" value={fmt(stats.totalCoordSousProvinciales)} hint="Structures de proximité" icon="district" color="cyan" delay={0.2} />
        <StatCard label="Coordinateurs provinciaux" value={fmt(stats.totalCoordinateurs)} hint="Comptes actifs ou en attente" icon="people" color="amber" delay={0.24} />
        <StatCard label="Documents nationaux" value={fmt(stats.totalDocuments)} hint={`${fmt(stats.totalRapports)} rapports provinciaux`} icon="document" color="rose" delay={0.28} />
      </div>

      {/* ── Graphiques ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Écoles par province</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-400">Référentiel provincial EC-ERC</p>
          <div className="mt-4">
            <DonutChart
              data={ecolesParProvince.filter((p) => p.ecoles > 0).map((p) => ({ label: p.province, value: p.ecoles }))}
              centerValue={fmt(stats.ecolesReferentiel)}
              centerLabel="écoles"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Vue comparative nationale</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-400">Effectifs et structures</p>
          <div className="mt-4">
            <BarCompare
              items={[
                { label: 'Élèves', value: stats.totalEleves, color: '#3b82f6' },
                { label: 'Enseignants', value: stats.totalEnseignants, color: '#10b981' },
                { label: 'Écoles', value: stats.totalEcoles, color: '#8b5cf6' },
                { label: 'Coord. provinciales', value: stats.totalCoordProvinciales, color: '#f59e0b' },
                { label: 'Coord. sous-provinciales', value: stats.totalCoordSousProvinciales, color: '#06b6d4' },
              ]}
            />
          </div>
        </section>
      </div>

      {/* ── Présences ── */}
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Statistiques des présences</h2>
            <p className="mt-0.5 text-[11.5px] text-slate-400">Toutes écoles confondues</p>
          </div>
          <span className="inline-flex items-baseline gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-700">
            <span className="text-lg font-bold tabular-nums">{presences.taux}%</span>
            <span className="text-[11px] font-medium">de présence</span>
          </span>
        </div>

        {presences.total === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-[13px] text-slate-500">
            Aucune présence enregistrée pour le moment.
          </p>
        ) : (
          <>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {PRESENCE_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className={item.color}
                  style={{ width: `${(presences[item.key] / presences.total) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRESENCE_ITEMS.map((item) => (
                <div key={item.key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className={`text-lg font-bold tabular-nums ${item.text}`}>{fmt(presences[item.key])}</p>
                  <p className="text-[11.5px] font-medium text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* ── Écoles par province ── */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Répartition provinciale</h2>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Province</th>
                  <th className="px-3 py-2 text-right font-semibold">Écoles</th>
                  <th className="px-3 py-2 text-right font-semibold">Élèves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ecolesParProvince.map((row) => (
                  <tr key={row.province} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{row.province}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{fmt(row.ecoles)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{fmt(row.eleves)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Rapports + activité ── */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">Rapports administratifs nationaux</h2>
            <Link href="/coordination-nationale/documents" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">
              Tout voir
            </Link>
          </div>

          {documentsRecents.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-[13px] text-slate-500">
              Aucun document national enregistré.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {documentsRecents.map((doc) => (
                <li key={doc.id} className="flex items-start gap-2.5 rounded-xl border border-slate-100 p-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon name="document" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{doc.titre}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {documentTypeLabel(doc.type)}
                      {doc.reference ? ` · ${doc.reference}` : ''}
                      {doc.province ? ` · ${doc.province}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-slate-400">{dateLabel(doc.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-5 text-[13px] font-semibold text-slate-900">Activité récente</h3>
          <div className="mt-3">
            <RecentActivity items={activiteItems} accent="violet" />
          </div>
        </section>
      </div>

      {/* ── Accès rapides ── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/coordination-nationale/coordination" className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon name="people" className="h-5 w-5" /></span>
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Coordination & comptes</p>
            <p className="text-[11px] text-slate-400">Coordinateurs, sous-coordinations, écoles</p>
          </div>
        </Link>
        <Link href="/coordination-nationale/documents" className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon name="document" className="h-5 w-5" /></span>
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Documents officiels</p>
            <p className="text-[11px] text-slate-400">Circulaires, décisions, rapports</p>
          </div>
        </Link>
        <Link href="/coordination-nationale/securite" className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon name="shield" className="h-5 w-5" /></span>
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Sécurité & journal</p>
            <p className="text-[11px] text-slate-400">Permissions et historique</p>
          </div>
        </Link>
      </div>
    </>
  );
}
