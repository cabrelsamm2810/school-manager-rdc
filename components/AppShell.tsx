'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { navigationGroups, type NavItem, type NavGroup } from '@/lib/navigation';
import { ROLE_LABELS, ROLE_RANK } from '@/lib/rbac';
import { Icon } from '@/components/ui/Icon';

type SessionUser = {
  id: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
  email: string;
  role: string;
  profilePhotoUrl?: string | null;
};

function filterByRole(items: NavItem[], role: string): NavItem[] {
  return items.filter((item) => !item.minRole || (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[item.minRole] ?? 0));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Rafraîchit l'utilisateur quand la photo de profil change (page /profile)
  useEffect(() => {
    function refreshUser() {
      fetch('/api/auth/session')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.authenticated) setUser(data.user);
        })
        .catch(() => {});
    }
    window.addEventListener('profile-photo-updated', refreshUser);
    return () => window.removeEventListener('profile-photo-updated', refreshUser);
  }, []);

  // Ferme le drawer et le menu utilisateur lors d'un changement de route
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Touche Échap pour fermer le drawer ou le menu utilisateur
  useEffect(() => {
    if (!sidebarOpen && !userMenuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setUserMenuOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen, userMenuOpen]);

  // Verrouille le défilement du body quand le drawer est ouvert
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'SM';

  const visibleGroups = user
    ? navigationGroups
        .map((g) => ({ ...g, items: filterByRole(g.items, user.role) }))
        .filter((g) => g.items.length > 0)
    : navigationGroups;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Barre supérieure ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Gauche : hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Icon name="menu" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
              </div>
              <span className="hidden text-sm font-bold tracking-wide text-slate-900 sm:block">
                School Manager RDC
              </span>
            </Link>
          </div>

          {/* Droite : notifications + utilisateur */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Icon name="bell" className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
            </Link>

            {/* Menu utilisateur */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100"
                  aria-expanded={userMenuOpen}
                  aria-label="Menu utilisateur"
                >
                  {user.profilePhotoUrl ? (
                    <img src={user.profilePhotoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {initials}
                    </div>
                  )}
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-sm font-semibold text-slate-900">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="max-w-[120px] truncate text-xs text-slate-500">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                </button>

                {/* Backdrop invisible pour fermeture au clic extérieur */}
                {userMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={closeUserMenu} />
                )}
                {/* Menu déroulant avec transition fluide */}
                <div
                  className={clsx(
                    'absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out',
                    userMenuOpen
                      ? 'scale-100 opacity-100'
                      : 'pointer-events-none scale-95 opacity-0'
                  )}
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                    {user.profilePhotoUrl ? (
                      <img src={user.profilePhotoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-100" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-slate-100">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                      <p className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="user" className="h-4 w-4 text-slate-400" />
                      Mon profil
                    </Link>
                    <Link
                      href="/parametres"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="settings" className="h-4 w-4 text-slate-400" />
                      Paramètres
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <Icon name="logout" className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-secondary-light px-4 py-2 text-sm"
                style={{ borderRadius: '9999px' }}
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar (desktop) ── */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">
          <SidebarContent groups={visibleGroups} pathname={pathname} />
        </aside>

        {/* ── Drawer (mobile) — toujours rendu, transition CSS ── */}
        {/* Backdrop */}
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
            sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={closeSidebar}
        />
        {/* Panneau coulissant */}
        <aside
          className={clsx(
            'fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] overflow-y-auto bg-white transition-transform duration-300 ease-out lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
              </div>
              <span className="font-bold text-slate-900">School Manager RDC</span>
            </div>
            <button
              onClick={closeSidebar}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Fermer"
            >
              <Icon name="close" />
            </button>
          </div>
          <SidebarContent groups={visibleGroups} pathname={pathname} />
        </aside>

        {/* ── Contenu principal ── */}
        <main className="min-h-[calc(100vh-4rem)] flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  pathname,
}: {
  groups: NavGroup[];
  pathname: string;
}) {
  // Groupe actif par défaut (celui contenant la route courante)
  const activeGroup = groups.find((g) =>
    g.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(activeGroup ? [activeGroup.title] : [])
  );

  // Auto-expand le groupe actif quand la route change
  useEffect(() => {
    if (activeGroup) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        next.add(activeGroup.title);
        return next;
      });
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleGroup(title: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <nav className="px-3 py-4">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.title);
        const hasActive = group.items.some(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
        );

        return (
          <div key={group.title} className="mb-2">
            <button
              onClick={() => toggleGroup(group.title)}
              className={clsx(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition',
                hasActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <span>{group.title}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={clsx('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isExpanded && (
              <ul className="nav-group-expand mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={clsx('h-5 w-5 shrink-0', active ? 'text-blue-600' : 'text-slate-400')}
                        />
                        <span className="truncate">{item.label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
