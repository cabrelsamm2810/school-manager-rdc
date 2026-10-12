'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { canAccessPath } from '@/lib/route-access';
import { GeoLocationMap } from '@/components/ecoles/GeoLocationMap';
import { StatCard } from './StatCard';
import { DonutChart, BarCompare } from './Charts';
import { RecentActivity } from './RecentActivity';
import type { BreakdownItem, ChartItem, DashboardStats } from './types';

export function SchoolDashboard({ stats, breakdown, chartData, activite, role, ecoleGeo, ecoleId }: {
  stats: DashboardStats;
  breakdown: BreakdownItem[];
  chartData: ChartItem[];
  activite: string[];
  role: string;
  ecoleGeo: { latitude: number | null; longitude: number | null } | null;
  ecoleId: string | null;
}) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  const [geo, setGeo] = useState<{ latitude: number | null; longitude: number | null } | null>(ecoleGeo);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoSaved, setGeoSaved] = useState(false);

  function handleLocate() {
    if (!ecoleId) return;
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setLocating(true);
    setGeoError('');
    setGeoSaved(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/ecoles/${ecoleId}/geolocation`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.error || 'Échec de l\'enregistrement');
          }
          setGeo({ latitude, longitude });
          setGeoSaved(true);
        } catch (err: any) {
          setGeoError(err.message || 'Échec de l\'enregistrement');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setGeoError(err.message || 'Impossible d\'obtenir votre position.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Un raccourci ne doit jamais pointer vers une route fermée au rôle.
  const shortcuts = [
    { href: '/eleves', icon: 'users', label: 'Gérer les élèves' },
    { href: '/cahier-de-notes', icon: 'notebook', label: 'Cahier de notes' },
    { href: '/cartes-qr', icon: 'qr', label: 'Cartes QR' },
    { href: '/documents-officiels', icon: 'document', label: 'Documents officiels' }
  ].filter((shortcut) => canAccessPath(role, shortcut.href));

  return (
    <>
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-brand-600">Tableau de bord de l'école</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">Mon école</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Vue d'ensemble de votre école — élèves, classes et activité scolaire.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Élèves" value={fmt(stats.totalEleves)} hint="Inscrits cette année" icon="users" color="blue" delay={0} />
        <StatCard label="Enseignants" value={fmt(stats.totalEnseignants)} hint="Actifs" icon="teacher" color="emerald" delay={0.06} />
        <StatCard label="Classes" value={fmt(stats.totalClasses)} hint="Tous niveaux" icon="notebook" color="amber" delay={0.12} />
        <StatCard label="Documents" value={fmt(stats.totalDocuments)} hint="Dossiers numérisés" icon="document" color="cyan" delay={0.18} />
        <StatCard label="Dossiers" value={fmt(stats.totalDossiers)} hint="Traités / en cours" icon="folder" color="rose" delay={0.24} />
        <StatCard label="Notifications" value={fmt(stats.totalNotifications)} hint="Non lues" icon="bell" color="violet" delay={0.3} />
      </div>

      {/* ── Graphiques récapitulatifs ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Effectifs d'élèves par classe</h2>
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
                { label: 'Classes', value: stats.totalClasses, color: '#f59e0b' },
                { label: 'Dossiers', value: stats.totalDossiers, color: '#f43f5e' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Géolocalisation de l'école ── */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="location" className="h-5 w-5 text-amber-600" />
            <h2 className="text-[15px] font-semibold text-slate-900">Localisation de l'école</h2>
          </div>
          {ecoleId && (
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-[13px] font-medium text-amber-600 transition hover:bg-amber-100 disabled:opacity-50"
            >
              {locating ? (
                <span className="btn-spinner h-4 w-4" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              Ma position
            </button>
          )}
        </div>
        <div className="mt-4">
          <GeoLocationMap latitude={geo?.latitude ?? null} longitude={geo?.longitude ?? null} />
        </div>
        {geoError && (
          <p className="mt-2 text-[13px] text-red-600">{geoError}</p>
        )}
        {geoSaved && (
          <p className="mt-2 text-[13px] text-emerald-600">✓ Position GPS enregistrée.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Répartition par classe */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Effectifs par classe</h2>
          <div className="mt-4 space-y-2.5">
            {breakdown.length > 0 ? breakdown.map((item) => {
              const maxVal = Math.max(...breakdown.map((b) => b.value), 1);
              const pct = Math.round((item.value / maxVal) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-400">{item.value} {item.sublabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-[13px] text-slate-400">Aucun élève enregistré</p>
            )}
          </div>
        </div>

        {/* Activité récente + raccourcis */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Activité récente</h2>
          <div className="mt-4">
            <RecentActivity items={activite} accent="amber" />
          </div>
          {shortcuts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {shortcuts.map((shortcut, index) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className={index === 0
                    ? 'flex min-h-[40px] items-center gap-2 rounded-full bg-amber-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-amber-700'
                    : 'flex min-h-[40px] items-center gap-2 rounded-full border border-amber-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-amber-600 transition hover:bg-amber-50'}
                >
                  <Icon name={shortcut.icon} className="h-4 w-4" /> {shortcut.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
