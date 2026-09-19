import { AppShell } from '@/components/AppShell';

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="min-h-screen bg-slate-100 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Tableau de bord</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Vue d’ensemble</h1>
            </div>
            <button className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-500">
              Nouveau rapport
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Élèves', value: '2,640' },
              { label: 'Enseignants', value: '184' },
              { label: 'Classes', value: '48' },
              { label: 'Documents', value: '1,289' }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white p-5 shadow-soft">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
