'use client';

import { Icon } from '@/components/ui/Icon';

/** Squelette affiché pendant le chargement du tableau de bord (jamais de page blanche). */
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-52 rounded-2xl border border-slate-200 bg-slate-50 sm:h-32" />

      <div className="mt-4 h-3.5 w-28 rounded bg-slate-100" />
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl border border-slate-200 bg-slate-50" />
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-slate-200 bg-slate-50" />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-56 rounded-2xl border border-slate-200 bg-slate-50" />
        ))}
      </div>
    </div>
  );
}

/** État d'erreur avec bouton « Réessayer » : le tableau de bord reste toujours utilisable. */
export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-9 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <Icon name="bell" className="h-5 w-5" />
      </span>
      <h2 className="mt-3 text-base font-semibold text-slate-900">
        Impossible de charger les statistiques
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-slate-500">
        Connexion momentanément indisponible. Vos données sont intactes : réessayez dans un instant.
      </p>
      <button type="button" onClick={onRetry} className="btn-primary mt-5 px-5 py-2 text-[13px]">
        Réessayer
      </button>
    </div>
  );
}
