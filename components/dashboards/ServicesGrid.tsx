'use client';

import Link from 'next/link';
import { visibleNavigationGroups } from '@/lib/navigation';
import { Icon } from '@/components/ui/Icon';

/**
 * Accès aux services et espaces de gestion ouverts au rôle connecté.
 *
 * La liste provient de la configuration centrale de navigation
 * (lib/navigation.ts), déjà utilisée par la barre latérale : un utilisateur ne
 * voit donc que les espaces auxquels son rôle donne accès, sans règle dupliquée.
 * Grille compacte : mêmes liens, densité réduite.
 */
export function ServicesGrid({ role }: { role: string }) {
  const groups = visibleNavigationGroups(role)
    .map((group) => ({
      ...group,
      // Le lien vers le tableau de bord est inutile depuis le tableau de bord.
      items: group.items.filter((item) => item.href !== '/dashboard'),
    }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Services et espaces de gestion
      </h2>
      <p className="mt-0.5 text-[13px] text-slate-500">Tous les espaces ouverts à votre rôle.</p>

      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              {group.title}
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[52px] items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 text-[13px] font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:shadow-md active:bg-slate-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 leading-snug">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
