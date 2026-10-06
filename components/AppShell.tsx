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
import { BottomNav } from '@/components/dashboards/BottomNav';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { MobileNavDrawer } from '@/components/dashboards/MobileNavDrawer';

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
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4 lg:px-5">
          {/* Gauche : bouton menu (mobile) + titre de la page */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900 sm:text-base">
            {pageTitle}
          </h1>

          {/* Droite : montre compacte + notifications + profil */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <DigitalClock variant="compact" className="mr-1 flex sm:mr-0" />

            <RefreshButton />

            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
              aria-label="Notifications"
            >
              <Icon name="bell" className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
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
                    'absolute right-0 top-full z-50 mt-1.5 w-60 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 ease-out',
                    userMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                  )}
                >
                  <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5">
                    <Avatar
                      photoUrl={user.profilePhotoUrl}
                      prenom={user.prenom}
                      nom={user.nom}
                      size="md"
                      className="ring-2 ring-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                      <p className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="user" className="h-4 w-4 text-slate-400" />
                      Voir le profil
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="photo" className="h-4 w-4 text-slate-400" />
                      Modifier le profil
                    </Link>
                    <Link
                      href="/parametres"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="settings" className="h-4 w-4 text-slate-400" />
                      Paramètres
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2 text-[13px] text-red-600 transition hover:bg-red-50"
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
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <SidebarContent groups={groups} pathname={pathname} user={user} onLogout={handleLogout} />
        </aside>

        {/* ── Menu mobile (drawer sombre) — toujours rendu, transition CSS ── */}
        <MobileNavDrawer
          open={sidebarOpen}
          groups={groups}
          pathname={pathname}
          user={user}
          onClose={closeSidebar}
          onLogout={handleLogout}
        />

        {/* ── Barre de navigation du bas (mobile) ── */}
        <BottomNav role={user?.role} onMore={() => setSidebarOpen(true)} />

        {/* ── Contenu principal ── */}
        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 flex-1 pb-[68px] lg:pb-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Identité + photo de profil */}
      {user && (
        <div className="shrink-0 px-2.5 pt-3">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
          >
            <Avatar
              photoUrl={user.profilePhotoUrl}
              prenom={user.prenom}
              nom={user.nom}
              size="sm"
              className="ring-2 ring-white shadow-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-900">
                {user.prenom} {user.nom}
              </p>
              <p className="truncate text-[11px] font-medium text-blue-600">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3" aria-label="Navigation principale">
        {groups.map((group) => (
          <section key={group.title} className="mb-4 last:mb-0">
            <h2 className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
                        active
                          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                      )}
                    >
                      <Icon
                        name={item.icon}
                        className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-blue-600' : 'text-slate-400')}
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
      <div className="shrink-0 border-t border-slate-200 p-2.5">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 active:bg-red-100"
        >
          <Icon name="logout" className="h-[18px] w-[18px]" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
