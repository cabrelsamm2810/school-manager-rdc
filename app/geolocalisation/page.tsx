'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { demoGeoloc } from '@/lib/demo-data';

export default function GeolocalisationPage() {
  const [search, setSearch] = useState('');
  const data = demoGeoloc.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.province.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ModulePage icon="location" eyebrow="Services" title="Géolocalisation" description="Localisation des établissements et des utilisateurs sur la carte.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Établissements localisés" value={String(demoGeoloc.length)} />
        <StatCard label="Provinces couvertes" value={String(new Set(demoGeoloc.map((e) => e.province)).size)} />
        <StatCard label="Élèves total" value={demoGeoloc.reduce((s, e) => s + e.eleves, 0).toLocaleString('fr-FR')} />
        <StatCard label="Position moyenne" value="RDC" hint="Centre national" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Carte simulée */}
        <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-blue-50 shadow-soft lg:h-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-slate-400">🗺️ Carte de la RDC</p>
          </div>
          {data.map((e, i) => (
            <div
              key={i}
              className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white shadow-lg"
              style={{ left: `${20 + i * 12}%`, top: `${25 + i * 12}%` }}
              title={e.nom}
            >
              📍
            </div>
          ))}
        </div>

        {/* Liste des établissements */}
        <div>
          <input type="text" value={search} onChange={(ev) => setSearch(ev.target.value)} placeholder="Rechercher un établissement…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <div className="space-y-3">
            {data.map((e, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{e.nom}</p>
                  <span className="text-lg">📍</span>
                </div>
                <p className="text-sm text-slate-500">{e.province}</p>
                <div className="mt-2 flex gap-4 text-xs text-slate-400">
                  <span>Lat: {e.latitude}</span>
                  <span>Lng: {e.longitude}</span>
                  <span>{e.eleves.toLocaleString('fr-FR')} élèves</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
