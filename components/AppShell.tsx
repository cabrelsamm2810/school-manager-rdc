'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { allNavItems, visibleNavigationGroups, type NavGroup } from '@/lib/navigation';
import { ROLE_LABELS } from '@/lib/rbac';
import { useSessionUser, type SessionUser } from '@/lib/use-session-user';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { DigitalClock } from '@/components/dashboards/DigitalClock';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const groups = useMemo(() => visibleNavigationGroups(user?.role), [user?.role]);

  /* Titre de la page courante, déduit de la navigation centrale (aucune route ajoutée). */
  const pageTitle = useMemo(() => {
    const match = allNavItems
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.label ?? 'Tableau de bord';
  }, [pathname]);

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
    if (!sidebarOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    /* Session fermée : retour à l'accueil public (splash puis accueil au prochain lancement). */
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Barre supérieure ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-2 px-3 sm:px-4 lg:px-6">
          {/* Gauche : bouton menu (mobile) + titre de la page */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 sm:text-lg">
            {pageTitle}
          </h1>

          {/* Droite : montre compacte + notifications + profil */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DigitalClock variant="compact" className="mr-1 flex sm:mr-0" />

            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
              aria-label="Notifications"
            >
              <Icon name="bell" className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full p-0.5 transition hover:bg-slate-100 active:bg-slate-200"
                  aria-expanded={userMenuOpen}
                  aria-label="Menu utilisateur"
                >
                  <Avatar
                    photoUrl={user.profilePhotoUrl}
                    prenom={user.prenom}
                    nom={user.nom}
                    size="sm"
                    className="ring-2 ring-white shadow-sm"
                  />
                </button>

                {/* Backdrop invisible pour fermeture au clic extérieur */}
                {userMenuOpen && <div className="fixed inset-0 z-40" onClick={closeUserMenu} />}

                <div
                  className={clsx(
                    'absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 ease-out',
                    userMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                  )}
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                    <Avatar
                      photoUrl={user.profilePhotoUrl}
                      prenom={user.prenom}
                      nom={user.nom}
                      size="md"
                      className="ring-2 ring-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                      <p className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
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
                      Voir le profil
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="photo" className="h-4 w-4 text-slate-400" />
                      Modifier le profil
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
                      className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
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
        {/* ── Menu latéral (ordinateur) ── */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <SidebarContent groups={groups} pathname={pathname} user={user} onLogout={handleLogout} />
        </aside>

        {/* ── Menu mobile (drawer) — toujours rendu, transition CSS ── */}
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
            sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <aside
          className={clsx(
            'fixed left-0 top-0 z-50 flex h-full w-[85vw] max-w-sm flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="Navigation principale"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={closeSidebar}>
              <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
              <span className="truncate font-bold text-slate-900">School Manager RDC</span>
            </Link>
            <button
              onClick={closeSidebar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 active:bg-slate-200"
              aria-label="Fermer le menu"
            >
              <Icon name="close" />
            </button>
          </div>
          <SidebarContent
            groups={groups}
            pathname={pathname}
            user={user}
            onLogout={handleLogout}
            onNavigate={closeSidebar}
          />
        </aside>

        {/* ── Contenu principal ── */}
        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  pathname,
  user,
  onLogout,
  onNavigate
}: {
  groups: NavGroup[];
  pathname: string;
  user: SessionUser | null;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Identité + photo de profil */}
      {user && (
        <div className="shrink-0 px-3 pt-4">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
          >
            <Avatar
              photoUrl={user.profilePhotoUrl}
              prenom={user.prenom}
              nom={user.nom}
              size="md"
              className="ring-2 ring-white shadow-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.prenom} {user.nom}
              </p>
              <p className="truncate text-xs font-medium text-blue-600">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        {groups.map((group) => (
          <section key={group.title} className="mb-5 last:mb-0">
            <h2 className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                      )}
                    >
                      <Icon
                        name={item.icon}
                        className={clsx('h-5 w-5 shrink-0', active ? 'text-blue-600' : 'text-slate-400')}
                      />
                      <span className="min-w-0 truncate">{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:bg-red-100"
        >
          <Icon name="logout" className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
