'use client';

import { useCallback, useEffect, useState } from 'react';
import { QRScannerModal, type ScanResult } from '@/components/enseignant/QRScannerModal';
import { EleveFinancePanel } from '@/components/finances/EleveFinancePanel';
import {
  cacheSituation,
  readCachedSituation,
  readQueue,
  syncPendingPaiements,
} from '@/lib/offline-paiements';
import type { EleveSituation } from '@/lib/finance-types';

type SearchResult = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  ecole: string | null;
};

/** Extrait l'identifiant élève d'un QR signé (`SMRDC-ELEVE:id:expiration:signature`). */
function eleveIdFromScan(value: string): string | null {
  const raw = value.trim();
  return raw.startsWith('SMRDC-ELEVE:') ? raw.split(':')[1] || null : null;
}

/**
 * Identification rapide d'un élève pour la gestion des frais scolaires.
 * Le QR code de la carte scolaire ne contient qu'un identifiant signé : toutes
 * les données financières sont relues côté serveur après le scan.
 */
export function FinanceScannerPanel({ canPay }: { canPay: boolean }) {
  const [situation, setSituation] = useState<EleveSituation | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // ── File hors connexion ──
  const flushQueue = useCallback(async () => {
    if (readQueue().length === 0) {
      setPending(0);
      return;
    }
    setSyncing(true);
    try {
      const { pending: restant } = await syncPendingPaiements();
      setPending(restant);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    setPending(readQueue().length);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (offline) return;
    flushQueue();
  }, [offline, flushQueue]);

  function refreshPending() {
    setPending(readQueue().length);
  }

  // ── Scan / recherche ──
  const handleScan = useCallback(async (value: string) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/finances/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannedValue: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        const cached = eleveIdFromScan(value) ? readCachedSituation(eleveIdFromScan(value)!) : null;
        if (cached) {
          setSituation(cached);
          setScanOpen(false);
          return;
        }
        setLastScan({
          eleve: { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' },
          status: 'created',
          error: data.error ?? 'Élève introuvable.',
        });
        return;
      }

      cacheSituation(data.situation);
      setSituation(data.situation);
      setScanOpen(false);
    } catch {
      const id = eleveIdFromScan(value);
      const cached = id ? readCachedSituation(id) : null;
      if (cached) {
        setSituation(cached);
        setScanOpen(false);
        return;
      }
      setLastScan({
        eleve: { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' },
        status: 'created',
        error: 'Réseau indisponible et dossier non encore consulté sur cet appareil.',
      });
    } finally {
      setSubmitting(false);
    }
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError('Saisissez au moins deux caractères (nom, matricule ou identifiant).');
      return;
    }
    setError('');
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/finances/eleves?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Recherche impossible.');
        return;
      }
      setResults(data.eleves ?? []);
      if ((data.eleves ?? []).length === 0) setError('Aucun élève trouvé.');
    } catch {
      setError('Erreur réseau pendant la recherche.');
    } finally {
      setSearching(false);
    }
  }

  async function openEleve(id: string) {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/finances/eleves/${id}`);
      const data = await res.json();
      if (!res.ok) {
        const cached = readCachedSituation(id);
        if (cached) {
          setSituation(cached);
          return;
        }
        setError(data.error ?? 'Dossier introuvable.');
        return;
      }
      cacheSituation(data.situation);
      setSituation(data.situation);
      setResults([]);
    } catch {
      const cached = readCachedSituation(id);
      if (cached) setSituation(cached);
      else setError('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  }

  const refreshSituation = useCallback(() => {
    refreshPending();
    if (!situation) return;
    if (offline) return;
    fetch(`/api/finances/eleves/${situation.eleve.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.situation) {
          cacheSituation(data.situation);
          setSituation(data.situation);
        }
      })
      .catch(() => {});
  }, [situation, offline]);

  if (situation) {
    return (
      <EleveFinancePanel
        situation={situation}
        canPay={canPay}
        offline={offline}
        pendingCount={pending}
        onRefresh={refreshSituation}
        onClose={() => setSituation(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {(offline || pending > 0) && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
          <span>
            {offline ? 'Mode hors connexion — ' : ''}
            {pending > 0
              ? `${pending} paiement(s) en attente de synchronisation`
              : 'Les paiements seront synchronisés dès le retour du réseau'}
          </span>
          {!offline && pending > 0 && (
            <button
              onClick={flushQueue}
              disabled={syncing}
              className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {syncing ? 'Synchro…' : 'Synchroniser'}
            </button>
          )}
        </div>
      )}

      {/* Carte de scan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Frais scolaires</h2>
          <p className="mt-1 text-sm text-slate-500">
            Scannez la carte scolaire pour ouvrir le dossier financier de l&apos;élève
          </p>
        </div>

        <button
          onClick={() => {
            setLastScan(null);
            setScanOpen(true);
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-blue-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 019.07 4h5.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
          Scanner la carte élève
        </button>

        {/* Recherche manuelle */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Recherche manuelle
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, matricule ou identifiant"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={searching}
              className="flex-none rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {searching ? '…' : 'Chercher'}
            </button>
          </form>

          {error && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}

          {results.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {results.map((eleve) => (
                <li key={eleve.id}>
                  <button
                    onClick={() => openEleve(eleve.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {eleve.nom} {eleve.postNom} {eleve.prenom}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {eleve.classe} · {eleve.ecole ?? '—'} · {eleve.matricule}
                      </span>
                    </span>
                    <span className="flex-none text-xs font-semibold text-blue-600">Ouvrir</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {submitting && !scanOpen && (
        <p className="text-center text-xs text-slate-400">Chargement du dossier financier…</p>
      )}

      {scanOpen && (
        <QRScannerModal
          title="Scanner la carte élève"
          subtitle="Frais scolaires — le QR ne contient qu'un identifiant sécurisé"
          onScan={handleScan}
          onClose={() => setScanOpen(false)}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn((value) => !value)}
          lastResult={lastScan}
          submitting={submitting}
          renderResult={(result) =>
            result.error ? (
              <p className="text-sm font-medium text-red-300">⚠️ {result.error}</p>
            ) : (
              <p className="text-sm font-medium text-green-300">✓ Dossier financier ouvert</p>
            )
          }
        />
      )}

      <p className="text-center text-[11px] text-slate-400">
        Le QR code ne contient qu&apos;un identifiant signé — aucune donnée financière n&apos;y est stockée.
      </p>
    </div>
  );
}
