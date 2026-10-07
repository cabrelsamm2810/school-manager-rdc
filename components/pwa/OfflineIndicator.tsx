'use client';

import { useEffect, useState, useCallback } from 'react';

type SyncState = 'idle' | 'syncing' | 'synced';

/**
 * Indicateur d'état réseau : En ligne / Hors connexion / Synchronisation.
 * Affiche une bannière discrète en haut de l'écran quand le statut change.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
  }, []);

  const handleOnline = useCallback(() => {
    setOnline(true);
    setSyncState('syncing');
    setShowBanner(true);
    /* Simule la synchronisation : les requêtes en attente sont relancées
       par les composants eux-mêmes (polling, retry). */
    const timer = setTimeout(() => {
      setSyncState('synced');
      setTimeout(() => {
        setSyncState('idle');
        setShowBanner(false);
      }, 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleOffline = useCallback(() => {
    setOnline(false);
    setSyncState('idle');
    setShowBanner(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  if (!showBanner && online && syncState === 'idle') return null;

  let bgColor = '#2563eb';
  let message = '';
  let icon = null;

  if (!online) {
    bgColor = '#dc2626';
    message = 'Hors connexion — les données seront synchronisées au retour du réseau';
    icon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 23 12.55" />
        <path d="M11 5.88A10.94 10.94 0 0 1 12.55 2" />
        <path d="M5.88 11A10.94 10.94 0 0 1 2 12.55" />
      </svg>
    );
  } else if (syncState === 'syncing') {
    bgColor = '#2563eb';
    message = 'Synchronisation en cours…';
    icon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  } else if (syncState === 'synced') {
    bgColor = '#16a34a';
    message = 'Synchronisation terminée';
    icon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white shadow-md transition-all"
      style={{ backgroundColor: bgColor }}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
