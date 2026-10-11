'use client';

import { useEffect, useState, useCallback } from 'react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Gère l'enregistrement du service worker, la détection des mises à jour
 * et l'affichage du prompt d'installation PWA.
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [updateReady, setUpdateReady] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installable, setInstallable] = useState(false);

  /* Enregistrement du service worker */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateReady(true);
                }
              });
            }
          });
        })
        .catch(() => undefined);
    }
  }, []);

  /* Écoute de l'événement d'installation */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* Mise à jour : recharge la page pour activer le nouveau SW */
  const applyUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage('SKIP_WAITING');
      });
    }
    window.location.reload();
  }, []);

  /* Installation : déclenche le prompt natif */
  const promptInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallable(false);
    }
    setInstallEvent(null);
  }, [installEvent]);

  return (
    <>
      {children}

      {/* Banner : nouvelle version disponible */}
      {updateReady && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl bg-blue-600 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="21 4 21 9 16 9" />
              </svg>
              <span>Nouvelle version disponible</span>
            </div>
            <button
              onClick={applyUpdate}
              className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/30"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      )}

      {/* Banner : installation PWA */}
      {installable && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl bg-slate-900 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>Installer l'application</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInstallable(false)}
                className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-white/60 transition hover:text-white"
              >
                Plus tard
              </button>
              <button
                onClick={promptInstall}
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold transition hover:bg-blue-700"
              >
                Installer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
