'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

/**
 * Bouton d'actualisation de l'en-tête.
 *
 * Il recharge la page courante : les données de la page sont donc relues depuis
 * le serveur, avec la même session et les mêmes droits. Aucune donnée ni règle
 * d'accès n'est modifiée.
 */
export function RefreshButton() {
  const [loading, setLoading] = useState(false);

  function refresh() {
    if (loading) return;
    setLoading(true);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={loading}
      aria-label="Actualiser"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50 active:bg-emerald-100"
    >
      <Icon name="refresh" className={clsx('h-[18px] w-[18px]', loading && 'animate-spin')} />
    </button>
  );
}
