'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

type DayStat = {
  date: string;
  jour: string;
  total: number;
  presents: number;
  absents: number;
  taux: number | null;
};

const moisFr = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

export function PresenceStatsJour() {
  const [stats, setStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [jours, setJours] = useState(7);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/presences/stats?jours=${jours}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jours]);

  const maxTotal = Math.max(...stats.map((s) => s.total), 1);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getDate()} ${moisFr[d.getMonth()]}`;
  }

  return (
    <Card className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Présences par jour</h2>
        <select
          value={jours}
          onChange={(e) => setJours(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value={7}>7 jours</option>
          <option value={14}>14 jours</option>
          <option value={30}>30 jours</option>
        </select>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>
      ) : stats.every((s) => s.total === 0) ? (
        <p className="py-6 text-center text-sm text-slate-400">Aucune donnée de présence sur cette période.</p>
      ) : (
        <>
          {/* Graphique en barres groupées */}
          <div className="mt-4 flex items-end justify-between gap-1.5 sm:gap-2" style={{ minHeight: '120px' }}>
            {stats.map((s) => {
              const presentH = s.total > 0 ? (s.presents / maxTotal) * 100 : 0;
              const absentH = s.total > 0 ? (s.absents / maxTotal) * 100 : 0;
              return (
                <div key={s.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-col items-center justify-end" style={{ height: '100px' }}>
                    {/* Barre absents (rouge) en bas */}
                    {s.absents > 0 && (
                      <div
                        className="w-full max-w-[28px] rounded-t bg-red-400"
                        style={{ height: `${absentH}px` }}
                        title={`Absents: ${s.absents}`}
                      />
                    )}
                    {/* Barre présents (vert) au-dessus */}
                    {s.presents > 0 && (
                      <div
                        className={`w-full max-w-[28px] ${s.absents > 0 ? '' : 'rounded-t'} bg-green-500`}
                        style={{ height: `${presentH}px` }}
                        title={`Présents: ${s.presents}`}
                      />
                    )}
                    {s.total === 0 && (
                      <div className="flex h-full w-full max-w-[28px] items-center justify-center">
                        <span className="text-[10px] text-slate-300">—</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{s.jour}</span>
                  <span className="text-[10px] text-slate-500">{formatDate(s.date)}</span>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-500" />
              <span className="text-slate-600">Présents</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
              <span className="text-slate-600">Absents</span>
            </span>
          </div>

          {/* Tableau détaillé */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-2 pr-4 font-semibold">Jour</th>
                  <th className="pb-2 pr-4 font-semibold">Date</th>
                  <th className="pb-2 pr-4 font-semibold">Présents</th>
                  <th className="pb-2 pr-4 font-semibold">Absents</th>
                  <th className="pb-2 pr-4 font-semibold">Total</th>
                  <th className="pb-2 font-semibold">Taux</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.date} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-700">{s.jour}</td>
                    <td className="py-2 pr-4 text-slate-500">{formatDate(s.date)}</td>
                    <td className="py-2 pr-4">
                      <span className="font-medium text-green-600">{s.presents}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="font-medium text-red-600">{s.absents}</span>
                    </td>
                    <td className="py-2 pr-4 text-slate-500">{s.total}</td>
                    <td className="py-2">
                      {s.taux !== null ? (
                        <span className={`font-semibold ${s.taux >= 90 ? 'text-green-600' : s.taux >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {s.taux}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
