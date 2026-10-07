'use client';

import { useEffect, useState, useCallback } from 'react';
import { PresenceScanner } from './PresenceScanner';

type RecentScan = {
  id: string;
  eleveNom: string;
  eleveClasse: string;
  heureArrivee: string | null;
  statut: string;
};

/**
 * Carte de pointage QR — placée en haut du tableau de bord enseignant.
 * Bouton prominent pour ouvrir le scanner, + résumé des pointages du jour.
 */
export function PresenceCheckInCard() {
  const [showScanner, setShowScanner] = useState(false);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/presences?date=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      const presences = data.presences ?? [];
      const presents = presences.filter((p: { present: boolean }) => p.present);
      setTodayCount(presents.length);

      const recent: RecentScan[] = presents
        .slice(0, 5)
        .map((p: any) => ({
          id: p.id,
          eleveNom: `${p.eleve?.nom ?? ''} ${p.eleve?.postNom ?? ''} ${p.eleve?.prenom ?? ''}`.trim(),
          eleveClasse: p.eleve?.classe ?? p.classe ?? '',
          heureArrivee: p.heureArrivee ? new Date(p.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
          statut: p.statut ?? 'PRESENT',
        }));
      setRecentScans(recent);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  return (
    <>
      <section className="dash-card mb-3 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        {/* En-tête dégradé */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-15zM10 11h4" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight">Pointage de présence</h2>
              <p className="text-[11px] text-violet-100">Scannez le QR code de l'élève</p>
            </div>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
            {loading ? '…' : `${todayCount ?? 0} pointés`}
          </span>
        </div>

        {/* Corps */}
        <div className="p-4">
          <button
            onClick={() => setShowScanner(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-15zM10 11h4" />
            </svg>
            Scanner un QR code
          </button>

          {/* Pointages récents du jour */}
          {!loading && recentScans.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Derniers pointages
              </h3>
              <div className="space-y-1.5">
                {recentScans.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{s.eleveNom}</p>
                        <p className="text-[11px] text-slate-400">{s.eleveClasse}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {s.heureArrivee ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && todayCount === 0 && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Aucun pointage aujourd'hui. Scannez un QR code pour commencer.
            </p>
          )}
        </div>
      </section>

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <PresenceScanner onClose={() => { setShowScanner(false); loadToday(); }} />
        </div>
      )}
    </>
  );
}
