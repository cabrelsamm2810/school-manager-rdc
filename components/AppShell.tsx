import Link from 'next/link';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="text-lg font-bold text-slate-900">
            School Manager RDC
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition hover:bg-slate-50"
            >
              Tableau de bord
            </Link>
            <Link
              href="/profile"
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 transition hover:bg-slate-50"
            >
              Profil
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
