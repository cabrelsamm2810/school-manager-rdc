'use client';

import type { EleveSituation, PendingPaiement } from '@/lib/finance-types';

/**
 * File d'attente locale des paiements saisis hors connexion.
 *
 * Chaque paiement porte une `idempotencyKey` générée sur l'appareil : la
 * synchronisation peut être rejouée sans jamais créer de doublon côté serveur.
 * Les situations consultées sont mises en cache pour rester consultables quand
 * le réseau revient — le QR code ne contenant qu'un identifiant, cette copie
 * locale évite de dépendre du serveur pendant la coupure.
 */

const QUEUE_KEY = 'finance_paiements_queue';
const SITUATION_KEY = (eleveId: string) => `finance_situation_v1_${eleveId}`;

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `paiement-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readQueue(): PendingPaiement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingPaiement[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function queuePaiement(paiement: PendingPaiement): PendingPaiement[] {
  const queue = [...readQueue(), paiement];
  writeQueue(queue);
  return queue;
}

export function removeFromQueue(keys: string[]): PendingPaiement[] {
  const remaining = readQueue().filter((item) => !keys.includes(item.idempotencyKey));
  writeQueue(remaining);
  return remaining;
}

export function cacheSituation(situation: EleveSituation) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SITUATION_KEY(situation.eleve.id), JSON.stringify(situation));
  } catch {
    // Stockage plein ou navigation privée : le cache est optionnel.
  }
}

export function readCachedSituation(eleveId: string): EleveSituation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SITUATION_KEY(eleveId));
    return raw ? (JSON.parse(raw) as EleveSituation) : null;
  } catch {
    return null;
  }
}

/** Envoie la file d'attente au serveur ; renvoie le nombre synchronisé. */
export async function syncPendingPaiements(): Promise<{ synced: number; pending: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, pending: 0 };

  let resultats: Array<{ idempotencyKey: string; ok: boolean }>;
  try {
    const res = await fetch('/api/finances/paiements/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paiements: queue }),
    });
    if (!res.ok) return { synced: 0, pending: queue.length };
    const data = await res.json();
    resultats = Array.isArray(data?.resultats) ? data.resultats : [];
  } catch {
    return { synced: 0, pending: queue.length };
  }

  const done = resultats.filter((r) => r.ok).map((r) => r.idempotencyKey);
  const remaining = removeFromQueue(done);
  return { synced: done.length, pending: remaining.length };
}
