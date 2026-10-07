'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeCameraSwitchState } from 'html5-qrcode';

export type ScanResult = {
  eleve: {
    id: string;
    matricule: string;
    nom: string;
    postNom: string;
    prenom: string;
    classe: string;
    ecole?: string | null;
  };
  status: 'created' | 'alreadyPresent';
  error?: string;
};

type Props = {
  onScan: (value: string) => Promise<void>;
  onClose: () => void;
  flashOn: boolean;
  onToggleFlash: () => void;
  lastResult: ScanResult | null;
  submitting: boolean;
};

export function QRScannerModal({
  onScan,
  onClose,
  flashOn,
  onToggleFlash,
  lastResult,
  submitting,
}: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const containerId = 'qr-presence-scanner';
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualMatricule, setManualMatricule] = useState('');
  const lastScanTimeRef = useRef(0);
  const lastScannedValueRef = useRef('');

  const handleScanResult = useCallback(
    async (decodedText: string) => {
      // Anti-doublon: ignorer si même valeur dans les 3 dernières secondes
      const now = Date.now();
      if (decodedText === lastScannedValueRef.current && now - lastScanTimeRef.current < 3000) {
        return;
      }
      lastScannedValueRef.current = decodedText;
      lastScanTimeRef.current = now;
      await onScan(decodedText);
    },
    [onScan],
  );

  const startScanner = useCallback(async () => {
    setError('');
    try {
      // Vérifier l'accès caméra avant de créer le scanner Html5Qrcode.
      // Sans cela, l'échec de start() provoque un stop() interne qui lève
      // « Scanning is not in running state » en dehors de tout try/catch.
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Caméra non disponible. Utilisez la saisie manuelle ci-dessous.');
        return;
      }
      let probeStream: MediaStream;
      try {
        probeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        setError('Caméra inaccessible. Utilisez la saisie manuelle ci-dessous.');
        return;
      }
      probeStream.getTracks().forEach((t) => t.stop());

      const scanner = new Html5Qrcode(containerId, { verbose: false });
      // Empêcher la bibliothèque de lancer « Scanning is not in running state »
      // quand stop() ou applyVideoConstraints() est appelé alors que la caméra
      // n'a jamais démarré (l'erreur échappe au try/catch car levée en interne).
      const origStop = scanner.stop.bind(scanner);
      scanner.stop = function () {
        if (!isRunningRef.current) return Promise.resolve();
        return origStop();
      };
      const origApply = scanner.applyVideoConstraints.bind(scanner);
      scanner.applyVideoConstraints = function (constraints: MediaTrackConstraints) {
        if (!isRunningRef.current) return Promise.resolve();
        return origApply(constraints);
      };
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => handleScanResult(decodedText),
        () => {},
      );
      isRunningRef.current = true;
      setScanning(true);

      // Activer le flash si demandé
      if (flashOn) {
        try {
          await scanner.applyVideoConstraints({
            advanced: [{ torch: true } as MediaTrackConstraintSet],
          });
        } catch {
          // Flash non supporté
        }
      }
    } catch {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions ou utilisez la saisie manuelle.');
    }
  }, [handleScanResult, flashOn]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isRunningRef.current) {
          await scannerRef.current.stop();
          isRunningRef.current = false;
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Gérer le flash
  useEffect(() => {
    if (!scannerRef.current || !scanning) return;
    const scanner = scannerRef.current;
    if (flashOn) {
      scanner
        .applyVideoConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] })
        .catch(() => {});
    } else {
      scanner
        .applyVideoConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] })
        .catch(() => {});
    }
  }, [flashOn, scanning]);

  // Intercepter l'erreur « Scanning is not in running state » lancée par
  // html5-qrcode (sous forme de chaîne, pas d'Error) quand la caméra échoue.
  // Cette erreur échappe à tout try/catch car elle est levée en interne par
  // la bibliothèque dans un callback asynchrone.
  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes?.('Scanning is not in running state')) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      const reason = typeof e.reason === 'string' ? e.reason : String(e.reason ?? '');
      if (reason.includes('Scanning is not in running state')) {
        e.preventDefault();
      }
    };
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
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
    await onScan(manualMatricule.trim());
    setManualMatricule('');
  }

  return (
    <>
      {/* Overlay sombre */}
      <div className="fixed inset-0 z-40 bg-black/80" onClick={onClose} />

      {/* Modal scanner */}
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Scan de présence</h3>
            <p className="text-xs text-white/60">Scannez le QR code de la carte scolaire</p>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Zone de scan avec animation */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div id={containerId} className="h-full w-full" />

          {/* Overlay avec cadre de scan */}
          {scanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Cadre de scan */}
                <div className="h-56 w-56 rounded-2xl border-2 border-white/30" />
                {/* Coins animés */}
                <div className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-blue-400" />
                <div className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-blue-400" />
                {/* Ligne de scan animée */}
                <div className="absolute left-2 right-2 top-0 h-0.5 animate-[scanline_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              </div>
            </div>
          )}

          {/* Bouton flash */}
          {scanning && (
            <button
              onClick={onToggleFlash}
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition ${
                flashOn
                  ? 'bg-yellow-400 text-slate-900'
                  : 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 12.5a1 1 0 00.8 1.6H10l-2 7.9 8.5-10.5a1 1 0 00-.8-1.6H11l2-7.8z" />
                </svg>
                {flashOn ? 'Flash activé' : 'Flash'}
              </span>
            </button>
          )}
        </div>

        {/* Zone de résultat + saisie manuelle */}
        <div className="bg-slate-900 px-4 pb-6 pt-3">
          {error && (
            <p className="mb-3 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          {/* Dernier résultat */}
          {lastResult && (
            <div
              className={`mb-3 rounded-xl px-4 py-3 ${
                lastResult.error
                  ? 'bg-red-500/15'
                  : lastResult.status === 'alreadyPresent'
                    ? 'bg-amber-500/15'
                    : 'bg-green-500/15'
              }`}
            >
              {lastResult.error ? (
                <p className="text-sm font-medium text-red-300">⚠️ {lastResult.error}</p>
              ) : lastResult.status === 'alreadyPresent' ? (
                <p className="text-sm font-medium text-amber-300">
                  ⏱️ {lastResult.eleve.nom} {lastResult.eleve.postNom} {lastResult.eleve.prenom} — déjà enregistré
                </p>
              ) : (
                <p className="text-sm font-medium text-green-300">
                  ✅ {lastResult.eleve.nom} {lastResult.eleve.postNom} {lastResult.eleve.prenom} — Présent
                </p>
              )}
            </div>
          )}

          {submitting && (
            <div className="mb-3 flex items-center justify-center gap-2 text-sm text-blue-400">
              <div className="btn-spinner h-4 w-4" />
              Vérification...
            </div>
          )}

          {/* Saisie manuelle */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualMatricule}
              onChange={(e) => setManualMatricule(e.target.value)}
              placeholder="Saisie manuelle du matricule"
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              OK
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
