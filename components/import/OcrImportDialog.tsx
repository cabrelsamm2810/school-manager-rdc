'use client';

import { useRef, useState } from 'react';
import { createWorker, type Worker } from 'tesseract.js';

type ImportResult = {
  imported: number;
  errors: { row: number; message: string }[];
  total: number;
};

type OcrImportDialogProps = {
  endpoint: string;
  moduleName: string;
  columns: string[];
  onImported: () => void;
  onClose: () => void;
};

type Phase = 'upload' | 'processing' | 'review' | 'result';

const DELIMITERS: { label: string; value: string; regex: RegExp }[] = [
  { label: 'Auto', value: 'auto', regex: /\t|\s{2,}|[,;|]/ },
  { label: 'Tabulation', value: 'tab', regex: /\t/ },
  { label: '2+ espaces', value: 'spaces', regex: /\s{2,}/ },
  { label: '1 espace', value: 'space', regex: / / },
  { label: 'Virgule', value: 'comma', regex: /,/ },
  { label: 'Point-virgule', value: 'semicolon', regex: /;/ },
  { label: 'Barre |', value: 'pipe', regex: /\|/ },
];

function parseLine(line: string, regex: RegExp): string[] {
  return line
    .split(regex)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Convert rows to CSV string */
function rowsToCsv(columns: string[], rows: string[][]): string {
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map((r) => r.map((c) => escape(c ?? '')).join(','));
  return [header, ...body].join('\n');
}

export function OcrImportDialog({ endpoint, moduleName, columns, onImported, onClose }: OcrImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [phase, setPhase] = useState<Phase>('upload');
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [delimiter, setDelimiter] = useState('auto');
  const [rows, setRows] = useState<string[][]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPG, PNG).');
      return;
    }
    setError('');
    setFile(f);
  }

  async function runOcr() {
    if (!file) return;
    setPhase('processing');
    setProgress(0);
    setError('');

    try {
      const worker = await createWorker('fra', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      workerRef.current = worker;

      const { data } = await worker.recognize(file);
      await worker.terminate();
      workerRef.current = null;

      const text = data.text.trim();
      setRawText(text);
      autoParse(text, delimiter);
      setPhase('review');
    } catch {
      setError("Échec de la reconnaissance de texte. Réessayez avec une image plus nette.");
      setPhase('upload');
    }
  }

  /** Find the best matching target column for a header field name */
  function matchColumn(headerField: string): number {
    const h = headerField.toLowerCase().trim();
    // Exact match
    let idx = columns.findIndex((c) => c.toLowerCase() === h);
    if (idx >= 0) return idx;
    // Partial match (header field contains column name or vice-versa)
    idx = columns.findIndex((c) => c.toLowerCase().includes(h) || h.includes(c.toLowerCase()));
    return idx; // -1 if no match
  }

  function autoParse(text: string, delim: string) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Detect header line (2+ column names found in the line)
    const headerLineIdx = lines.findIndex((line) => {
      const lower = line.toLowerCase();
      return columns.filter((c) => lower.includes(c.toLowerCase())).length >= 2;
    });

    let regex = (DELIMITERS.find((d) => d.value === delim) ?? DELIMITERS[0]).regex;

    // Data lines = all lines except the header line
    let dataLines = lines.filter((_, i) => i !== headerLineIdx);

    // Auto mode: if the default regex yields only 1 field per line, fall back to single space
    if (delim === 'auto' && dataLines.length > 0) {
      const avgFields =
        dataLines.reduce((sum, l) => sum + parseLine(l, regex).length, 0) / dataLines.length;
      if (avgFields <= 1) {
        regex = / /; // single space
      }
    }

    // Build column mapping from header line if found
    let colMap: number[] | null = null; // colMap[sourceIdx] = targetColIdx
    if (headerLineIdx >= 0) {
      const headerFields = parseLine(lines[headerLineIdx], regex);
      colMap = headerFields.map(matchColumn);
    }

    const parsed = dataLines.map((line) => {
      const fields = parseLine(line, regex);
      if (colMap) {
        // Map each source field to its target column
        const mapped = Array(columns.length).fill('');
        fields.forEach((val, srcIdx) => {
          const tgtIdx = colMap[srcIdx];
          if (tgtIdx >= 0 && tgtIdx < columns.length) mapped[tgtIdx] = val;
        });
        return mapped;
      }
      // No header detected — positional mapping
      const padded = [...fields];
      while (padded.length < columns.length) padded.push('');
      return padded.slice(0, columns.length);
    });

    setRows(parsed);
  }

  function reparse(newDelim: string) {
    setDelimiter(newDelim);
    autoParse(rawText, newDelim);
  }

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? r.map((c, j) => (j === colIdx ? value : c)) : r))
    );
  }

  function deleteRow(rowIdx: number) {
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  }

  function addRow() {
    setRows((prev) => [...prev, Array(columns.length).fill('')]);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setLoading(true);
    setError('');
    setImportResult(null);

    try {
      const csv = rowsToCsv(columns, rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const formData = new FormData();
      formData.append('file', blob, 'ocr_import.csv');

      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'import.");
      } else {
        setImportResult(data);
        if (data.imported > 0) onImported();
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
    setRawText('');
    setRows([]);
    setError('');
    setImportResult(null);
    setProgress(0);
  }

  // Cleanup worker on unmount
  function handleClose() {
    if (workerRef.current) workerRef.current.terminate();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">OCR — {moduleName}</h2>
            <p className="text-xs text-slate-500">Importez depuis une photo ou un scan de document</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Phase: Upload */}
          {phase === 'upload' && (
            <>
              <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                📸 Prenez une photo claire du document (liste d'élèves, registre d'enseignants, etc.).
                L'OCR fonctionne mieux avec un texte imprimé bien lisible.
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
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0] ?? null)}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="aperçu"
                      className="max-h-40 rounded-lg object-contain"
                    />
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto mb-2 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">Prenez une photo ou sélectionnez une image</p>
                    <p className="mt-1 text-xs text-slate-400">JPG, PNG — scan ou photo de document</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </>
          )}

          {/* Phase: Processing */}
          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-sm font-medium text-slate-700">Reconnaissance de texte en cours…</p>
              <div className="mt-4 w-full max-w-xs">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-slate-500">{progress}%</p>
              </div>
            </div>
          )}

          {/* Phase: Review */}
          {phase === 'review' && !importResult && (
            <>
              {/* Raw text + delimiter */}
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Texte extrait (modifiable — corrigez si nécessaire) :
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    autoParse(e.target.value, delimiter);
                  }}
                  className="h-32 w-full resize-y rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Texte OCR…"
                />
              </div>

              {/* Delimiter selector */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Séparateur :</span>
                {DELIMITERS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => reparse(d.value)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                      delimiter === d.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Editable table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-2 py-2 text-left font-medium text-slate-400">#</th>
                      {columns.map((col) => (
                        <th key={col} className="px-2 py-2 text-left font-medium text-slate-600">
                          {col}
                        </th>
                      ))}
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 2} className="px-3 py-6 text-center text-slate-400">
                          Aucune ligne détectée. Ajustez le séparateur ou éditez le texte.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, ri) => (
                        <tr key={ri} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-2 py-1 text-slate-400">{ri + 1}</td>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-1 py-1">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => updateCell(ri, ci, e.target.value)}
                                className="w-full min-w-[80px] rounded border border-transparent px-1.5 py-1 text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1">
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addRow}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                + Ajouter une ligne
              </button>

              <p className="mt-3 text-xs text-slate-500">
                {rows.length} ligne(s) prête(s) à importer. Vérifiez et corrigez les cellules avant l'import.
              </p>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </>
          )}

          {/* Phase: Result */}
          {importResult && (
            <div className="space-y-3">
              <div className="rounded-xl bg-green-50 px-4 py-3">
                <p className="text-sm font-semibold text-green-800">
                  {importResult.imported} / {importResult.total} enregistrement(s) importé(s) avec succès.
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl bg-amber-50 px-4 py-3">
                  <p className="mb-2 text-sm font-semibold text-amber-800">
                    {importResult.errors.length} erreur(s) :
                  </p>
                  <ul className="space-y-1 text-xs text-amber-700">
                    {importResult.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>Ligne {err.row} : {err.message}</li>
                    ))}
                    {importResult.errors.length > 20 && (
                      <li className="italic">...et {importResult.errors.length - 20} autre(s) erreur(s)</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 p-5">
          {phase === 'upload' && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={runOcr}
                disabled={!file}
                className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
              >
                🔍 Lancer l'OCR
              </button>
            </>
          )}

          {phase === 'review' && !importResult && (
            <>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Nouvelle image
              </button>
              <button
                onClick={handleImport}
                disabled={rows.length === 0 || loading}
                className={`btn-primary flex-1 px-4 py-2.5 text-sm ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (
                  <><span className="btn-spinner" /> Importation…</>
                ) : (
                  `Importer ${rows.length} ligne(s)`
                )}
              </button>
            </>
          )}

          {importResult && (
            <>
              <button
                onClick={reset}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Importer une autre image
              </button>
              <button
                onClick={handleClose}
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
