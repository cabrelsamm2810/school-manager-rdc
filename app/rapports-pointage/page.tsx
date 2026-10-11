'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PresenceChart } from '@/components/enseignant/PresenceChart';

type DailyRow = { jour: string; present: number; retard: number; absent: number; taux: number };
type WeeklyRow = { weekStart: string; present: number; retard: number; absent: number; taux: number };
type EnseignantRow = { id: string; nom: string; totalPointages: number; totalRetards: number };

type ReportData = {
  totalEnseignants: number;
  periode: { start: string; end: string; days: number };
  daily: DailyRow[];
  weekly: WeeklyRow[];
  enseignants: EnseignantRow[];
  filters: { classes: string[]; departements: string[] };
};

function formatDateFr(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', opts ?? { day: '2-digit', month: 'short' });
}

function TauxBadge({ taux }: { taux: number }) {
  const color =
    taux >= 90 ? 'bg-emerald-100 text-emerald-700' :
    taux >= 75 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{taux}%</span>;
}

export default function RapportsPointagePage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'day' | 'week'>('day');
  const [days, setDays] = useState(30);
  const [filterClasse, setFilterClasse] = useState('');
  const [filterDepartement, setFilterDepartement] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const filterQuery = [
    `days=${days}`,
    filterClasse && `classe=${encodeURIComponent(filterClasse)}`,
    filterDepartement && `departement=${encodeURIComponent(filterDepartement)}`,
    filterSearch && `search=${encodeURIComponent(filterSearch)}`,
  ].filter(Boolean).join('&');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rapports/pointage?${filterQuery}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { setError('Impossible de charger les rapports.'); return; }
        setData(d);
      })
      .catch(() => setError('Erreur de connexion.'))
      .finally(() => setLoading(false));
  }, [days, filterClasse, filterDepartement, filterSearch]);

  const [showExportMenu, setShowExportMenu] = useState(false);

  function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    window.open(`/api/rapports/pointage?${filterQuery}&export=${format}`, '_blank');
    setShowExportMenu(false);
  }

  // ── Stats de synthèse ──
  const todayEntry = data?.daily?.[data.daily.length - 1];
  const avgTaux = data && data.daily.length > 0
    ? Math.round(data.daily.reduce((s, d) => s + d.taux, 0) / data.daily.length)
    : 0;
  const totalRetards = data?.daily.reduce((s, d) => s + d.retard, 0) ?? 0;

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          {/* ── En-tête ── */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Rapports de présence</h1>
              <p className="text-sm text-slate-500">Taux de présence des enseignants — suivi comptable</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                disabled={loading || !data}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Exporter
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-lg ring-1 ring-slate-200">
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6h2m0 0V5h2m4 12H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                      </svg>
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-blue-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6h2m0 0V5h2m4 12H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                      </svg>
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-rose-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-rose-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6h2m0 0V5h2m4 12H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                      </svg>
                      PDF imprimable
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Filtres ── */}
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-400">Département</label>
                <select
                  value={filterDepartement}
                  onChange={(e) => setFilterDepartement(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                >
                  <option value="">Tous</option>
                  {data?.filters?.departements.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-400">Classe</label>
                <select
                  value={filterClasse}
                  onChange={(e) => setFilterClasse(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                >
                  <option value="">Toutes</option>
                  {data?.filters?.classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-400">Enseignant</label>
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                />
              </div>
              {(filterClasse || filterDepartement || filterSearch) && (
                <button
                  onClick={() => { setFilterClasse(''); setFilterDepartement(''); setFilterSearch(''); }}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="btn-spinner h-8 w-8" />
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</div>
          )}

          {!loading && data && (
            <>
              {/* ── Cartes de synthèse ── */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 shadow-soft">
                  <p className="text-xs font-medium text-slate-400">Enseignants</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{data.totalEnseignants}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-soft">
                  <p className="text-xs font-medium text-slate-400">Taux moyen</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{avgTaux}%</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-soft">
                  <p className="text-xs font-medium text-slate-400">Retards (période)</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">{totalRetards}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-soft">
                  <p className="text-xs font-medium text-slate-400">Aujourd'hui</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {todayEntry ? `${todayEntry.present + todayEntry.retard}/${data.totalEnseignants}` : '—'}
                  </p>
                </div>
              </div>

              {/* ── Graphique visuel ── */}
              <div className="mt-5 rounded-3xl bg-white p-5 shadow-soft md:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 3 3 5-6" />
                  </svg>
                  Graphique de présence — {view === 'day' ? 'par jour' : 'par semaine'}
                </h2>
                <PresenceChart
                  rows={(view === 'day' ? data.daily : data.weekly).slice().reverse().map((row) => ({
                    label: view === 'day'
                      ? formatDateFr((row as DailyRow).jour, { day: '2-digit', month: 'short' })
                      : formatDateFr((row as WeeklyRow).weekStart, { day: '2-digit', month: 'short' }),
                    present: row.present,
                    retard: row.retard,
                    absent: row.absent,
                    taux: row.taux,
                  }))}
                  maxTotal={data.totalEnseignants}
                />
              </div>

              {/* ── Sélecteur période + vue ── */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
              {[
                { label: '7 jours', val: 7 },
                { label: '30 jours', val: 30 },
                { label: '90 jours', val: 90 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setDays(p.val)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    days === p.val
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('day')}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      view === 'day' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Par jour
                  </button>
                  <button
                    onClick={() => setView('week')}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      view === 'week' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Par semaine
                  </button>
                </div>
              </div>

              {/* ── Tableau ── */}
              <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-soft">
                {/* Desktop table */}
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 font-semibold">{view === 'day' ? 'Jour' : 'Semaine du'}</th>
                      <th className="px-5 py-3 text-center font-semibold">Présents</th>
                      <th className="px-5 py-3 text-center font-semibold">Retards</th>
                      <th className="px-5 py-3 text-center font-semibold">Absents</th>
                      <th className="px-5 py-3 text-center font-semibold">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(view === 'day' ? data.daily : data.weekly).slice().reverse().map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-slate-700">
                          {view === 'day'
                            ? formatDateFr((row as DailyRow).jour, { weekday: 'short', day: '2-digit', month: 'short' })
                            : formatDateFr((row as WeeklyRow).weekStart, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-center text-emerald-600 font-medium">{row.present}</td>
                        <td className="px-5 py-3 text-center text-amber-600 font-medium">{row.retard}</td>
                        <td className="px-5 py-3 text-center text-red-500 font-medium">{row.absent}</td>
                        <td className="px-5 py-3 text-center"><TauxBadge taux={row.taux} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="divide-y divide-slate-50 md:hidden">
                  {(view === 'day' ? data.daily : data.weekly).slice().reverse().map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 capitalize">
                          {view === 'day'
                            ? formatDateFr((row as DailyRow).jour, { weekday: 'long', day: '2-digit', month: 'short' })
                            : `Sem. du ${formatDateFr((row as WeeklyRow).weekStart, { day: '2-digit', month: 'short' })}`}
                        </p>
                        <div className="mt-1 flex gap-3 text-xs">
                          <span className="text-emerald-600">P: {row.present}</span>
                          <span className="text-amber-600">R: {row.retard}</span>
                          <span className="text-red-500">A: {row.absent}</span>
                        </div>
                      </div>
                      <TauxBadge taux={row.taux} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Détail par enseignant ── */}
              {data.enseignants.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-soft">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Détail par enseignant ({data.periode.days} jours)
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {data.enseignants.map((ens) => (
                      <div key={ens.id} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm font-medium text-slate-700">{ens.nom}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-600">{ens.totalPointages} pointages</span>
                          {ens.totalRetards > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                              {ens.totalRetards} retard{ens.totalRetards > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
