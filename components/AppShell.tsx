export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-soft">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Paramètres</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Configuration du système</h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xl font-semibold text-slate-900">Sécurité</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Sessions sécurisées</li>
              <li>• Contrôle d’accès côté serveur</li>
              <li>• Validation des entrées</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xl font-semibold text-slate-900">Stockage</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Providers S3 compatibles</li>
              <li>• Fichiers externalisés</li>
              <li>• Métadonnées PostgreSQL</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
