'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  CircleCheck,
  Keyboard,
  LoaderCircle,
  RefreshCw,
  ScanLine,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';

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
  title?: string;
  subtitle?: string;
  renderResult?: (result: ScanResult) => React.ReactNode;
};

type CameraState = 'requesting' | 'running' | 'denied' | 'unavailable' | 'error';

const CONTAINER_ID = 'qr-presence-scanner';

/** Traduit une erreur DOMException de getUserMedia en message clair. */
function describeCameraError(error: unknown): { state: CameraState; message: string } {
  const name = (error as DOMException)?.name ?? '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return {
        state: 'denied',
        message:
          'Accès refusé à la caméra. Autorisez la caméra pour ce site dans les réglages du navigateur, puis réessayez.',
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return {
        state: 'unavailable',
        message: 'Aucune caméra détectée sur cet appareil. Vous pouvez saisir le matricule manuellement.',
      };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        state: 'error',
        message: 'La caméra est déjà utilisée par une autre application. Fermez-la, puis réessayez.',
      };
    default:
      return {
        state: 'error',
        message: 'Impossible de démarrer la caméra. Réessayez ou saisissez le matricule manuellement.',
      };
  }
}

/**
 * Scanner QR plein écran (carte scolaire, appel de présence).
 *
 * - Demande l'autorisation caméra et explique clairement chaque refus.
 * - Cadre de scan avec animation de balayage, détection automatique (aucun
 *   bouton à appuyer).
 * - Bouton flash affiché uniquement si l'appareil expose la torche.
 * - Repli de saisie manuelle si la caméra est indisponible.
 */
export function QRScannerModal({
  onScan,
  onClose,
  flashOn,
  onToggleFlash,
  lastResult,
  submitting,
  title = 'Scan de présence',
  subtitle = 'Scannez le QR code de la carte scolaire',
  renderResult,
}: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);
  const submittingRef = useRef(submitting);
  const lastScanRef = useRef({ value: '', at: 0 });

  const [camera, setCamera] = useState<CameraState>('requesting');
  const [message, setMessage] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualMatricule, setManualMatricule] = useState('');

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const handleScanResult = useCallback(
    async (decodedText: string) => {
      if (submittingRef.current) return;
      // Anti-doublon : la caméra redécode la même image plusieurs fois par seconde.
      const now = Date.now();
      if (decodedText === lastScanRef.current.value && now - lastScanRef.current.at < 3000) return;
      lastScanRef.current = { value: decodedText, at: now };
      try {
        await onScan(decodedText);
      } catch {
        // L'appelant gère l'affichage de l'erreur
      }
    },
    [onScan],
  );

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (runningRef.current) await scanner.stop();
    } catch {
      // ignore
    }
    runningRef.current = false;
    try {
      scanner.clear();
    } catch {
      // « Cannot clear while scan is ongoing » : ignoré si le scanner n'a pas démarré
    }
  }, []);

  const startScanner = useCallback(async () => {
    await stopScanner();
    setMessage('');
    setCamera('requesting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable');
      setMessage(
        'La caméra est indisponible dans ce navigateur (connexion non sécurisée). Saisissez le matricule manuellement.',
      );
      return;
    }

    // 1. Demande explicite de l'autorisation, pour distinguer « refusée » de
    //    « appareil absent » — html5-qrcode ne le fait pas assez clairement.
    let probeStream: MediaStream;
    try {
      probeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
    } catch (error) {
      const { state, message: text } = describeCameraError(error);
      setCamera(state);
      setMessage(text);
      return;
    }
    probeStream.getTracks().forEach((track) => track.stop());

    // 2. Démarrage du décodeur (détection automatique, sans bouton).
    try {
      const scanner = new Html5Qrcode(CONTAINER_ID, {
        verbose: false,
        // Décodeur natif du navigateur quand il existe : nettement plus rapide
        // sur Android (BarcodeDetector), repli automatique sinon.
        useBarCodeDetectorIfSupported: true,
      });

      // html5-qrcode lève « Scanning is not in running state » (sous forme de
      // chaîne, hors de tout try/catch) quand stop() ou applyVideoConstraints()
      // sont appelés avant que la caméra n'ait démarré : cela remonte jusqu'au
      // ErrorBoundary de Next.js et démonte toute la page. On neutralise ces
      // appels tant que le scanner n'est pas réellement en marche.
      const noopCamera = {
        applyVideoConstraints: () => Promise.resolve(),
        getRunningTrackCapabilities: () => ({}),
        getRunningTrackSettings: () => ({}),
        getCapabilities: () => ({}),
      };
      const internals = scanner as unknown as {
        renderedCamera: unknown;
        getRenderedCameraOrFail: () => typeof noopCamera;
      };
      internals.getRenderedCameraOrFail = function () {
        return (internals.renderedCamera as typeof noopCamera) ?? noopCamera;
      };

      const originalStop = scanner.stop.bind(scanner);
      scanner.stop = function () {
        if (!runningRef.current) return Promise.resolve();
        return originalStop();
      };

      const originalApply = scanner.applyVideoConstraints.bind(scanner);
      scanner.applyVideoConstraints = function (constraints: MediaTrackConstraints) {
        if (!runningRef.current) return Promise.resolve();
        return originalApply(constraints);
      };

      const originalClear = scanner.clear.bind(scanner);
      scanner.clear = function () {
        try {
          originalClear();
        } catch {
          // « Cannot clear while scan is ongoing »
        }
      };

      scannerRef.current = scanner;

      await Promise.race([
        scanner.start(
          { facingMode: 'environment' },
          { fps: 10 },
          (decodedText: string) => handleScanResult(decodedText),
          () => {},
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('camera-timeout')), 10000),
        ),
      ]);

      runningRef.current = true;
      setCamera('running');

      // Torche : uniquement si la piste vidéo l'expose réellement.
      try {
        const capabilities = scanner.getRunningTrackCapabilities() as { torch?: boolean };
        setTorchSupported(Boolean(capabilities?.torch));
        if (flashOn && capabilities?.torch) {
          await scanner.applyVideoConstraints({
            advanced: [{ torch: true } as MediaTrackConstraintSet],
          });
        }
      } catch {
        setTorchSupported(false);
      }
    } catch (error) {
      await stopScanner();
      setCamera('error');
      setMessage(
        (error as Error)?.message === 'camera-timeout'
          ? 'La caméra met trop de temps à répondre. Fermez les autres applications, puis réessayez.'
          : 'Impossible de démarrer la caméra. Réessayez ou saisissez le matricule manuellement.',
      );
    }
  }, [flashOn, handleScanResult, stopScanner]);

  // Interception des erreurs hors try/catch levées par html5-qrcode (chaînes
  // d'erreur rejetées dans ses callbacks asynchrones).
  useEffect(() => {
    const shouldIgnore = (value: unknown) =>
      String(value ?? '').includes('Scanning is not in running state');
    const onError = (event: ErrorEvent) => {
      if (shouldIgnore(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (shouldIgnore(event.reason)) event.preventDefault();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Démarrage / arrêt de la caméra avec le cycle de vie de la fenêtre.
  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flash (torche) : appliqué seulement si l'appareil le permet.
  useEffect(() => {
    if (camera !== 'running' || !torchSupported) return;
    scannerRef.current
      ?.applyVideoConstraints({ advanced: [{ torch: flashOn } as MediaTrackConstraintSet] })
      .catch(() => {});
  }, [flashOn, torchSupported, camera]);

  // Fermeture au clavier, comme les autres surfaces de l'application.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void stopScanner().then(onClose);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, stopScanner]);

  async function handleClose() {
    await stopScanner();
    onClose();
  }

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = manualMatricule.trim();
    if (!value || submitting) return;
    setManualMatricule('');
    await onScan(value);
  }

  const cameraMessage =
    camera === 'denied' ? (
      <div className="pointer-events-auto mx-4 max-w-sm rounded-2xl border border-amber-400/30 bg-slate-900/90 p-4 text-center backdrop-blur">
        <CameraOff className="mx-auto h-8 w-8 text-amber-300" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-white">Caméra non autorisée</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{message}</p>
        <button
          type="button"
          onClick={startScanner}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Réessayer
        </button>
      </div>
    ) : camera === 'unavailable' || camera === 'error' ? (
      <div className="pointer-events-auto mx-4 max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-center backdrop-blur">
        <CameraOff className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-white">Caméra indisponible</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{message}</p>
        <button
          type="button"
          onClick={startScanner}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Réessayer
        </button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-2 text-center">
        <LoaderCircle className="h-6 w-6 animate-spin text-brand-300" aria-hidden />
        <p className="text-sm text-white/80">Activation de la caméra…</p>
        <p className="px-8 text-xs text-white/50">Autorisez l'accès à la caméra si le navigateur le demande.</p>
      </div>
    );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-sm" onClick={handleClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
      >
        {/* En-tête */}
        <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
              <ScanLine className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">{title}</h2>
              <p className="truncate text-[11px] text-white/60">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer le scanner"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {/* Zone caméra */}
        <div className="relative flex-1 overflow-hidden bg-black">
          <div
            id={CONTAINER_ID}
            className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
          />

          {camera === 'running' ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-square w-[min(72vw,272px)]">
                {/* Masque sombre autour du cadre */}
                <div className="absolute inset-0 rounded-[1.75rem] shadow-[0_0_0_100vmax_rgba(2,6,23,0.7)]" />
                <div className="absolute inset-0 rounded-[1.75rem] border border-white/25" />

                {/* Coins du cadre */}
                {[
                  'left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-[1.75rem]',
                  'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-[1.75rem]',
                  'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[1.75rem]',
                  'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[1.75rem]',
                ].map((classes) => (
                  <span
                    key={classes}
                    aria-hidden
                    className={`absolute h-12 w-12 border-brand-400/90 ${classes}`}
                  />
                ))}

                {/* Ligne de balayage */}
                <span
                  aria-hidden
                  className="absolute inset-x-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-brand-300 to-transparent shadow-[0_0_14px_rgba(96,165,250,0.95)] animate-[scanline_2.4s_ease-in-out_infinite]"
                />

                {/* Repère central discret */}
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/15"
                />
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{cameraMessage}</div>
          )}

          {camera === 'running' && (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] font-medium text-white/75">
              Placez le QR Code dans le cadre — la détection est automatique
            </p>
          )}
        </div>

        {/* Panneau inférieur */}
        <div className="space-y-3 border-t border-white/10 bg-slate-900 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {lastResult && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl px-3 py-2.5 ${
                lastResult.error
                  ? 'bg-red-500/15 text-red-300'
                  : lastResult.status === 'alreadyPresent'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {renderResult ? (
                renderResult(lastResult)
              ) : lastResult.error ? (
                <p className="text-[13px] font-medium">{lastResult.error}</p>
              ) : (
                <p className="flex items-center gap-2 text-[13px] font-medium">
                  <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                  {lastResult.eleve.nom} {lastResult.eleve.postNom} {lastResult.eleve.prenom}
                  {lastResult.status === 'alreadyPresent' ? ' — déjà enregistré' : ' — Présent'}
                </p>
              )}
            </div>
          )}

          {submitting && (
            <p className="flex items-center justify-center gap-2 text-[13px] font-medium text-brand-300">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Recherche de l'élève…
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManual((open) => !open)}
              aria-expanded={showManual}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 text-[13px] font-semibold text-white transition hover:bg-white/20"
            >
              <Keyboard className="h-4 w-4" aria-hidden />
              Matricule
            </button>

            {torchSupported && (
              <button
                type="button"
                onClick={onToggleFlash}
                aria-pressed={flashOn}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition ${
                  flashOn
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {flashOn ? <Zap className="h-4 w-4" aria-hidden /> : <ZapOff className="h-4 w-4" aria-hidden />}
                {flashOn ? 'Flash activé' : 'Flash'}
              </button>
            )}

            <button
              type="button"
              onClick={startScanner}
              aria-label="Réactiver la caméra"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {showManual && (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                value={manualMatricule}
                onChange={(event) => setManualMatricule(event.target.value)}
                placeholder="Saisir le matricule"
                aria-label="Matricule de l'élève"
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/5 px-4 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400"
              />
              <button
                type="submit"
                disabled={submitting || !manualMatricule.trim()}
                className="rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                Rechercher
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
