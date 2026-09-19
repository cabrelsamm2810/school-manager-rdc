export function RegisterForm() {
  return (
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
  );
}
