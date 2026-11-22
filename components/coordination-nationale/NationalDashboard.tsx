'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { StatCard } from '@/components/dashboards/StatCard';
import { DonutChart, BarCompare } from '@/components/dashboards/Charts';
import { RecentActivity } from '@/components/dashboards/RecentActivity';

type NationalProfile = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  profilePhotoUrl: string | null;
  fonction: string;
  fonctionLabel: string;
  peut: {
    documents: boolean;
    utilisateurs: boolean;
    coordinations: boolean;
    communications: boolean;
    statistiques: boolean;
    rapports: boolean;
  };
};

type NationalDashboardData = {
  profil: NationalProfile;
  stats: {
    totalEcoles: number;
    totalEleves: number;
    totalEnseignants: number;
    coordinationsProvinciales: number;
    coordinationsSousProvinciales: number;
    provincesCouvertes: number;
    seances30j: number;
    presenceTaux: number | null;
    notificationsNonLues: number;
  };
  ecolesParProvinceEduc: { label: string; value: number }[];
  provinces: { province: string; ecoles: number; eleves: number }[];
  presences: { label: string; value: number }[];
  activite: string[];
  notifications: { id: string; titre: string; message: string; type: string; lu: boolean; createdAt: string }[];
};

const PRESENCE_LABELS: Record<string, string> = {
  PRESENT: 'Présents',
  RETARD: 'Retards',
  ABSENT: 'Absents',
  JUSTIFIE: 'Justifiés'
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-36 rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200/60" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200/60" />
    </div>
  );
}

/**
 * Tableau de bord national de la Coordination nationale EC-ERC.
 * Toutes les valeurs affichées proviennent de `/api/coordination-nationale/tableau-de-bord`
 * (données réelles de la base, filtrées sur les établissements EC-ERC).
 */
export function NationalDashboard() {
  const [data, setData] = useState<NationalDashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/coordination-nationale/tableau-de-bord')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('stats'))))
      .then((payload: NationalDashboardData) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">Impossible de charger le tableau de bord national.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-full bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return <Skeleton />;

  const { profil, stats, ecolesParProvinceEduc, provinces, presences, activite, notifications } = data;
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const presenceTotal = presences.reduce((sum, p) => sum + p.value, 0);

  const quickLinks = [
    { href: '/coordination-nationale/coordinations', label: 'Coordinations', hint: 'Provinces & sous-provinces', icon: 'region', show: profil.peut.coordinations },
    { href: '/coordination-nationale/provinces', label: 'Coordination nationale', hint: 'Tableau par province', icon: 'flag', show: true },
    { href: '/coordination-nationale/documents', label: 'Documents nationaux', hint: 'Circulaires & décisions', icon: 'document', show: profil.peut.documents },
    { href: '/coordination-nationale/communications', label: 'Communications', hint: 'Messages aux provinces', icon: 'send', show: profil.peut.communications },
    { href: '/coordination-nationale/utilisateurs', label: 'Comptes & permissions', hint: 'Coordonnateurs & agents', icon: 'users', show: profil.peut.utilisateurs },
  ].filter((l) => l.show);

  return (
    <div className="space-y-4">
      {/* ── En-tête institutionnel ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-4 text-white shadow-lg shadow-brand-900/20 sm:p-5">
        <span className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <img
            src="/illustrations/ec-erc-logo.png"
            alt="Logo EC-ERC"
            className="h-[72px] w-[72px] shrink-0 object-contain sm:h-[80px] sm:w-[80px]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-100">School Manager RDC</p>
            <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">Coordination nationale EC-ERC</h1>
            <p className="mt-1 text-[12.5px] font-medium text-brand-100">
              Supervision nationale des coordinations et des écoles EC-ERC de la RDC.
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              <Icon name="shield" className="h-3.5 w-3.5" /> {profil.fonctionLabel}
            </span>
          </div>

          <div className="flex w-full items-center gap-3 rounded-xl bg-white/15 p-3 sm:w-auto sm:min-w-[260px]">
            <Avatar photoUrl={profil.profilePhotoUrl} prenom={profil.prenom} nom={profil.nom} size="md" className="ring-2 ring-white/40" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">
                {profil.prenom} {profil.nom}
              </p>
              <p className="truncate text-[11px] text-brand-100">{profil.fonctionLabel}</p>
              <p className="truncate text-[11px] text-brand-100">{profil.email}</p>
              {profil.telephone && <p className="truncate text-[11px] text-brand-100">{profil.telephone}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cartes statistiques ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Écoles EC-ERC" value={fmt(stats.totalEcoles)} hint="Établissements supervisés" icon="school" color="blue" />
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits dans les écoles EC-ERC" icon="users" color="violet" />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Rattachés aux écoles EC-ERC" icon="teacher" color="emerald" />
        <StatCard label="Provinces couvertes" value={fmt(stats.provincesCouvertes)} hint="Avec au moins une école" icon="globe" color="cyan" />
        <StatCard label="Coordinations provinciales" value={fmt(stats.coordinationsProvinciales)} hint="Niveau provincial" icon="region" color="blue" />
        <StatCard label="Coordinations sous-provinciales" value={fmt(stats.coordinationsSousProvinciales)} hint="Niveau sous-provincial" icon="district" color="cyan" />
        <StatCard
          label="Taux de présence (30 j)"
          value={stats.presenceTaux === null ? '—' : `${stats.presenceTaux}%`}
          hint={`${fmt(stats.seances30j)} séance(s) enregistrée(s)`}
          icon="activity"
          color="emerald"
        />
        <StatCard label="Notifications" value={fmt(stats.notificationsNonLues)} hint="Non lues" icon="bell" color="amber" />
      </div>

      {/* ── Accès rapides ── */}
      {quickLinks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon name={link.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-slate-900">{link.label}</span>
                <span className="block truncate text-[10.5px] text-slate-400">{link.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Graphiques ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Écoles par province éducationnelle</h2>
          <div className="mt-4">
            {ecolesParProvinceEduc.length > 0 ? (
              <DonutChart
                data={ecolesParProvinceEduc.slice(0, 8)}
                centerValue={fmt(stats.totalEcoles)}
                centerLabel="écoles"
              />
            ) : (
              <p className="py-8 text-center text-[13px] text-slate-400">Aucune école EC-ERC enregistrée.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Vue nationale</h2>
          <div className="mt-4">
            <BarCompare
              items={[
                { label: 'Écoles', value: stats.totalEcoles, color: '#2563eb' },
                { label: 'Élèves', value: stats.totalEleves, color: '#3b82f6' },
                { label: 'Enseignants', value: stats.totalEnseignants, color: '#10b981' },
                { label: 'Coord. prov.', value: stats.coordinationsProvinciales, color: '#06b6d4' },
                { label: 'Coord. sous-prov.', value: stats.coordinationsSousProvinciales, color: '#8b5cf6' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Présences + activités ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Statistiques nationales des présences</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-400">30 derniers jours — données réelles</p>
          <div className="mt-4 space-y-3">
            {presences.length > 0 ? (
              presences.map((p) => {
                const pct = presenceTotal > 0 ? Math.round((p.value / presenceTotal) * 100) : 0;
                const color = p.label === 'ABSENT' ? 'bg-rose-500' : p.label === 'RETARD' ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={p.label}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      <span className="font-medium text-slate-700">{PRESENCE_LABELS[p.label] ?? p.label}</span>
                      <span className="tabular-nums text-slate-400">
                        {fmt(p.value)} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-[13px] text-slate-400">Aucune présence enregistrée sur la période.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Activité récente</h2>
          <div className="mt-4">
            <RecentActivity items={activite} accent="blue" />
          </div>
        </div>
      </div>

      {/* ── Provinces + notifications ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Rapports et activités des provinces</h2>
          <div className="mt-3 overflow-x-auto">
            {provinces.length > 0 ? (
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-semibold">Province</th>
                    <th className="py-2 pr-3 text-right font-semibold">Écoles</th>
                    <th className="py-2 text-right font-semibold">Élèves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {provinces.map((p) => (
                    <tr key={p.province}>
                      <td className="py-2 pr-3 font-medium text-slate-700">{p.province}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{fmt(p.ecoles)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{fmt(p.eleves)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-[13px] text-slate-400">Aucune école EC-ERC enregistrée.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">Notifications importantes</h2>
            <Link href="/notifications" className="text-[11.5px] font-semibold text-brand-600 hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.lu ? 'bg-slate-300' : 'bg-brand-500'}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">{n.titre}</p>
                      {n.message && <p className="mt-0.5 line-clamp-2 text-[11.5px] text-slate-500">{n.message}</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-[13px] text-slate-400">Aucune notification.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
