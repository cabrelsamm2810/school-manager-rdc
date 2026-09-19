export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Profil</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Informations personnelles</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">SM</div>
            <div>
              <p className="font-semibold text-slate-900">School Manager</p>
              <p className="text-sm text-slate-500">Utilisateur principal</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Photo de profil</p>
            <div className="mt-4 flex h-32 w-32 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-700">SM</div>
            <label className="mt-5 block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700">
              Choisir une photo
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>

          <form className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="School" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="Manager" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Adresse e-mail</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="schoolmanager@ecole.cd" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" defaultValue="+243 000 000 000" />
            </div>
            <button type="submit" className="md:col-span-2 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-500">
              Enregistrer les modifications
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
