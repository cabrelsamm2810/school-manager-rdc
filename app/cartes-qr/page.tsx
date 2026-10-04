'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { statutBadge, demoCartesQR } from '@/lib/demo-data';

export default function CartesQrPage() {
  return (
    <ModulePage icon="qr" eyebrow="Gestion scolaire" title="QR code & cartes scolaires" description="Génération de cartes scolaires avec QR code d'identification.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Cartes générées" value={String(demoCartesQR.filter((c) => c.statut === 'Générée').length)} />
        <StatCard label="En attente" value={String(demoCartesQR.filter((c) => c.statut === 'En attente').length)} />
        <StatCard label="Total" value={String(demoCartesQR.length)} />
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Exporter PDF</button>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Générer les cartes</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoCartesQR.map((c) => (
          <div key={c.matricule} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
            {/* Aperçu carte */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 text-3xl">👤</div>
              <div>
                <p className="font-bold">{c.nom}</p>
                <p className="text-sm text-blue-100">{c.classe}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-slate-500">Matricule</p>
                <p className="font-medium text-slate-900">{c.matricule}</p>
                <p className="mt-1 text-xs text-slate-500">Carte #{c.carte}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-2xl">▣</div>
            </div>
            <div className="border-t border-slate-100 px-4 py-2.5">{statutBadge(c.statut)}</div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
