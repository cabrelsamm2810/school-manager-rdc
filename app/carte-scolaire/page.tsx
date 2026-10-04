'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { demoProvinces } from '@/lib/demo-data';

export default function CarteScolairePage() {
  return (
    <ModulePage icon="map" eyebrow="Gestion scolaire" title="Carte scolaire numérique" description="Cartographie des établissements, zones et effectifs scolaires.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Provinces couvertes" value={String(demoProvinces.length)} />
        <StatCard label="Établissements" value={demoProvinces.reduce((s, p) => s + p.etablissements, 0).toLocaleString('fr-FR')} />
        <StatCard label="Élèves" value={demoProvinces.reduce((s, p) => s + p.eleves, 0).toLocaleString('fr-FR')} />
        <StatCard label="Zones actives" value={String(demoProvinces.filter((p) => p.statut === 'Actif').length)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoProvinces.map((p) => (
          <div key={p.nom} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{p.nom}</h3>
              <span className="text-2xl">📍</span>
            </div>
            <p className="text-sm text-slate-500">Chef-lieu : {p.chefLieu}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <p className="text-slate-400">Établissements</p>
                <p className="font-semibold text-slate-900">{p.etablissements}</p>
              </div>
              <div>
                <p className="text-slate-400">Élèves</p>
                <p className="font-semibold text-slate-900">{p.eleves.toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
