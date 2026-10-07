'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { QRScannerModal, type ScanResult } from './QRScannerModal';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  presenceId: string | null;
  statut: string | null;
  heureArrivee: string | null;
};

type Seance = {
  id: string;
  classe: string;
  matiere: string;
  enseignantNom: string;
  anneeScolaire: string;
  date: string;
  statut: string;
};

type Props = {
  seance: Seance;
  eleves: Eleve[];
  onBack: () => void;
  onTerminer: () => void;
};

const STATUTS = ['PRESENT', 'RETARD', 'ABSENT', 'JUSTIFIE'] as const;
type Statut = (typeof STATUTS)[number];

const STATUT_CONFIG: Record<Statut, { label: string; emoji: string; color: string; bg: string; text: string; ring: string }> = {
  PRESENT: { label: 'Présent', emoji: '🟢', color: 'green', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-500' },
  RETARD: { label: 'Retard', emoji: '🟠', color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-500' },
  ABSENT: { label: 'Absent', emoji: '🔴', color: 'red', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-500' },
  JUSTIFIE: { label: 'Justifié', emoji: '🔵', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-500' },
};

export function PresenceAppel({ seance, eleves: initialEleves, onBack, onTerminer }: Props) {
  const [eleves, setEleves] = useState(initialEleves);
  const [showScanner, setShowScanner] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [showConfirmTermine, setShowConfirmTermine] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Suivi de la connectivité
  useEffect(() => {
    const update = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) trySync();
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Beep sonore léger
  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio non disponible
    }
  }, []);

  // Synchronisation hors connexion
  const trySync = useCallback(async () => {
    const queueStr = localStorage.getItem(`presence_queue_${seance.id}`);
    if (!queueStr) return;
    const queue = JSON.parse(queueStr);
    if (!queue.length) return;

    setSyncing(true);
    try {
      const res = await fetch('/api/presences/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seanceId: seance.id, presences: queue }),
      });
      if (res.ok) {
        localStorage.removeItem(`presence_queue_${seance.id}`);
        setPendingSync(0);
        // Recharger les données
        const detailRes = await fetch(`/api/presences/seances/${seance.id}`);
        if (detailRes.ok) {
          const data = await detailRes.json();
          if (data.eleves) setEleves(data.eleves);
        }
      }
    } catch {
      // Toujours hors ligne
    } finally {
      setSyncing(false);
    }
  }, [seance.id]);

  // Compteurs en temps réel
  const counts = {
    PRESENT: 0,
    RETARD: 0,
    ABSENT: 0,
    JUSTIFIE: 0,
  };
  for (const e of eleves) {
    if (e.statut && e.statut in counts) {
      counts[e.statut as keyof typeof counts]++;
    }
  }
  const nonEnregistres = eleves.filter((e) => !e.statut).length;
  const total = eleves.length;

  // Scan QR
  const handleScan = useCallback(
    async (scannedValue: string) => {
      setSubmitting(true);
      try {
        if (isOnline) {
          const res = await fetch('/api/presences/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scannedValue,
              seanceId: seance.id,
              matiere: seance.matiere,
              anneeScolaire: seance.anneeScolaire,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            setLastResult({
              eleve: data.eleve || { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' },
              status: 'alreadyPresent',
              error: data.error || 'Erreur lors du scan',
            });
            return;
          }

          const result: ScanResult = {
            eleve: data.eleve,
            status: data.alreadyPresent ? 'alreadyPresent' : 'created',
          };
          setLastResult(result);

          if (data.created) {
            playBeep();
            // Mettre à jour la liste localement
            setEleves((prev) =>
              prev.map((e) =>
                e.id === data.eleve.id
                  ? { ...e, statut: 'PRESENT', presenceId: data.presence?.id || null, heureArrivee: new Date().toISOString() }
                  : e,
              ),
            );
          }
        } else {
          // Mode hors connexion: stocker localement
          // Identifier l'élève localement par matricule
          const eleve = eleves.find((e) => e.matricule === scannedValue || e.id === scannedValue);
          if (!eleve) {
            setLastResult({
              eleve: { id: '', matricule: scannedValue, nom: 'Inconnu', postNom: '', prenom: '', classe: '' },
              status: 'alreadyPresent',
              error: 'Élève non trouvé (hors connexion).',
            });
            return;
          }
          if (eleve.statut) {
            setLastResult({
              eleve: { id: eleve.id, matricule: eleve.matricule, nom: eleve.nom, postNom: eleve.postNom, prenom: eleve.prenom, classe: eleve.classe },
              status: 'alreadyPresent',
            });
            return;
          }

          // Stocker dans la file d'attente
          const queueStr = localStorage.getItem(`presence_queue_${seance.id}`) || '[]';
          const queue = JSON.parse(queueStr);
          queue.push({
            eleveId: eleve.id,
            statut: 'PRESENT',
            date: new Date().toISOString(),
            heureArrivee: new Date().toISOString(),
          });
          localStorage.setItem(`presence_queue_${seance.id}`, JSON.stringify(queue));
          setPendingSync(queue.length);

          playBeep();
          setEleves((prev) =>
            prev.map((e) =>
              e.id === eleve.id
                ? { ...e, statut: 'PRESENT', heureArrivee: new Date().toISOString() }
                : e,
            ),
          );
          setLastResult({
            eleve: { id: eleve.id, matricule: eleve.matricule, nom: eleve.nom, postNom: eleve.postNom, prenom: eleve.prenom, classe: eleve.classe },
            status: 'created',
          });
        }
      } catch {
        setLastResult({
          eleve: { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' },
          status: 'alreadyPresent',
          error: 'Erreur réseau',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [isOnline, seance.id, seance.matiere, seance.anneeScolaire, eleves, playBeep],
  );

  // Modifier le statut manuellement
  const changeStatut = useCallback(
    async (eleveId: string, statut: Statut) => {
      const eleve = eleves.find((e) => e.id === eleveId);
      if (!eleve) return;

      // Mise à jour optimiste
      setEleves((prev) =>
        prev.map((e) =>
          e.id === eleveId
            ? { ...e, statut, heureArrivee: statut === 'PRESENT' || statut === 'RETARD' ? e.heureArrivee || new Date().toISOString() : e.heureArrivee }
            : e,
        ),
      );

      if (!isOnline) {
        // Hors connexion: stocker dans la file
        const queueStr = localStorage.getItem(`presence_queue_${seance.id}`) || '[]';
        const queue = JSON.parse(queueStr);
        // Retirer l'élève s'il est déjà dans la file
        const filtered = queue.filter((q: { eleveId: string }) => q.eleveId !== eleveId);
        filtered.push({
          eleveId,
          statut,
          date: new Date().toISOString(),
          heureArrivee: statut === 'PRESENT' || statut === 'RETARD' ? new Date().toISOString() : null,
        });
        localStorage.setItem(`presence_queue_${seance.id}`, JSON.stringify(filtered));
        setPendingSync(filtered.length);
        return;
      }

      try {
        if (eleve.presenceId) {
          // Mettre à jour
          await fetch(`/api/presences/${eleve.presenceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: new Date().toISOString(),
              present: statut !== 'ABSENT',
              statut,
              classe: seance.classe,
            }),
          });
        } else {
          // Créer
          const res = await fetch('/api/presences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eleveId,
              date: new Date().toISOString(),
              present: statut !== 'ABSENT',
              classe: seance.classe,
            }),
          });
          const data = await res.json();
          if (data.presence?.id) {
            setEleves((prev) =>
              prev.map((e) => (e.id === eleveId ? { ...e, presenceId: data.presence.id } : e)),
            );
          }
        }
      } catch {
        // Erreur réseau: stocker hors connexion
        const queueStr = localStorage.getItem(`presence_queue_${seance.id}`) || '[]';
        const queue = JSON.parse(queueStr);
        const filtered = queue.filter((q: { eleveId: string }) => q.eleveId !== eleveId);
        filtered.push({
          eleveId,
          statut,
          date: new Date().toISOString(),
          heureArrivee: statut === 'PRESENT' || statut === 'RETARD' ? new Date().toISOString() : null,
        });
        localStorage.setItem(`presence_queue_${seance.id}`, JSON.stringify(filtered));
        setPendingSync(filtered.length);
      }
    },
    [eleves, isOnline, seance.id, seance.classe],
  );

  // Terminer l'appel
  const handleTerminer = async () => {
    if (nonEnregistres > 0 && !showConfirmTermine) {
      setShowConfirmTermine(true);
      return;
    }
    setShowConfirmTermine(false);
    try {
      await fetch(`/api/presences/seances/${seance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'terminer' }),
      });
    } catch {
      // ignore
    }
    onTerminer();
  };

  const dateStr = new Date(seance.date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* En-tête */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 to-blue-600 px-4 pb-4 pt-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="rounded-lg p-1.5 transition hover:bg-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Présence — {seance.classe}</h1>
            <p className="text-sm text-blue-100">
              {seance.matiere || 'Appel'} — {dateStr}
            </p>
          </div>
          <div className="w-8" />
        </div>

        {/* Indicateur hors connexion */}
        {!isOnline && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-orange-500/30 px-3 py-1.5 text-xs font-medium text-orange-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
            Mode hors connexion — {pendingSync} en attente de synchro
          </div>
        )}
        {isOnline && pendingSync > 0 && (
          <button
            onClick={trySync}
            disabled={syncing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-100 transition hover:bg-blue-500/40"
          >
            {syncing ? (
              <>
                <div className="btn-spinner h-3 w-3" /> Synchronisation...
              </>
            ) : (
              <>↻ Synchroniser {pendingSync} présences hors ligne</>
            )}
          </button>
        )}
      </div>

      {/* Bouton scanner principal */}
      <div className="px-4 pt-4">
        <button
          onClick={() => {
            setLastResult(null);
            setShowScanner(true);
          }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
          </svg>
          SCANNER QR POUR LA PRÉSENCE
        </button>
      </div>

      {/* Compteurs en temps réel */}
      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{total} élèves</span>
          {seance.statut === 'TERMINEE' && (
            <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-medium text-slate-600">
              Appel terminé
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <CounterCard emoji="🟢" label="Présents" value={counts.PRESENT} total={total} color="green" />
          <CounterCard emoji="🟠" label="Retards" value={counts.RETARD} total={total} color="orange" />
          <CounterCard emoji="🔴" label="Absents" value={counts.ABSENT} total={total} color="red" />
          <CounterCard emoji="🔵" label="Justifiés" value={counts.JUSTIFIE} total={total} color="blue" />
        </div>
      </div>

      {/* Élèves enregistrés */}
      <div className="px-4 pt-5">
        <h2 className="mb-2 text-sm font-bold text-slate-800">
          Élèves enregistrés ({total - nonEnregistres})
        </h2>
        <div className="space-y-2">
          {eleves
            .filter((e) => e.statut)
            .map((eleve) => (
              <EleveRow
                key={eleve.id}
                eleve={eleve}
                onStatutChange={(s) => changeStatut(eleve.id, s)}
                currentStatut={eleve.statut as Statut}
              />
            ))}
          {eleves.filter((e) => e.statut).length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              Aucun élève enregistré. Scannez les QR codes pour commencer l'appel.
            </p>
          )}
        </div>
      </div>

      {/* Élèves non encore enregistrés */}
      {nonEnregistres > 0 && (
        <div className="px-4 pt-5">
          <h2 className="mb-2 text-sm font-bold text-slate-800">
            Élèves non encore enregistrés ({nonEnregistres})
          </h2>
          <div className="space-y-2">
            {eleves
              .filter((e) => !e.statut)
              .map((eleve) => (
                <EleveRow
                  key={eleve.id}
                  eleve={eleve}
                  onStatutChange={(s) => changeStatut(eleve.id, s)}
                  currentStatut={null}
                />
              ))}
          </div>
        </div>
      )}

      {/* Bouton terminer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 py-3">
        {showConfirmTermine && (
          <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ {nonEnregistres} élève(s) n'ont encore aucun statut. Voulez-vous vraiment terminer l'appel ?
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setShowConfirmTermine(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleTerminer}
                className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        )}
        {!showConfirmTermine && (
          <button
            onClick={handleTerminer}
            className="w-full rounded-2xl bg-slate-900 py-3.5 text-base font-bold text-white transition active:scale-[0.98]"
          >
            Terminer l'appel
          </button>
        )}
      </div>

      {/* Scanner modal */}
      {showScanner && (
        <QRScannerModal
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn((f) => !f)}
          lastResult={lastResult}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ── Sous-composants ──

function CounterCard({
  emoji,
  label,
  value,
  total,
  color,
}: {
  emoji: string;
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'border-green-200 bg-green-50 text-green-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  return (
    <div className={`rounded-xl border p-2.5 text-center ${colorMap[color]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] font-medium leading-tight">{label}</div>
    </div>
  );
}

function EleveRow({
  eleve,
  onStatutChange,
  currentStatut,
}: {
  eleve: Eleve;
  onStatutChange: (s: Statut) => void;
  currentStatut: Statut | null;
}) {
  const [showActions, setShowActions] = useState(false);
  const heureStr = eleve.heureArrivee
    ? new Date(eleve.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        currentStatut
          ? STATUT_CONFIG[currentStatut].bg
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
          {eleve.prenom.charAt(0)}
          {eleve.nom.charAt(0)}
        </div>

        {/* Nom + info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">
            {eleve.nom} {eleve.postNom} {eleve.prenom}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {currentStatut && (
              <span className={STATUT_CONFIG[currentStatut].text}>
                {STATUT_CONFIG[currentStatut].emoji} {STATUT_CONFIG[currentStatut].label}
              </span>
            )}
            {heureStr && <span>· {heureStr}</span>}
          </div>
        </div>

        {/* Bouton modifier */}
        <button
          onClick={() => setShowActions((s) => !s)}
          className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
      </div>

      {/* Actions de statut */}
      {showActions && (
        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
          {STATUTS.map((s) => (
            <button
              key={s}
              onClick={() => {
                onStatutChange(s);
                setShowActions(false);
              }}
              className={`rounded-lg py-2 text-xs font-medium transition ${
                currentStatut === s
                  ? `${STATUT_CONFIG[s].bg} ${STATUT_CONFIG[s].text} ring-2 ${STATUT_CONFIG[s].ring}`
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div>{STATUT_CONFIG[s].emoji}</div>
              <div className="mt-0.5">{STATUT_CONFIG[s].label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
