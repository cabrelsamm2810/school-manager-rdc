'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { statutBadge, demoPhotos } from '@/lib/demo-data';

export default function PhotoPasseportPage() {
  return (
    <ModulePage icon="photo" eyebrow="Gestion scolaire" title="Photo passeport numérique" description="Capture et gestion des photos d'identité numériques des élèves.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Validées" value={String(demoPhotos.filter((p) => p.statut === 'Validée').length)} />
        <StatCard label="En attente" value={String(demoPhotos.filter((p) => p.statut === 'En attente').length)} />
        <StatCard label="Manquantes" value={String(demoPhotos.filter((p) => p.statut === 'Manquante').length)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Importer des photos</button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {demoPhotos.map((p) => (
          <div key={p.matricule} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
            <div className="mx-auto mb-3 flex h-24 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
              {p.statut === 'Manquante' ? <span className="text-3xl">📷</span> : <span className="text-3xl">👤</span>}
            </div>
            <p className="truncate text-sm font-medium text-slate-900">{p.nom}</p>
            <p className="text-xs text-slate-500">{p.matricule}</p>
            <div className="mt-2 flex justify-center">{statutBadge(p.statut)}</div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
