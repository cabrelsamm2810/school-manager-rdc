'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import type { NavGroup } from '@/lib/navigation';
import { ROLE_LABELS } from '@/lib/rbac';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { SchoolChatMark } from '@/components/ui/SchoolChatMark';
import type { SessionUser } from '@/lib/use-session-user';

/**
 * Barre latérale de bureau.
 *
 * Présentation uniquement : les groupes et les droits viennent toujours de
 * `visibleNavigationGroups`, et les liens pointent sur les routes existantes.
 */
export function SidebarNav({
  groups,
  pathname,
  user,
  onLogout
}: {
  groups: NavGroup[];
  pathname: string;
  user: SessionUser | null;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-[#14243f] via-sidebar to-[#0a1220]">
      {/* Marque */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm shadow-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold leading-tight tracking-tight text-white">
            School Manager
          </p>
          <p className="truncate text-[10px] font-medium uppercase leading-tight tracking-[0.14em] text-slate-500">
            RDC · Skybox Business
          </p>
        </div>
      </div>

      {/* Navigation principale */}
      <nav
        className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3"
        aria-label="Navigation principale"
      >
        {groups.map((group) => (
          <section key={group.title} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 px-2.5 pb-1.5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {group.title}
              </h2>
              <span className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" aria-hidden="true" />
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors duration-150',
                        active
                          ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-950/40 ring-1 ring-inset ring-white/10'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      )}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white/70"
                          aria-hidden="true"
                        />
                      )}
                      {item.href === '/schoolchat' ? (
                        <SchoolChatMark className="h-[21px] w-[21px] rounded-[5px]" />
                      ) : (
                        <Icon
                          name={item.icon}
                          className={clsx(
                            'h-[18px] w-[18px] shrink-0 transition-colors duration-150',
                            active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                          )}
                        />
                      )}
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      {/* Profil + déconnexion */}
      {user && (
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] p-2 ring-1 ring-inset ring-white/[0.06]">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-white/[0.04]"
            >
              <Avatar
                photoUrl={user.profilePhotoUrl}
                prenom={user.prenom}
                nom={user.nom}
                size="sm"
                className="ring-2 ring-white/10"
              />
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold leading-tight text-white">
                  {user.prenom} {user.nom}
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-400">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </Link>
            <button
              onClick={onLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
