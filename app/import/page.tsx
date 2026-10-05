'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/ui/Card';
import { ImportDialog } from '@/components/import/ImportDialog';

type ImportType = 'etablissements' | 'enseignants' | null;

export default function ImportPage() {
  const [activeImport, setActiveImport] = useState<ImportType>(null);

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <PageHeader
            eyebrow="Import de données"
            title="Importer mes données"
            description="Téléversez vos fichiers Excel ou CSV pour alimenter la plateforme avec vos écoles et enseignants."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Carte Établissements */}
            <button
              onClick={() => setActiveImport('etablissements')}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">Importer des établissements</h3>
              <p className="mt-1 text-sm text-slate-500">
                Écoles, collèges, lycées — nom, type, province, effectif…
              </p>
              <p className="mt-3 text-xs font-medium text-blue-600">Téléverser un fichier →</p>
            </button>

            {/* Carte Enseignants */}
            <button
              onClick={() => setActiveImport('enseignants')}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 transition group-hover:bg-green-100">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">Importer des enseignants</h3>
              <p className="mt-1 text-sm text-slate-500">
                Nom, matricule, grade, établissement, spécialité…
              </p>
              <p className="mt-3 text-xs font-medium text-blue-600">Téléverser un fichier →</p>
            </button>
          </div>

          {/* Format attendu */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h4 className="text-sm font-semibold text-slate-700">Format du fichier</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>• Formats acceptés : <strong>Excel (.xlsx, .xls)</strong> ou <strong>CSV</strong></li>
              <li>• La première ligne doit contenir les noms de colonnes</li>
              <li>• Maximum 2000 lignes par import</li>
              <li>• Un modèle CSV téléchargeable est disponible dans la fenêtre d'import</li>
            </ul>
          </div>
        </div>
      </div>

      {activeImport === 'etablissements' && (
        <ImportDialog
          endpoint="/api/import/etablissements"
          moduleName="Établissements"
          columns={['nom', 'type', 'province', 'ville', 'adresse', 'telephone', 'email', 'effectif', 'statut']}
          onImported={() => {}}
          onClose={() => setActiveImport(null)}
        />
      )}

      {activeImport === 'enseignants' && (
        <ImportDialog
          endpoint="/api/import/enseignants"
          moduleName="Enseignants"
          columns={['nom', 'matricule', 'grade', 'etablissement', 'specialite', 'telephone', 'email', 'statut']}
          onImported={() => {}}
          onClose={() => setActiveImport(null)}
        />
      )}
    </AppShell>
  );
}
