'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { NavGroup } from '@/lib/navigation';
import { ROLE_LABELS } from '@/lib/rbac';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import type { SessionUser } from '@/lib/use-session-user';

/** Ignore la casse et les accents : « eleve » retrouve « Élèves ». */
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Menu latéral mobile (drawer sombre).
 *
 * Présentation uniquement : les groupes et les droits viennent toujours de
 * `visibleNavigationGroups`, et les liens pointent sur les routes existantes.
 */
export function MobileNavDrawer({
  open,
  groups,
  pathname,
  user,
  onClose,
  onLogout
}: {
  open: boolean;
  groups: NavGroup[];
  pathname: string;
  user: SessionUser | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState('');

  // Recherche remise à zéro à la fermeture : le menu se rouvre toujours complet
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filteredGroups = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return groups;
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => normalize(item.label).includes(q)) }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  return (
    <>
      {/* Fond assombri */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-slate-950/60 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tiroir */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-full w-[85vw] max-w-[20rem] flex-col overflow-hidden bg-[#0c1421] shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigation principale"
      >
        {/* Marque + fermeture */}
        <div className="flex shrink-0 items-center gap-2.5 px-3.5 pb-3 pt-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5346f5]">
            <Icon name="teacher" className="h-[18px] w-[18px] text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight text-white">School Manager</p>
            <p className="truncate text-[11px] leading-tight text-[#7d8798]">RDC · Gestion scolaire</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a0a0a0] transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer le menu"
          >
            <Icon name="close" className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Recherche dans le menu */}
        <div className="shrink-0 px-3.5 pb-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-[#162030] px-3 py-2.5">
            <Icon name="search" className="h-4 w-4 shrink-0 text-[#6e7a8f]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans le menu"
              aria-label="Rechercher dans le menu"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[#6e7a8f]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="shrink-0 text-[#6e7a8f] transition hover:text-white"
                aria-label="Effacer la recherche"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3" aria-label="Navigation principale">
          {filteredGroups.map((group) => (
            <section key={group.title} className="mb-4 last:mb-0">
              <h2 className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6e7a8f]">
                {group.title}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition',
                          active
                            ? 'bg-[#5346f5] text-white shadow-lg shadow-[#5346f5]/25'
                            : 'text-[#a0a0a0] hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-[#7d8798]')}
                        />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {filteredGroups.length === 0 && (
            <p className="px-2.5 py-8 text-center text-[13px] text-[#6e7a8f]">Aucun élément ne correspond.</p>
          )}
        </nav>

        {/* Profil + déconnexion */}
        {user && (
          <div className="shrink-0 border-t border-white/10 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 transition hover:opacity-90"
              >
                <Avatar
                  photoUrl={user.profilePhotoUrl}
                  prenom={user.prenom}
                  nom={user.nom}
                  size="sm"
                  className="ring-2 ring-white/15"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-tight text-white">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-[#8b94a6]">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </div>
              </Link>
              <button
                onClick={onLogout}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-semibold text-[#ff9b9b] transition hover:bg-red-500/10"
                aria-label="Déconnexion"
              >
                <Icon name="logout" className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
