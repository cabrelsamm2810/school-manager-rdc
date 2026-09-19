export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Créer un compte</h1>
        </div>

        <form className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
            <input id="firstName" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Jean" />
          </div>

          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
            <input id="lastName" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Kabila" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Adresse e-mail</label>
            <input id="email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="nom@ecole.cd" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">Rôle</label>
            <select id="role" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500">
              <option>Enseignant</option>
              <option>Parent</option>
              <option>Élève</option>
              <option>Direction d'école</option>
              <option>Coordination provinciale</option>
              <option>Super administrateur</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
            <input id="password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="••••••••" />
          </div>

          <button type="submit" className="md:col-span-2 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-500">
            S&apos;inscrire
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Vous avez déjà un compte ?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:underline">Se connecter</a>
        </p>
      </div>
    </main>
  );
}
