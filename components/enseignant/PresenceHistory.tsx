'use client';

import { useEffect, useState } from 'react';

type Seance = {
  id: string;
  classe: string;
  matiere: string;
  date: string;
  statut: string;
  enseignantNom: string;
  _count?: { presences: number };
};

type Props = {
  onOpenSeance: (seance: Seance) => void;
  onBack: () => void;
};

export function PresenceHistory({ onOpenSeance, onBack }: Props) {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/presences/seances?periode=${periode}`)
      .then((r) => (r.ok ? r.json() : { seances: [] }))
      .then((data) => setSeances(data.seances || []))
      .catch(() => setSeances([]))
      .finally(() => setLoading(false));
  }, [periode]);

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* En-tête */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 to-blue-600 px-4 pb-4 pt-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg p-1.5 transition hover:bg-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Historique des présences</h1>
        </div>

        {/* Filtres période */}
        <div className="mt-3 flex gap-2">
          {(['jour', 'semaine', 'mois', 'annee'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                periode === p
                  ? 'bg-white text-blue-700'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {p === 'jour' ? 'Jour' : p === 'semaine' ? 'Semaine' : p === 'mois' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des séances */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="btn-spinner h-8 w-8" />
          </div>
        ) : seances.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">Aucune séance de présence sur cette période.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seances.map((seance) => {
              const dateObj = new Date(seance.date);
              const dateStr = dateObj.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const heureStr = dateObj.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <button
                  key={seance.id}
                  onClick={() => onOpenSeance(seance)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <span className="text-lg font-bold">{dateObj.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {seance.classe} — {seance.matiere || 'Appel'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dateStr} · {heureStr}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {seance.statut === 'TERMINEE' ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Terminé
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        En cours
                      </span>
                    )}
                    {seance._count?.presences != null && (
                      <span className="text-xs text-slate-400">{seance._count.presences} élèves</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
