export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-soft">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Profil</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Informations du profil</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Photo de profil</p>
            <div className="mt-4 flex h-32 w-32 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-700">
              SM
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="School" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Post-nom</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="Manager" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="School" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="+243 000 000 000" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="schoolmanager@ecole.cd" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Rôle</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="DIRECTION_ECOLE" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
