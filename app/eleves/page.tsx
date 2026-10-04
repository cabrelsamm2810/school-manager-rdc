'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { EleveForm } from '@/components/eleves/EleveForm';
import { EleveList } from '@/components/eleves/EleveList';

export default function ElevesPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ModulePage
      icon="users"
      eyebrow="Gestion scolaire"
      title="Gestion des élèves"
      description="Inscription, dossiers, affectation et suivi des élèves."
    >
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {showForm ? '← Retour à la liste' : '+ Nouvel élève'}
        </button>
      </div>

      {showForm ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Enregistrer un nouvel élève</h2>
          <EleveForm onCreated={() => setRefreshKey((k) => k + 1)} />
        </div>
      ) : (
        <EleveList refreshKey={refreshKey} />
      )}
    </ModulePage>
  );
}
