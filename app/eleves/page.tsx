'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { EleveForm } from '@/components/eleves/EleveForm';
import { EleveList } from '@/components/eleves/EleveList';
import { ImportDialog } from '@/components/import/ImportDialog';

export default function ElevesPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ModulePage
      icon="users"
      eyebrow="Gestion scolaire"
      title="Gestion des élèves"
      description="Inscription, dossiers, affectation et suivi des élèves."
    >
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setShowImport(true)}
          className="btn-secondary-light px-4 py-2.5 text-sm"
        >
          ⬆ Importer (Excel/CSV)
        </button>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary px-4 py-2.5 text-sm"
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

      {showImport && (
        <ImportDialog
          endpoint="/api/import/eleves"
          moduleName="Élèves"
          columns={['matricule', 'nom', 'postNom', 'prenom', 'sexe', 'dateNaissance', 'lieuNaissance', 'classe', 'telephone', 'email', 'adresse', 'nomTuteur', 'telephoneTuteur']}
          onImported={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowImport(false)}
        />
      )}
    </ModulePage>
  );
}
