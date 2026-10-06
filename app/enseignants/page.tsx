'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';
import { ImportDialog } from '@/components/import/ImportDialog';
import { OcrImportDialog } from '@/components/import/OcrImportDialog';

export default function EnseignantsPage() {
  const [showImport, setShowImport] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ModulePage icon="teacher" eyebrow="Gestion scolaire" title="Gestion des enseignants" description="Recensement, affectation et suivi des enseignants.">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button onClick={() => setShowImport(true)} className="btn-secondary-light px-4 py-2.5 text-sm">
          ⬆ Importer (Excel/CSV)
        </button>
        <button onClick={() => setShowOcr(true)} className="btn-secondary-light px-4 py-2.5 text-sm">
          📸 Importer (OCR)
        </button>
      </div>

      <CrudManager key={refreshKey} config={crudConfigs.enseignants} />

      {showImport && (
        <ImportDialog
          endpoint="/api/import/enseignants"
          moduleName="Enseignants"
          columns={['nom', 'matricule', 'grade', 'etablissement', 'specialite', 'telephone', 'email', 'statut']}
          onImported={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowImport(false)}
        />
      )}

      {showOcr && (
        <OcrImportDialog
          endpoint="/api/import/enseignants"
          moduleName="Enseignants"
          columns={['nom', 'matricule', 'grade', 'etablissement', 'specialite', 'telephone', 'email', 'statut']}
          onImported={() => setRefreshKey((k) => k + 1)}
          onClose={() => setShowOcr(false)}
        />
      )}
    </ModulePage>
  );
}
