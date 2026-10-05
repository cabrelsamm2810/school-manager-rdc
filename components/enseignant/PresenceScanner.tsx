'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type ScannedEleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  etablissement?: string | null;
};

type ScanResult = {
  time: string;
  eleve: ScannedEleve;
  status: 'created' | 'updated' | 'alreadyPresent';
};

export function PresenceScanner({ onClose }: { onClose: () => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-container';
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [manualMatricule, setManualMatricule] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const lastScanTimeRef = useRef(0);
  const lastScannedValueRef = useRef('');
  const geoRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Demander la géolocalisation au montage
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geoRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGeoStatus('granted');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleScanResult = useCallback(async (scannedValue: string) => {
    // Anti-doublon: ignorer si même valeur dans les 3 dernières secondes
    const now = Date.now();
    if (scannedValue === lastScannedValueRef.current && now - lastScanTimeRef.current < 3000) {
      return;
    }
    lastScannedValueRef.current = scannedValue;
    lastScanTimeRef.current = now;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/presences/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scannedValue,
          latitude: geoRef.current?.latitude ?? null,
          longitude: geoRef.current?.longitude ?? null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors du scan');
        return;
      }

      const result: ScanResult = {
        time: new Date().toLocaleTimeString('fr-FR'),
        eleve: data.eleve,
        status: data.alreadyPresent ? 'alreadyPresent' : data.updated ? 'updated' : 'created',
      };

      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 50));
    } catch {
      setError('Erreur réseau lors du scan');
    } finally {
      setSubmitting(false);
    }
  }, []);

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
    } catch (err: any) {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions ou utilisez la saisie manuelle.');
    }
  }, [handleScanResult]);

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

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualMatricule.trim()) return;
    await handleScanResult(manualMatricule.trim());
    setManualMatricule('');
  }

  const presentCount = scanHistory.filter((s) => s.status === 'created').length;
  const updatedCount = scanHistory.filter((s) => s.status === 'updated').length;
  const alreadyCount = scanHistory.filter((s) => s.status === 'alreadyPresent').length;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
        <div className="my-4 w-full max-w-md">
          <div className="rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Scan de présence</h3>
                <p className="text-xs text-slate-500">Scannez le QR code de la carte scolaire</p>
              </div>
              <button
                onClick={() => { stopScanner(); onClose(); }}
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

              {geoStatus === 'granted' && (
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-blue-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  Géolocalisation activée
                </div>
              )}
              {geoStatus === 'denied' && (
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-amber-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  </svg>
                  Géolocalisation indisponible
                </div>
              )}

              {error && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              {/* Saisie manuelle */}
              <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={manualMatricule}
                  onChange={(e) => setManualMatricule(e.target.value)}
                  placeholder="Saisir le matricule manuellement"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={submitting || !manualMatricule.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  Marquer présent
                </button>
              </form>
            </div>

            {/* Dernier scan */}
            {lastScan && (
              <div className="mx-4 mb-3 rounded-xl border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {lastScan.eleve.nom} {lastScan.eleve.postNom} {lastScan.eleve.prenom}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lastScan.eleve.classe} — {lastScan.eleve.matricule} — {lastScan.time}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    lastScan.status === 'created' ? 'bg-green-100 text-green-700'
                    : lastScan.status === 'updated' ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500'
                  }`}>
                    {lastScan.status === 'created' ? 'Présent' : lastScan.status === 'updated' ? 'Mis à jour' : 'Déjà présent'}
                  </span>
                </div>
              </div>
            )}

            {/* Stats */}
            {scanHistory.length > 0 && (
              <div className="mx-4 mb-2 flex gap-2 text-xs">
                <span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700">
                  Nouveaux: {presentCount}
                </span>
                {updatedCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-700">
                    Mis à jour: {updatedCount}
                  </span>
                )}
                {alreadyCount > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
                    Déjà scannés: {alreadyCount}
                  </span>
                )}
              </div>
            )}

            {/* Historique des scans */}
            {scanHistory.length > 0 && (
              <div className="max-h-48 overflow-y-auto border-t border-slate-100 px-4 py-2">
                <div className="space-y-1.5">
                  {scanHistory.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                      <span className="font-medium text-slate-700">
                        {s.eleve.nom} {s.eleve.postNom} {s.eleve.prenom}
                        <span className="ml-1.5 text-xs text-slate-400">{s.eleve.classe}</span>
                      </span>
                      <span className="text-xs text-slate-400">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
