'use client';

import { Icon } from '@/components/ui/Icon';

/** Squelette affiché pendant le chargement du tableau de bord (jamais de page blanche). */
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-44 rounded-3xl border border-slate-200 bg-slate-50 sm:h-40" />

      <div className="mt-6 h-4 w-32 rounded bg-slate-100" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl border border-slate-200 bg-slate-50" />
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-slate-200 bg-slate-50" />
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 rounded-2xl border border-slate-200 bg-slate-50" />
        ))}
      </div>
    </div>
  );
}

/** État d'erreur avec bouton « Réessayer » : le tableau de bord reste toujours utilisable. */
export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <Icon name="bell" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        Impossible de charger les statistiques
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Connexion momentanément indisponible. Vos données sont intactes : réessayez dans un instant.
      </p>
      <button type="button" onClick={onRetry} className="btn-primary mt-6 px-6 py-2.5 text-sm">
        Réessayer
      </button>
    </div>
  );
}
