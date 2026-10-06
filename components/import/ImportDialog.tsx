'use client';

import { useRef, useState } from 'react';

type ImportResult = {
  imported: number;
  errors: { row: number; message: string }[];
  total: number;
};

type ImportDialogProps = {
  /** API endpoint that accepts FormData with a "file" field */
  endpoint: string;
  /** Module name displayed in the dialog */
  moduleName: string;
  /** Column names the file should contain */
  columns: string[];
  /** Called after a successful import to refresh data */
  onImported: () => void;
  /** Called when dialog should close */
  onClose: () => void;
};

export function ImportDialog({ endpoint, moduleName, columns, onImported, onClose }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File | null) {
    setResult(null);
    setError('');
    setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'import.');
      } else {
        setResult(data);
        if (data.imported > 0) onImported();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const header = columns.join(',');
    const example = columns.map((col) => {
      const examples: Record<string, string> = {
        matricule: 'EL001',
        nom: 'Mukendi',
        postNom: 'Kalonji',
        prenom: 'Jean',
        sexe: 'M',
        dateNaissance: '2010-05-15',
        lieuNaissance: 'Kinshasa',
        classe: '6ème primaire',
        telephone: '+243812345678',
        email: 'jean@example.com',
        adresse: 'Commune de Gombe',
        nomTuteur: 'Kalonji Paul',
        telephoneTuteur: '+243899112233',
        etablissementId: '',
      };
      return examples[col] ?? '';
    });
    const csv = header + '\n' + example.join(',');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modele_${moduleName.toLowerCase().replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Importer — {moduleName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Columns info */}
        <div className="mb-4 rounded-xl bg-slate-50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-500">Colonnes attendues :</p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((col) => (
              <span key={col} className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {col}
              </span>
            ))}
          </div>
          <button
            onClick={downloadTemplate}
            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
          >
            ⬇ Télécharger un modèle CSV
          </button>
        </div>

        {/* Drop zone */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mb-4 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} Ko — cliquez pour changer</p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto mb-2 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.66 6 4.5 4.5 0 0117 16h-1m-4-4v9m0 0l-3-3m3 3l3-3" />
                </svg>
                <p className="text-sm font-medium text-slate-600">Glissez un fichier ici ou cliquez pour parcourir</p>
                <p className="mt-1 text-xs text-slate-400">Formats acceptés : CSV, Excel (.xlsx, .xls)</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Result */}
        {result && (
          <div className="mb-4 space-y-3">
            <div className="rounded-xl bg-green-50 px-4 py-3">
              <p className="text-sm font-semibold text-green-800">
                {result.imported} / {result.total} enregistrement(s) importé(s) avec succès.
              </p>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl bg-amber-50 px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-amber-800">{result.errors.length} erreur(s) :</p>
                <ul className="space-y-1 text-xs text-amber-700">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>Ligne {err.row} : {err.message}</li>
                  ))}
                  {result.errors.length > 20 && (
                    <li className="italic">...et {result.errors.length - 20} autre(s) erreur(s)</li>
                  )}
                </ul>
              </div>
            )}
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="btn-secondary-light w-full px-4 py-2.5 text-sm"
            >
              Importer un autre fichier
            </button>
          </div>
        )}

        {/* Actions */}
        {!result && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className={`btn-primary flex-1 px-4 py-2.5 text-sm ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? (<><span className="btn-spinner" /> Importation…</>) : 'Importer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
