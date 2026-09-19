import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <nav className="mb-12 flex items-center justify-between gap-3">
          <div className="text-2xl font-bold">School Manager RDC</div>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
              Connexion
            </Link>
            <Link href="/register" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
              Créer un compte
            </Link>
          </div>
        </nav>

        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
              Plateforme scolaire
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-6xl">
              Gestion scolaire moderne et sécurisée pour la RDC.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-300">
              La base de données PostgreSQL, les comptes utilisateurs, les rôles RBAC, les profils et les sessions sont maintenant préparés.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500">
                S’inscrire
              </Link>
              <Link href="/dashboard" className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-200 hover:bg-slate-900">
                Tableau de bord
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Rôles</p>
                <p className="mt-2 text-3xl font-bold">10</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Auth</p>
                <p className="mt-2 text-3xl font-bold">Secure</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-5 md:col-span-2">
                <p className="text-sm text-slate-400">Base</p>
                <p className="mt-2 text-lg font-semibold">Next.js + Prisma + PostgreSQL + RBAC</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
