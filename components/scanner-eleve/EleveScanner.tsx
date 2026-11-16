'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Icon } from '@/components/ui/Icon';

type Phase = 'starting' | 'active' | 'denied' | 'unavailable' | 'unsupported' | 'error';

type Props = {
  onClose: () => void;
  /** Reçoit la valeur du QR code dès qu'elle est détectée (aucun bouton à presser). */
  onDetect: (value: string) => void | Promise<void>;
  /** Passe à true pendant la vérification : les détections suivantes sont ignorées. */
  busy: boolean;
};

const READER_ID = 'eleve-qr-reader';

/** Court bip de confirmation + vibration légère (retour sonore et haptique). */
function feedbackSuccess() {
  try {
    navigator.vibrate?.(60);
  } catch {
    // haptique non disponible
  }
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.16);
    oscillator.onended = () => ctx.close().catch(() => {});
  } catch {
    // audio non disponible
  }
}

function classifyCameraError(error: unknown): Phase {
  const name = (error as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
    return 'unavailable';
  }
  return 'error';
}

const PHASE_MESSAGE: Record<Phase, string> = {
  starting: 'Ouverture de la caméra…',
  active: 'Placez le QR Code dans le cadre',
  denied: 'Accès caméra refusé. Autorisez la caméra dans les réglages du navigateur.',
  unavailable: 'Aucune caméra détectée sur cet appareil.',
  unsupported: 'La caméra n’est pas disponible sur ce navigateur.',
  error: 'Impossible d’ouvrir la caméra.',
};

/**
 * Scanner QR plein écran pour les cartes scolaires.
 * Détection automatique, cadre animé, flash si l'appareil le permet,
 * et saisie manuelle du matricule en secours.
 */
export function EleveScanner({ onClose, onDetect, busy }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);
  const busyRef = useRef(busy);
  const lastScanRef = useRef({ value: '', at: 0 });

  const [phase, setPhase] = useState<Phase>('starting');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleDecoded = useCallback(
    (value: string) => {
      if (busyRef.current) return;
      const now = Date.now();
      // Anti-doublon : la même carte n'est pas relue dans les 3 secondes.
      if (value === lastScanRef.current.value && now - lastScanRef.current.at < 3000) return;
      lastScanRef.current = { value, at: now };
      feedbackSuccess();
      void onDetect(value);
    },
    [onDetect],
  );

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      runningRef.current = false;
      return;
    }
    try {
      if (runningRef.current) await scanner.stop();
    } catch {
      // Arrêt déjà effectué
    }
    runningRef.current = false;
    try {
      scanner.clear();
    } catch {
      // « Cannot clear while scan is ongoing »
    }
  }, []);

  const startScanner = useCallback(async () => {
    setPhase('starting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('unsupported');
      return;
    }

    // Autorisation caméra demandée explicitement, avant de créer le lecteur :
    // un échec de `start()` déclenche un `stop()` interne qui lève une erreur
    // hors de tout try/catch dans html5-qrcode.
    let probe: MediaStream;
    try {
      probe = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
    } catch (error) {
      setPhase(classifyCameraError(error));
      return;
    }
    probe.getTracks().forEach((track) => track.stop());

    const scanner = new Html5Qrcode(READER_ID, { verbose: false });
    const internals = scanner as unknown as {
      renderedCamera?: unknown;
      getRenderedCameraOrFail: () => unknown;
    };
    const noopCamera = {
      applyVideoConstraints: () => Promise.resolve(),
      getRunningTrackCapabilities: () => ({}),
      getRunningTrackSettings: () => ({}),
      getCapabilities: () => ({}),
    };
    internals.getRenderedCameraOrFail = function () {
      return internals.renderedCamera ?? noopCamera;
    };
    const originalStop = scanner.stop.bind(scanner);
    scanner.stop = function () {
      return runningRef.current ? originalStop() : Promise.resolve();
    };
    const originalApply = scanner.applyVideoConstraints.bind(scanner);
    scanner.applyVideoConstraints = function (constraints: MediaTrackConstraints) {
      return runningRef.current ? originalApply(constraints) : Promise.resolve();
    };
    const originalClear = scanner.clear.bind(scanner);
    scanner.clear = function () {
      try {
        originalClear();
      } catch {
        // ignoré
      }
    };
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decodedText: string) => handleDecoded(decodedText),
        () => {},
      );
      runningRef.current = true;
      setPhase('active');
      try {
        const capabilities = scanner.getRunningTrackCapabilities() as { torch?: boolean } | undefined;
        setTorchAvailable(Boolean(capabilities?.torch));
      } catch {
        setTorchAvailable(false);
      }
    } catch (error) {
      setPhase(classifyCameraError(error));
    }
  }, [handleDecoded]);

  useEffect(() => {
    void startScanner();
    return () => {
      void stopScanner();
    };
    // Démarrage unique à l'ouverture du scanner.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // html5-qrcode abandonne parfois en levant une chaîne (pas une Error) dans un
  // callback interne : on l'isole pour que l'erreur ne remonte pas au boundary.
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (event.message?.includes?.('Scanning is not in running state')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = typeof event.reason === 'string' ? event.reason : String(event.reason ?? '');
      if (reason.includes('Scanning is not in running state')) event.preventDefault();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    const next = !torchOn;
    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
      setTorchOn(false);
    }
  }, [torchOn]);

  const close = useCallback(() => {
    void stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const value = manualValue.trim();
    if (!value) return;
    setManualValue('');
    void onDetect(value);
  }

  const cameraActive = phase === 'active';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scanner QR Code élève"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950"
    >
      {/* En-tête */}
      <div className="relative z-20 flex items-start justify-between gap-3 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">
            Carte scolaire
          </p>
          <h2 className="mt-0.5 text-base font-bold text-white">Scanner un QR Code élève</h2>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer le scanner"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>

      {/* Zone caméra + cadre de scan */}
      <div className="relative flex-1 overflow-hidden">
        <div
          id={READER_ID}
          className={`h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover ${
            cameraActive ? '' : 'opacity-0'
          }`}
        />

        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-60 w-60 sm:h-64 sm:w-64">
              {/* Cadre à coins arrondis */}
              <div className="absolute inset-0 rounded-[28px] border border-white/25" />
              <div className="absolute -left-0.5 -top-0.5 h-9 w-9 rounded-tl-[22px] border-l-4 border-t-4 border-brand-400" />
              <div className="absolute -right-0.5 -top-0.5 h-9 w-9 rounded-tr-[22px] border-r-4 border-t-4 border-brand-400" />
              <div className="absolute -bottom-0.5 -left-0.5 h-9 w-9 rounded-bl-[22px] border-b-4 border-l-4 border-brand-400" />
              <div className="absolute -bottom-0.5 -right-0.5 h-9 w-9 rounded-br-[22px] border-b-4 border-r-4 border-brand-400" />
              {/* Ligne de balayage */}
              <div className="absolute left-3 right-3 top-0 h-[3px] animate-[scanline_2.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-brand-300 to-transparent shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
              {/* Vignette autour du cadre */}
              <div className="absolute inset-0 rounded-[28px] shadow-[0_0_0_9999px_rgba(2,6,23,0.55)]" />
            </div>
          </div>
        )}

        {/* États non actifs */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            {phase === 'starting' ? (
              <div className="btn-spinner h-9 w-9 border-white/30 border-t-white" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
                <Icon name={phase === 'denied' ? 'lock' : 'camera'} className="h-7 w-7" />
              </div>
            )}
            <p className="text-sm font-medium text-white/85">{PHASE_MESSAGE[phase]}</p>
            {(phase === 'denied' || phase === 'error') && (
              <button
                type="button"
                onClick={() => void startScanner()}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Réessayer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barre d'actions */}
      <div className="relative z-20 space-y-3 border-t border-white/10 bg-slate-950/95 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {!online && (
          <p className="flex items-center gap-2 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-300">
            <Icon name="alert" className="h-4 w-4 shrink-0" />
            Hors ligne — la vérification de l’élève nécessite une connexion.
          </p>
        )}

        {busy && (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-brand-300">
            <span className="btn-spinner h-4 w-4 border-white/30 border-t-brand-300" />
            Vérification de l’élève…
          </p>
        )}

        {!busy && (
          <p className="text-center text-xs text-white/55">
            Détection automatique — aucun bouton à presser.
          </p>
        )}

        <div className="flex items-center gap-2">
          {torchAvailable ? (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              aria-pressed={torchOn}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                torchOn
                  ? 'border-amber-300 bg-amber-400 text-slate-900'
                  : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <Icon name="activity" className="h-4 w-4" />
              {torchOn ? 'Flash activé' : 'Activer le flash'}
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs text-white/40">
              <Icon name="activity" className="h-4 w-4" />
              Flash non disponible
            </div>
          )}

          <button
            type="button"
            onClick={() => setManualOpen((open) => !open)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Icon name="edit" className="h-4 w-4" />
            Matricule
          </button>
        </div>

        {manualOpen && (
          <form onSubmit={submitManual} className="flex gap-2">
            <input
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              inputMode="text"
              autoComplete="off"
              placeholder="Saisir le matricule de l’élève"
              aria-label="Matricule de l’élève"
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              Rechercher
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
