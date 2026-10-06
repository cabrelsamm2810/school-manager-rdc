'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';

type Province = {
  id: string;
  nom: string;
  chefLieu: string;
  etablissements: number;
  eleves: number;
  statut: string;
};

export default function CarteScolairePage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/provinces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.provinces) setProvinces(data.provinces);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalEtablissements = provinces.reduce((s, p) => s + (p.etablissements || 0), 0);
  const totalEleves = provinces.reduce((s, p) => s + (p.eleves || 0), 0);
  const zonesActives = provinces.filter((p) => p.statut === 'Actif').length;

  return (
    <ModulePage icon="map" eyebrow="Gestion scolaire" title="Carte scolaire numérique" description="Cartographie des établissements, zones et effectifs scolaires.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Provinces couvertes" value={loading ? '—' : String(provinces.length)} />
        <StatCard label="Établissements" value={loading ? '—' : totalEtablissements.toLocaleString('fr-FR')} />
        <StatCard label="Élèves" value={loading ? '—' : totalEleves.toLocaleString('fr-FR')} />
        <StatCard label="Zones actives" value={loading ? '—' : String(zonesActives)} />
      </div>
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Chargement…</p>
        </div>
      ) : provinces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Aucune province enregistrée. Ajoutez des provinces via le module « Provinces ».</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {provinces.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{p.nom}</h3>
                <span className="text-2xl">📍</span>
              </div>
              <p className="text-sm text-slate-500">Chef-lieu : {p.chefLieu || '—'}</p>
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
      )}
    </ModulePage>
  );
}
