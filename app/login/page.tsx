export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Connexion</h1>
        </div>

        <form className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Adresse e-mail</label>
            <input id="email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-0 transition focus:border-blue-500" placeholder="nom@ecole.cd" />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
            <input id="password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-0 transition focus:border-blue-500" placeholder="••••••••" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Se souvenir de moi
            </label>
            <a href="/register" className="text-blue-600 hover:underline">Mot de passe oublié ?</a>
          </div>

          <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-500">
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Vous n&apos;avez pas de compte ?{' '}
          <a href="/register" className="font-medium text-blue-600 hover:underline">Créer un compte</a>
        </p>
      </div>
    </main>
  );
}
