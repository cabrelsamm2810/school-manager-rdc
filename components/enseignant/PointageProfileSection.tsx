'use client';

import { useEffect, useState } from 'react';

type Pointage = {
  id: string;
  jour: string;
  heureArrivee: string;
  statut: string;
};

/**
 * Section de profil affichant l'historique de pointage matinal de l'enseignant.
 * Ne se charge que pour le rôle ENSEIGNANT (le parent décide de le rendre).
 */
export function PointageProfileSection() {
  const [today, setToday] = useState<Pointage | null>(null);
  const [history, setHistory] = useState<Pointage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/enseignant/pointage')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setToday(data.today ?? null);
        setHistory(data.history ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-5 rounded-3xl bg-white p-5 shadow-soft md:p-6">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pointage matinal
      </h2>

      {/* Statut du jour */}
      <div className="mb-4">
        {today ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400">Arrivée du jour</p>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(today.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {today.statut === 'RETARD' && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    En retard
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400">Arrivée du jour</p>
              <p className="text-sm font-semibold text-slate-500">Pas encore pointé aujourd'hui</p>
            </div>
          </div>
        )}
      </div>

      {/* Historique 7 jours */}
      {history.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            7 derniers jours
          </h3>
          <div className="space-y-2">
            {history.map((h) => {
              const d = new Date(h.heureArrivee);
              const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });
              const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const isRetard = h.statut === 'RETARD';
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5"
                >
                  <span className="text-sm font-medium capitalize text-slate-700">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{heure}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isRetard ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isRetard ? 'Retard' : 'À l\'heure'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !today && (
          <p className="text-center text-xs text-slate-400">
            Aucun pointage enregistré pour le moment.
          </p>
        )
      )}
    </div>
  );
}
