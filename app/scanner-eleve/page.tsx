'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { QRScannerModal, type ScanResult } from '@/components/enseignant/QRScannerModal';
import { EleveScanFiche, type EleveScanne } from '@/components/enseignant/EleveScanFiche';
import { ScannerEleveHero } from '@/components/enseignant/ScannerEleveHero';
import { ScannerEleveGuide } from '@/components/enseignant/ScannerEleveGuide';
import { useSessionUser } from '@/lib/use-session-user';
import { signalScanSuccess } from '@/lib/scan-feedback';

const MESSAGE_INVALIDE = 'QR Code élève invalide ou introuvable.';
const MESSAGE_RESEAU = 'Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.';

const ELEVE_VIDE = { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' };

export default function ScannerElevePage() {
  const user = useSessionUser();
  const [showScanner, setShowScanner] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [eleve, setEleve] = useState<EleveScanne | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(true);
  const submittingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernierScanRef = useRef('');

  // État du réseau : le scan exige une connexion, rien n'est affiché hors ligne.
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    // Le scanner met fin à la caméra quand la fenêtre passe en arrière-plan.
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const rechercherEleve = useCallback(async (scannedValue: string) => {
    if (submittingRef.current) return;
    dernierScanRef.current = scannedValue;
    submittingRef.current = true;
    setSubmitting(true);

    if (!navigator.onLine) {
      setError(MESSAGE_RESEAU);
      setLastResult({ eleve: ELEVE_VIDE, status: 'alreadyPresent', error: MESSAGE_RESEAU });
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/enseignant/scan-eleve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannedValue }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.eleve) {
        const message = data?.error || MESSAGE_INVALIDE;
        setError(message);
        setLastResult({ eleve: ELEVE_VIDE, status: 'alreadyPresent', error: message });
        return;
      }

      // Détection réussie : retour visuel + sonore léger, puis fiche élève.
      const trouve = data.eleve as EleveScanne;
      signalScanSuccess();
      setError('');
      setEleve(trouve);
      // Confirmation dans le scanner pendant quelques instants, puis fiche élève.
      setLastResult({
        eleve: {
          id: trouve.id,
          matricule: trouve.matricule,
          nom: trouve.nom,
          postNom: trouve.postNom,
          prenom: trouve.prenom,
          classe: trouve.classe,
          ecole: trouve.ecole?.nom ?? null,
        },
        status: 'created',
      });
      closeTimerRef.current = setTimeout(() => {
        setShowScanner(false);
        setLastResult(null);
      }, 650);
    } catch {
      setError(MESSAGE_RESEAU);
      setLastResult({ eleve: ELEVE_VIDE, status: 'alreadyPresent', error: MESSAGE_RESEAU });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  const ouvrirScanner = useCallback(() => {
    setError('');
    setLastResult(null);
    setShowScanner(true);
  }, []);

  const retourScanner = useCallback(() => {
    setEleve(null);
    ouvrirScanner();
  }, [ouvrirScanner]);

  return (
    <AppShell>
      <div className="px-4 pb-6 pt-4 md:px-6 md:pt-6">
        <div className="mx-auto max-w-2xl">
          <ScannerEleveHero online={online} onScan={ouvrirScanner} />

          {/* Erreur de scan */}
          {error && !eleve && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{error}</p>
                <p className="mt-0.5 text-[12px] text-red-700/80">
                  Vérifiez qu'il s'agit bien d'une carte scolaire School Manager RDC, puis réessayez.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={ouvrirScanner}
                    disabled={!online}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Réessayer
                  </button>
                  {dernierScanRef.current && (
                    <button
                      type="button"
                      onClick={() => rechercherEleve(dernierScanRef.current)}
                      disabled={!online || submitting}
                      className="rounded-xl border border-red-300 px-3 py-2 text-[12px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      Relancer la recherche
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fiche élève */}
          {eleve && (
            <div className="mt-4">
              <EleveScanFiche eleve={eleve} role={user?.role} onScanAgain={retourScanner} />
            </div>
          )}

          {/* Guide d'utilisation et garanties */}
          {!eleve && (
            <div className="mt-4">
              <ScannerEleveGuide />
            </div>
          )}
        </div>
      </div>

      {/* Scanner plein écran */}
      {showScanner && (
        <QRScannerModal
          onScan={rechercherEleve}
          onClose={() => setShowScanner(false)}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn((value) => !value)}
          lastResult={lastResult}
          submitting={submitting}
          title="Scanner un QR Code"
          subtitle="Carte scolaire de l'élève"
          renderResult={(result) =>
            result.error ? (
              <p className="flex items-start gap-2 text-[13px] font-medium text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {result.error}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-[13px] font-medium text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                Élève identifié — {result.eleve.nom} {result.eleve.prenom}
              </p>
            )
          }
        />
      )}
    </AppShell>
  );
}
