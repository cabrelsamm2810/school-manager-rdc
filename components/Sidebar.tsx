import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-72 rounded-3xl bg-slate-900 p-5 text-white lg:block">
          <div className="mb-8 text-2xl font-bold">School Manager RDC</div>
          <nav className="space-y-2 text-sm">
            <a href="/dashboard" className="block rounded-xl px-3 py-2 hover:bg-slate-800">Dashboard</a>
            <a href="/profile" className="block rounded-xl px-3 py-2 hover:bg-slate-800">Profil</a>
            <a href="/schoolchat" className="block rounded-xl px-3 py-2 hover:bg-slate-800">SchoolChat</a>
            <a href="/settings" className="block rounded-xl px-3 py-2 hover:bg-slate-800">Paramètres</a>
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
