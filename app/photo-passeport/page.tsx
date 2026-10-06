'use client';

import { useEffect, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { StatutBadge } from '@/components/ui/StatutBadge';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
};

export default function PhotoPasseportPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/eleves')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.eleves) setEleves(data.eleves);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Le modèle Eleve n'a pas encore de champ photo — toutes les photos sont "En attente"
  const validees = 0;
  const enAttente = eleves.length;
  const manquantes = 0;

  return (
    <ModulePage icon="photo" eyebrow="Gestion scolaire" title="Photo passeport numérique" description="Capture et gestion des photos d'identité numériques des élèves.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Validées" value={loading ? '—' : String(validees)} />
        <StatCard label="En attente" value={loading ? '—' : String(enAttente)} />
        <StatCard label="Manquantes" value={loading ? '—' : String(manquantes)} />
      </div>
      <div className="mb-4 flex justify-end">
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Importer des photos</button>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Chargement…</p>
        </div>
      ) : eleves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Aucun élève enregistré. Ajoutez des élèves via le module « Élèves ».</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {eleves.map((e) => (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
              <div className="mx-auto mb-3 flex h-24 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                <span className="text-3xl">📷</span>
              </div>
              <p className="truncate text-sm font-medium text-slate-900">{e.nom} {e.prenom}</p>
              <p className="text-xs text-slate-500">{e.matricule}</p>
              <div className="mt-2 flex justify-center">{<StatutBadge statut="En attente" />}</div>
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
