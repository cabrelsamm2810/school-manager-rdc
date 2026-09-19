const systemRoles = [
  'Super administrateur',
  'Coordination nationale',
  'Coordination provinciale',
  'Agent provincial',
  'Coordination sous-provinciale',
  'Agent sous-provincial',
  'Direction d\'école',
  'Enseignant',
  'Parent',
  'Élève'
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <nav className="mb-12 flex items-center justify-between">
          <div className="text-2xl font-bold">School Manager RDC</div>
          <div className="flex gap-3">
            <a href="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">Connexion</a>
            <a href="/register" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Créer un compte</a>
          </div>
        </nav>

        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
              Nouvelle architecture
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-6xl">
              Plateforme scolaire moderne, évolutive et sécurisée.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-300">
              Migration progressive depuis Base44 vers une solution indépendante basée sur Next.js, TypeScript, PostgreSQL et un stockage externe compatible S3.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/register" className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500">Inscription</a>
              <a href="/dashboard" className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-200 hover:bg-slate-900">Dashboard</a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Rôles</p>
                <p className="mt-2 text-3xl font-bold">10+</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Stockage</p>
                <p className="mt-2 text-3xl font-bold">S3</p>
              </div>
              <div className="rounded-2xl bg-slate-800 p-5 md:col-span-2">
                <p className="text-sm text-slate-400">Architecture</p>
                <p className="mt-2 text-lg font-semibold">Next.js + TypeScript + PostgreSQL + Prisma</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="mb-8 text-2xl font-semibold">Rôles préparés</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {systemRoles.map((role) => (
              <div key={role} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-200">
                {role}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
