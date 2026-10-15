'use client';

import { useRef, useState } from 'react';
import {
  parseTxtContent,
  generateExampleTxt,
  TXT_COLUMNS,
  type ParsedSchoolRow,
  type PreviewRow,
  MAX_IMPORT_LINES,
} from '@/lib/txt-import-parser';

type Phase = 'upload' | 'review' | 'result';

type BatchResult = {
  imported: number;
  ignored: number;
  rejected: number;
  total: number;
  details: { row: number; nom: string; action: 'imported' | 'ignored' | 'rejected'; message: string }[];
};

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

      // Appeler l'API de preview pour la détection de doublons
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

  const okCount = previewRows.filter((r) => r.status === 'ok').length;
  const warningCount = previewRows.filter((r) => r.status === 'warning').length;
  const errorCount = previewRows.filter((r) => r.status === 'error').length;

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
              {/* Format help */}
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

              {/* Example preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">Exemple de contenu :</p>
                <pre className="overflow-x-auto text-xs text-slate-600 font-mono whitespace-pre-wrap">{`Nom de l'école | Convention | Province éducationnelle | Sous-division | Adresse
École primaire Exemple | EC-ERC | Kinshasa Mont-Amba | Lemba | Kinshasa
Institut Exemple | EC-ERC | Kinshasa Funa | Kalamu | Kinshasa`}</pre>
              </div>

              {/* Drop zone */}
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
              {/* Stats */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {previewRows.length} école(s)
                </span>
                <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  {okCount} OK
                </span>
                {warningCount > 0 && (
                  <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {warningCount} doublon(s)
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    {errorCount} erreur(s)
                  </span>
                )}
                <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs text-slate-500">
                  Séparateur : {separator === '\t' ? 'tab' : separator || 'auto'}
                </span>
              </div>

              {/* Parse warnings */}
              {parseWarnings.length > 0 && (
                <div className="rounded-xl bg-amber-50 px-3 py-2">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Avertissements du parsing :</p>
                  <ul className="space-y-0.5 text-xs text-amber-700">
                    {parseWarnings.slice(0, 5).map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}

              {/* Editable table — mobile cards */}
              <div className="space-y-2 lg:hidden">
                {previewRows.map((row, ri) => (
                  <div
                    key={ri}
                    className={`rounded-xl border p-3 ${
                      row.status === 'error' ? 'border-red-200 bg-red-50' :
                      row.status === 'warning' ? 'border-amber-200 bg-amber-50' :
                      'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">#{ri + 1}</span>
                      <button
                        onClick={() => deleteRow(ri)}
                        className="text-slate-300 hover:text-red-500"
                        title="Supprimer"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {row.messages.length > 0 && (
                      <div className="mb-2 space-y-0.5">
                        {row.messages.map((msg, mi) => (
                          <p key={mi} className={`text-xs ${
                            row.status === 'error' ? 'text-red-600' :
                            row.status === 'warning' ? 'text-amber-600' : 'text-slate-500'
                          }`}>⚠ {msg}</p>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={row.nom}
                        onChange={(e) => updateCell(ri, 'nom', e.target.value)}
                        placeholder="Nom de l'école *"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={row.institution}
                          onChange={(e) => updateCell(ri, 'institution', e.target.value)}
                          placeholder="Convention"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={row.provinceEducationnelle}
                          onChange={(e) => updateCell(ri, 'provinceEducationnelle', e.target.value)}
                          placeholder="Province éduc."
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={row.commune}
                          onChange={(e) => updateCell(ri, 'commune', e.target.value)}
                          placeholder="Sous-division"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={row.adresse}
                          onChange={(e) => updateCell(ri, 'adresse', e.target.value)}
                          placeholder="Adresse"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={row.telephone}
                          onChange={(e) => updateCell(ri, 'telephone', e.target.value)}
                          placeholder="Téléphone"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={row.type}
                          onChange={(e) => updateCell(ri, 'type', e.target.value)}
                          placeholder="Type"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editable table — desktop */}
              <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-2 py-2 text-left font-medium text-slate-400">#</th>
                      {TXT_COLUMNS.map((col) => (
                        <th key={col.key} className="px-2 py-2 text-left font-medium text-slate-600">
                          {col.label}{col.required && <span className="text-red-400"> *</span>}
                        </th>
                      ))}
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr
                        key={ri}
                        className={`border-t border-slate-100 ${
                          row.status === 'error' ? 'bg-red-50' :
                          row.status === 'warning' ? 'bg-amber-50' : ''
                        }`}
                      >
                        <td className="px-2 py-1 text-slate-400 align-top">{ri + 1}</td>
                        {TXT_COLUMNS.map((col) => (
                          <td key={col.key} className="px-1 py-1">
                            <input
                              type="text"
                              value={row[col.key]}
                              onChange={(e) => updateCell(ri, col.key, e.target.value)}
                              className={`w-full min-w-[70px] rounded border border-transparent px-1.5 py-1 text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 ${
                                col.key === 'nom' ? 'font-medium' : ''
                              }`}
                            />
                            {col.key === 'nom' && row.messages.length > 0 && (
                              <div className="mt-0.5 space-y-0.5">
                                {row.messages.map((msg, mi) => (
                                  <p key={mi} className={`text-[10px] ${
                                    row.status === 'error' ? 'text-red-500' :
                                    row.status === 'warning' ? 'text-amber-600' : 'text-slate-400'
                                  }`}>⚠ {msg}</p>
                                ))}
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-1 align-top">
                          <button
                            onClick={() => deleteRow(ri)}
                            className="text-slate-300 hover:text-red-500"
                            title="Supprimer la ligne"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addRow}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                + Ajouter une ligne
              </button>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>
          )}

          {/* Phase: Result */}
          {phase === 'result' && result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-green-50 px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                  <p className="text-xs text-green-600">Enregistrées</p>
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{result.ignored}</p>
                  <p className="text-xs text-amber-600">Ignorées (doublons)</p>
                </div>
                <div className="rounded-xl bg-red-50 px-3 py-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{result.rejected}</p>
                  <p className="text-xs text-red-600">Rejetées</p>
                </div>
              </div>

              {result.details.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-2 py-2 text-left">Ligne</th>
                        <th className="px-2 py-2 text-left">École</th>
                        <th className="px-2 py-2 text-left">Statut</th>
                        <th className="px-2 py-2 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.details.map((d, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5 text-slate-400">{d.row}</td>
                          <td className="px-2 py-1.5 font-medium text-slate-700">{d.nom}</td>
                          <td className="px-2 py-1.5">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              d.action === 'imported' ? 'bg-green-100 text-green-700' :
                              d.action === 'ignored' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {d.action === 'imported' ? 'Enregistrée' : d.action === 'ignored' ? 'Ignorée' : 'Rejetée'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-slate-500">{d.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
