import { AppShell } from '@/components/AppShell';
import { PageHeader, StatCard } from '@/components/ui/Card';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            eyebrow="Tableau de bord"
            title="Vue d’ensemble"
            description="Synthèse de l’activité scolaire — élèves, enseignants, établissements et documents."
            action={
              <button className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-500">
                Nouveau rapport
              </button>
            }
          />

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Élèves" value="2 640" hint="Inscrits cette année" />
            <StatCard label="Enseignants" value="184" hint="Actifs" />
            <StatCard label="Classes" value="48" hint="Tous niveaux" />
            <StatCard label="Documents" value="1 289" hint="Dossiers numériques" />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Activité récente</h2>
              <ul className="mt-4 space-y-3">
                {[
                  'Nouvelle inscription — École Lumumba',
                  'Cahier de notes mis à jour — 6e année',
                  'Visite numérique planifiée — Kongo-Central',
                  'Carte scolaire générée — 12 élèves',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Raccourcis</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Élèves', href: '/eleves' },
                  { label: 'Enseignants', href: '/enseignants' },
                  { label: 'Cahier de notes', href: '/cahier-de-notes' },
                  { label: 'Cartes QR', href: '/cartes-qr' },
                ].map((shortcut) => (
                  <a
                    key={shortcut.href}
                    href={shortcut.href}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    {shortcut.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
