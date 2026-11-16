'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/ui/Icon';
import { useSessionUser } from '@/lib/use-session-user';
import { EleveScanner } from '@/components/scanner-eleve/EleveScanner';
import { EleveFiche, type EleveScanne } from '@/components/scanner-eleve/EleveFiche';

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau puis réessayez.';
const INVALID_QR = 'QR Code élève invalide ou introuvable.';

export default function ScannerElevePage() {
  const user = useSessionUser();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eleve, setEleve] = useState<EleveScanne | null>(null);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const handleDetect = useCallback(async (scannedValue: string) => {
    setScannerOpen(false);
    setError('');
    setEleve(null);
    setLoading(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      setOffline(true);
      setError(NETWORK_ERROR);
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
        // Aucune donnée n'est affichée pour un code refusé : le serveur ne
        // renvoie jamais la fiche d'un élève hors du périmètre du rôle.
        setError(typeof data?.error === 'string' ? data.error : INVALID_QR);
        return;
      }

      setEleve(data.eleve as EleveScanne);
    } catch {
      setOffline(typeof navigator !== 'undefined' && !navigator.onLine);
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const openScanner = useCallback(() => {
    setError('');
    setScannerOpen(true);
  }, []);

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          {/* En-tête */}
          <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-5 py-5 text-white shadow-elevated">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Icon name="scan" className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
                  School Manager RDC
                </p>
                <h1 className="mt-0.5 text-xl font-bold leading-tight">Scanner QR Code Élève</h1>
                <p className="mt-1.5 text-[13px] leading-snug text-blue-100">
                  Scannez la carte scolaire pour afficher la fiche de l’élève en quelques secondes.
                </p>
              </div>
            </div>
            <div className="relative mt-4 flex flex-wrap gap-1.5 text-[11px] font-medium">
              <Chip icon="camera">Caméra du téléphone</Chip>
              <Chip icon="scan">Détection automatique</Chip>
              <Chip icon="lock">Identifiant sécurisé</Chip>
            </div>
          </header>

          {offline && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[13px] font-medium text-amber-900">
                Vous êtes hors ligne. La fiche élève sera vérifiée dès le retour du réseau.
              </p>
            </div>
          )}

          {/* Erreur de scan */}
          {error && !loading && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                  <Icon name="alert" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-900">{error}</p>
                  <p className="mt-0.5 text-xs text-red-700">
                    Vérifiez qu’il s’agit bien d’une carte scolaire de School Manager RDC.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openScanner}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Scanner à nouveau
              </button>
            </div>
          )}

          {/* Chargement */}
          {loading && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
              <div className="btn-spinner mx-auto h-8 w-8" />
              <p className="mt-3 text-sm font-medium text-slate-600">Recherche de l’élève…</p>
            </div>
          )}

          {/* Fiche élève */}
          {eleve && !loading && (
            <div className="mt-4">
              <EleveFiche eleve={eleve} role={user?.role} onRescan={openScanner} />
            </div>
          )}

          {/* État initial */}
          {!eleve && !loading && (
            <div className="mt-4 space-y-4">
              <button
                type="button"
                onClick={openScanner}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30 transition active:scale-[0.99]"
              >
                <Icon name="camera" className="h-5 w-5" />
                Scanner un QR Code
              </button>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Bon à savoir
                </p>
                <ul className="mt-2 space-y-2 text-[13px] leading-snug text-slate-600">
                  <li className="flex gap-2">
                    <Icon name="check-circle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Seuls les élèves de votre périmètre peuvent être consultés.
                  </li>
                  <li className="flex gap-2">
                    <Icon name="check-circle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Le QR Code ne contient aucune donnée personnelle.
                  </li>
                  <li className="flex gap-2">
                    <Icon name="check-circle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Aucune information financière n’est accessible ici.
                  </li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>

      {scannerOpen && (
        <EleveScanner
          onClose={() => setScannerOpen(false)}
          onDetect={handleDetect}
          busy={loading}
        />
      )}
    </AppShell>
  );
}

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
