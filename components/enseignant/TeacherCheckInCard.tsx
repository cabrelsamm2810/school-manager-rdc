'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Pointage = {
  id: string;
  jour: string;
  heureArrivee: string;
  statut: string;
};

type CheckInResponse = {
  today: Pointage | null;
  history: Pointage[];
};

/**
 * Carte de pointage matinal pour le professeur.
 * Le professeur scanne le QR code affiché à l'entrée de l'école pour marquer son arrivée.
 */
export function TeacherCheckInCard() {
  const [showScanner, setShowScanner] = useState(false);
  const [checkIn, setCheckIn] = useState<CheckInResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'teacher-qr-scanner';
  const lastScanRef = useRef<{ value: string; time: number }>({ value: '', time: 0 });

  const loadCheckIn = useCallback(async () => {
    try {
      const res = await fetch('/api/enseignant/pointage');
      if (!res.ok) return;
      const data: CheckInResponse = await res.json();
      setCheckIn(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckIn();
  }, [loadCheckIn]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScanResult = useCallback(
    async (scannedValue: string) => {
      const now = Date.now();
      if (scannedValue === lastScanRef.current.value && now - lastScanRef.current.time < 3000) return;
      lastScanRef.current = { value: scannedValue, time: now };

      setError('');
      setSuccess('');

      try {
        const res = await fetch('/api/enseignant/pointage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scannedValue }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Erreur lors du pointage');
          return;
        }

        const heure = new Date(data.pointage.heureArrivee).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const isRetard = data.statut === 'RETARD';
        setSuccess(
          isRetard
            ? `Pointage enregistré à ${heure} (en retard).`
            : `Pointage enregistré à ${heure}. Présent !`,
        );
        await stopScanner();
        setShowScanner(false);
        await loadCheckIn();
      } catch {
        setError('Erreur réseau lors du pointage');
      }
    },
    [stopScanner, loadCheckIn],
  );

  const startScanner = useCallback(async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => handleScanResult(decodedText),
        () => {},
      );
      setScanning(true);
    } catch {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }, [handleScanResult]);

  useEffect(() => {
    if (showScanner) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  const today = checkIn?.today;
  const isPointed = !!today;
  const heureArrivee = today
    ? new Date(today.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      <section className="mb-3 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        {/* En-tête dégradé vert */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight">Pointage matinal</h2>
              <p className="text-[11px] text-emerald-100">Scannez le QR de l'école à votre arrivée</p>
            </div>
          </div>
          {isPointed && (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              {today.statut === 'RETARD' ? 'En retard' : 'Présent'}
            </span>
          )}
        </div>

        {/* Corps */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <div className="btn-spinner h-5 w-5" />
            </div>
          ) : isPointed ? (
            /* ── Déjà pointé ── */
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-7 w-7 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">
                  Arrivée pointée à {heureArrivee}
                </p>
                <p className="text-xs text-slate-500">
                  {today.statut === 'RETARD' ? 'En retard' : 'À l\'heure'} — {today.jour}
                </p>
              </div>
            </div>
          ) : (
            /* ── Pas encore pointé ── */
            <button
              onClick={() => setShowScanner(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-15zM10 11h4" />
              </svg>
              Scanner mon arrivée
            </button>
          )}

          {/* Messages */}
          {success && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{success}</p>
          )}
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          {/* Historique récent */}
          {!loading && checkIn && checkIn.history.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                7 derniers jours
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {checkIn.history.map((h) => {
                  const d = new Date(h.heureArrivee);
                  const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
                  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={h.id}
                      className={`rounded-lg px-2.5 py-1.5 text-xs ${
                        h.statut === 'RETARD'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <span className="font-medium">{label}</span> · {heure}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Modal scanner ── */}
      {showScanner && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => { stopScanner(); setShowScanner(false); }} />
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
            <div className="my-4 w-full max-w-md">
              <div className="rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Pointage d'arrivée</h3>
                    <p className="text-xs text-slate-500">Scannez le QR code affiché à l'entrée</p>
                  </div>
                  <button
                    onClick={() => { stopScanner(); setShowScanner(false); }}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>

                {/* Scanner */}
                <div className="p-4">
                  <div id={containerId} className="mx-auto w-full max-w-xs overflow-hidden rounded-xl bg-slate-900" />

                  {scanning && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      Caméra active — en attente de scan...
                    </div>
                  )}

                  {error && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
