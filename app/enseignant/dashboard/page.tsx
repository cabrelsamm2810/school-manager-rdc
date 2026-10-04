'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHeader, StatCard, Card } from '@/components/ui/Card';

type ClassData = { classe: string; effectif: number };
type PresenceData = { classe: string; taux: number | null; totalRecords: number };
type DashboardData = {
  totalEleves: number;
  totalClasses: number;
  tauxGlobal: number | null;
  classes: ClassData[];
  tauxPresence: PresenceData[];
};

export default function EnseignantDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/enseignant/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Erreur de chargement');
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const maxEffectif = data ? Math.max(...data.classes.map((c) => c.effectif), 1) : 1;

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <PageHeader
            eyebrow="Espace enseignant"
            title="Tableau de bord"
            description="Suivi des effectifs par classe et taux de présence des élèves."
          />

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="btn-spinner h-8 w-8" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Statistiques générales */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <StatCard label="Élèves" value={String(data.totalEleves)} hint="Total inscrits" />
                <StatCard label="Classes" value={String(data.totalClasses)} hint="Toutes classes" />
                <StatCard
                  label="Taux de présence"
                  value={data.tauxGlobal !== null ? `${data.tauxGlobal}%` : '—'}
                  hint="30 derniers jours"
                />
                <StatCard
                  label="Moyenne/classe"
                  value={data.totalClasses > 0 ? String(Math.round(data.totalEleves / data.totalClasses)) : '0'}
                  hint="Élèves par classe"
                />
              </div>

              {/* Graphique : effectifs par classe */}
              <Card className="mt-5">
                <h2 className="text-base font-semibold text-slate-900">Effectifs par classe</h2>
                <div className="mt-4 space-y-3">
                  {data.classes.length === 0 && (
                    <p className="text-sm text-slate-400">Aucun élève enregistré.</p>
                  )}
                  {data.classes.map((c) => (
                    <div key={c.classe} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm text-slate-600">{c.classe}</span>
                      <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                        <div
                          className="flex h-full items-center justify-end rounded-lg bg-blue-600 px-2 text-xs font-bold text-white transition-all duration-500"
                          style={{ width: `${Math.max((c.effectif / maxEffectif) * 100, 8)}%` }}
                        >
                          {c.effectif}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Tableau : taux de présence par classe */}
              <Card className="mt-5">
                <h2 className="text-base font-semibold text-slate-900">Taux de présence par classe</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-2 pr-4 font-semibold">Classe</th>
                        <th className="pb-2 pr-4 font-semibold">Effectif</th>
                        <th className="pb-2 pr-4 font-semibold">Taux de présence</th>
                        <th className="pb-2 font-semibold">Barre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tauxPresence.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">Aucune donnée de présence.</td>
                        </tr>
                      )}
                      {data.tauxPresence.map((p) => {
                        const effectif = data.classes.find((c) => c.classe === p.classe)?.effectif ?? 0;
                        const taux = p.taux ?? 0;
                        const couleur = taux >= 90 ? 'bg-green-500' : taux >= 75 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <tr key={p.classe} className="border-b border-slate-50">
                            <td className="py-2.5 pr-4 font-medium text-slate-700">{p.classe}</td>
                            <td className="py-2.5 pr-4 text-slate-500">{effectif}</td>
                            <td className="py-2.5 pr-4">
                              {p.taux !== null ? (
                                <span className={`font-semibold ${taux >= 90 ? 'text-green-600' : taux >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {taux}%
                                </span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${couleur} transition-all duration-500`}
                                  style={{ width: `${taux}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
