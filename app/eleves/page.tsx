'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { EleveForm } from '@/components/eleves/EleveForm';
import { EleveList } from '@/components/eleves/EleveList';
import { ImportDialog } from '@/components/import/ImportDialog';
import { OcrImportDialog } from '@/components/import/OcrImportDialog';
import { CalendarView } from '@/components/eleves/CalendarView';

export default function ElevesPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<'liste' | 'calendrier'>('liste');

  return (
    <ModulePage
      icon="users"
      eyebrow="Gestion scolaire"
      title="Gestion des élèves"
      description="Inscription, dossiers, affectation et suivi des élèves."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setView('liste')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === 'liste' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 Liste
          </button>
          <button
            onClick={() => setView('calendrier')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === 'calendrier' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📅 Calendrier
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary-light px-4 py-2.5 text-sm"
          >
            ⬆ Importer (Excel/CSV)
          </button>
          <button
            onClick={() => setShowOcr(true)}
            className="btn-secondary-light px-4 py-2.5 text-sm"
          >
            📸 Importer (OCR)
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary px-4 py-2.5 text-sm"
          >
            {showForm ? '← Retour à la liste' : '+ Nouvel élève'}
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Enregistrer un nouvel élève</h2>
          <EleveForm onCreated={() => setRefreshKey((k) => k + 1)} />
        </div>
      ) : view === 'calendrier' ? (
        <CalendarView classeFilter="" />
      ) : (
        <EleveList refreshKey={refreshKey} />
      )}

      {showImport && (
        <ImportDialog
          endpoint="/api/import/eleves"
          moduleName="Élèves"
          columns={['matricule', 'nom', 'postNom', 'prenom', 'sexe', 'dateNaissance', 'lieuNaissance', 'classe', 'telephone', 'email', 'adresse', 'nomTuteur', 'telephoneTuteur', 'ecoleId']}
          onImported={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowImport(false)}
        />
      )}

      {showOcr && (
        <OcrImportDialog
          endpoint="/api/import/eleves"
          moduleName="Élèves"
          columns={['matricule', 'nom', 'postNom', 'prenom', 'sexe', 'dateNaissance', 'lieuNaissance', 'classe', 'telephone', 'email', 'adresse', 'nomTuteur', 'telephoneTuteur', 'ecoleId']}
          onImported={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowOcr(false)}
        />
      )}
    </ModulePage>
  );
}
