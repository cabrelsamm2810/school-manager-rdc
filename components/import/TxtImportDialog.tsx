'use client';

import { useRef, useState } from 'react';
import {
  parseTxtContent,
  generateExampleTxt,
  type ParsedSchoolRow,
  type PreviewRow,
  MAX_IMPORT_LINES,
} from '@/lib/txt-import-parser';
import { SchoolPreviewTable } from '@/components/import/SchoolPreviewTable';
import { SchoolPreviewStats, SchoolParseWarnings, SchoolImportResult, type BatchResult } from '@/components/import/SchoolPreviewShared';

type Phase = 'upload' | 'review' | 'result';

type TxtImportDialogProps = {
  onImported: () => void;
  onClose: () => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

export function TxtImportDialog({ onImported, onClose }: TxtImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [separator, setSeparator] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    setError('');
    if (f.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo).`);
      return;
    }
    setFile(f);
    readFile(f);
  }

  async function readFile(f: File) {
    try {
      const content = await f.text();
      const parsed = parseTxtContent(content);
      setParseWarnings(parsed.warnings);
      setSeparator(parsed.separator);

      if (parsed.rows.length === 0) {
        setError('Aucune ligne valide détectée dans le fichier.');
        return;
      }

      setLoading(true);
      const res = await fetch('/api/import/ecoles/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.rows }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la vérification.');
        setPreviewRows(parsed.rows.map((r, i) => ({ ...r, rowIndex: i, status: 'ok' as const, messages: [] })));
        setPhase('review');
        return;
      }

      setPreviewRows(data.rows);
      setPhase('review');
    } catch {
      setError('Impossible de lire le fichier.');
      setLoading(false);
    }
  }

  function updateCell(rowIdx: number, key: keyof ParsedSchoolRow, value: string) {
    setPreviewRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)),
    );
  }

  function deleteRow(rowIdx: number) {
    setPreviewRows((prev) => prev.filter((_, i) => i !== rowIdx));
  }

  function addRow() {
    const empty: ParsedSchoolRow = {
      nom: '', type: '', institution: '', dinacope: '', province: '',
      provinceEducationnelle: '', ville: '', commune: '', adresse: '',
      telephone: '', email: '', chefEcole: '', effectif: '',
    };
    setPreviewRows((prev) => [...prev, { ...empty, rowIndex: prev.length, status: 'ok', messages: [] }]);
  }

  function downloadExample() {
    const content = generateExampleTxt();
    const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemple_import_ecoles.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const cleanRows = previewRows.map(({ rowIndex, status, messages, duplicateId, duplicateNom, ...rest }) => rest);
      const res = await fetch('/api/import/ecoles/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: cleanRows }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement.");
      } else {
        setResult(data);
        if (data.imported > 0) onImported();
        setPhase('result');
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhase('upload');
    setFile(null);
    setPreviewRows([]);
    setParseWarnings([]);
    setError('');
    setResult(null);
    setSeparator('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Importer des écoles — Fichier TXT</h2>
            <p className="text-xs text-slate-500">Sélectionnez un fichier .txt contenant une liste d'écoles</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Phase: Upload */}
          {phase === 'upload' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">📋 Format attendu</p>
                <ul className="space-y-0.5 text-xs text-blue-700">
                  <li>• <strong>Liste simple</strong> : un nom d'école par ligne</li>
                  <li>• <strong>Liste structurée</strong> : première ligne = en-tête, séparateur <code>|</code>, <code>;</code>, tabulation ou virgule</li>
                  <li>• Maximum {MAX_IMPORT_LINES} écoles par import, 5 Mo par fichier</li>
                </ul>
                <button
                  onClick={downloadExample}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  ⬇ Télécharger un exemple de fichier TXT
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">Exemple de contenu :</p>
                <pre className="overflow-x-auto text-xs text-slate-600 font-mono whitespace-pre-wrap">{`Nom de l'école | Convention | Province éducationnelle | Sous-division | Adresse
École primaire Exemple | EC-ERC | Kinshasa Mont-Amba | Lemba | Kinshasa
Institut Exemple | EC-ERC | Kinshasa Funa | Kalamu | Kinshasa`}</pre>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0] ?? null);
                }}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                    <p className="text-sm font-medium text-slate-600">Analyse du fichier…</p>
                  </div>
                ) : file ? (
                  <div>
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} Ko</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto mb-2 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-6 2a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">Sélectionnez un fichier .txt</p>
                    <p className="mt-1 text-xs text-slate-400">Cliquez ou glissez votre fichier ici</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>
          )}

          {/* Phase: Review */}
          {phase === 'review' && (
            <div className="space-y-3">
              <SchoolPreviewStats
                rows={previewRows}
                extraBadges={
                  <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs text-slate-500">
                    Séparateur : {separator === '\t' ? 'tab' : separator || 'auto'}
                  </span>
                }
              />
              <SchoolParseWarnings warnings={parseWarnings} />
              <SchoolPreviewTable
                rows={previewRows}
                onUpdateCell={updateCell}
                onDeleteRow={deleteRow}
                onAddRow={addRow}
              />
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>
          )}

          {/* Phase: Result */}
          {phase === 'result' && result && (
            <SchoolImportResult result={result} />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 p-4 sm:p-5">
          {phase === 'upload' && (
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
          )}

          {phase === 'review' && (
            <>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Nouveau fichier
              </button>
              <button
                onClick={handleSave}
                disabled={previewRows.length === 0 || loading}
                className={`btn-primary flex-1 px-4 py-2.5 text-sm ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (
                  <><span className="btn-spinner" /> Enregistrement…</>
                ) : (
                  `Enregistrer ${previewRows.length} école(s)`
                )}
              </button>
            </>
          )}

          {phase === 'result' && (
            <>
              <button
                onClick={reset}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Importer un autre fichier
              </button>
              <button
                onClick={onClose}
                className="btn-primary flex-1 px-4 py-2.5 text-sm"
              >
                Terminer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
