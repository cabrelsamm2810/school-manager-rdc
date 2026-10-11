'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';

type Ecole = {
  id: string;
  nom: string;
  province: string;
  ville: string;
  effectif: number;
};

export default function GeolocalisationPage() {
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/ecoles')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ecoles) setEcoles(data.ecoles);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const data = ecoles.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    (e.province || '').toLowerCase().includes(search.toLowerCase())
  );

  const provinces = new Set(ecoles.map((e) => e.province).filter(Boolean));
  const totalEleves = ecoles.reduce((s, e) => s + (e.effectif || 0), 0);

  return (
    <ModulePage icon="location" eyebrow="Services" title="Géolocalisation" description="Localisation des écoles et des utilisateurs sur la carte.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Écoles localisés" value={loading ? '—' : String(ecoles.length)} />
        <StatCard label="Provinces couvertes" value={loading ? '—' : String(provinces.size)} />
        <StatCard label="Élèves total" value={loading ? '—' : totalEleves.toLocaleString('fr-FR')} />
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
              key={e.id}
              className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white shadow-lg"
              style={{ left: `${20 + (i % 5) * 12}%`, top: `${25 + Math.floor(i / 5) * 15}%` }}
              title={e.nom}
            >
              📍
            </div>
          ))}
        </div>

        {/* Liste des écoles */}
        <div>
          <input type="text" value={search} onChange={(ev) => setSearch(ev.target.value)} placeholder="Rechercher une école…" className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Aucune école trouvée.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((e) => (
                <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{e.nom}</p>
                    <span className="text-lg">📍</span>
                  </div>
                  <p className="text-sm text-slate-500">{e.province || '—'}{e.ville ? ` · ${e.ville}` : ''}</p>
                  <div className="mt-2 flex gap-4 text-xs text-slate-400">
                    <span>{(e.effectif || 0).toLocaleString('fr-FR')} élèves</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
