export function LoginForm() {
  return (
    <form className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Adresse e-mail</label>
        <input id="email" type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="nom@ecole.cd" />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
        <input id="password" type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="••••••••" />
      </div>

      <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-500">
        Se connecter
      </button>
    </form>
  );
}
