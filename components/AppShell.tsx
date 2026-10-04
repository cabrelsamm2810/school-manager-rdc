'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { navigationGroups, type NavItem } from '@/lib/navigation';
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
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Ferme le drawer mobile lors d'un changement de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen bg-slate-100">
      {/* Barre supérieure (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Ouvrir le menu"
        >
          <Icon name="menu" />
        </button>
        <span className="text-base font-bold text-slate-900">School Manager RDC</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {initials}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">
          <SidebarContent
            groups={visibleGroups}
            pathname={pathname}
            user={user}
            initials={initials}
            onLogout={handleLogout}
          />
        </aside>

        {/* Drawer (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="font-bold text-slate-900">School Manager RDC</span>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
                  <Icon name="close" />
                </button>
              </div>
              <SidebarContent
                groups={visibleGroups}
                pathname={pathname}
                user={user}
                initials={initials}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        )}

        {/* Contenu principal */}
        <main className="min-h-screen flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  pathname,
  user,
  initials,
  onLogout
}: {
  groups: typeof navigationGroups;
  pathname: string;
  user: SessionUser | null;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="hidden border-b border-slate-200 px-5 py-4 lg:block">
        <Link href="/dashboard" className="text-lg font-bold text-slate-900">School Manager RDC</Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
            <ul className="space-y-1">
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
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profil utilisateur en bas */}
      <div className="border-t border-slate-200 p-3">
        {user ? (
          <div className="space-y-2">
            <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{user.prenom} {user.nom}</p>
                <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
            </Link>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <Icon name="logout" className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        ) : (
          <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            <Icon name="logout" className="h-5 w-5" />
            Connexion
          </Link>
        )}
      </div>
    </div>
  );
}
