'use client';

import { useRef, useState } from 'react';
import type { Worker } from 'tesseract.js';
import {
  type ParsedSchoolRow,
  type PreviewRow,
  MAX_IMPORT_LINES,
} from '@/lib/txt-import-parser';
import { SchoolPreviewTable } from '@/components/import/SchoolPreviewTable';
import { SchoolPreviewStats, SchoolParseWarnings, SchoolImportResult, type BatchResult } from '@/components/import/SchoolPreviewShared';

type OcrEcolesImportDialogProps = {
  onImported: () => void;
  onClose: () => void;
};

type Phase = 'upload' | 'processing' | 'review' | 'result';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

/** Alias d'en-tête → champ cible (insensible à la casse et aux accents). */
const HEADER_ALIASES: Record<string, keyof ParsedSchoolRow> = {
  nom: 'nom',
  "nom de l'ecole": 'nom',
  "nom de l'école": 'nom',
  "nom de l ecole": 'nom',
  ecole: 'nom',
  école: 'nom',
  denomination: 'nom',
  convention: 'institution',
  institution: 'institution',
  type: 'type',
  dinacope: 'dinacope',
  province: 'province',
  'province administrative': 'province',
  'province educationnelle': 'provinceEducationnelle',
  'province éducationnelle': 'provinceEducationnelle',
  'province educ': 'provinceEducationnelle',
  'prov educ': 'provinceEducationnelle',
  'sous-division': 'commune',
  'sous division': 'commune',
  'sousdivision': 'commune',
  commune: 'commune',
  ville: 'ville',
  adresse: 'adresse',
  telephone: 'telephone',
  téléphone: 'telephone',
  tel: 'telephone',
  email: 'email',
  'e-mail': 'email',
  chef: 'chefEcole',
  "chef d'ecole": 'chefEcole',
  "chef d'école": 'chefEcole',
  directeur: 'chefEcole',
  effectif: 'effectif',
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function matchHeader(header: string): keyof ParsedSchoolRow | null {
  const h = normalizeHeader(header);
  if (HEADER_ALIASES[h]) return HEADER_ALIASES[h];
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (h.includes(alias) || alias.includes(h)) return field;
  }
  return null;
}

function createEmptyRow(): ParsedSchoolRow {
  return {
    nom: '', type: '', institution: '', dinacope: '', province: '',
    provinceEducationnelle: '', ville: '', commune: '', adresse: '',
    telephone: '', email: '', chefEcole: '', effectif: '',
  };
}

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

/**
 * Parse le texte OCR extrait en lignes d'écoles structurées.
 * Détecte l'en-tête et mappe les colonnes vers les champs ParsedSchoolRow.
 */
function parseOcrText(text: string, delim: string): { rows: ParsedSchoolRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], warnings: ['Aucun texte détecté.'] };
  }

  if (lines.length > MAX_IMPORT_LINES) {
    warnings.push(`Le texte contient ${lines.length} lignes. Seules les ${MAX_IMPORT_LINES} premières seront traitées.`);
  }

  const cappedLines = lines.slice(0, MAX_IMPORT_LINES);
  let regex = (DELIMITERS.find((d) => d.value === delim) ?? DELIMITERS[0]).regex;

  // Détection de l'en-tête : ligne où au moins 2 champs correspondent à des colonnes connues
  const headerLineIdx = cappedLines.findIndex((line) => {
    const fields = parseLine(line, regex);
    return fields.filter((f) => matchHeader(f) !== null).length >= 2;
  });

  // Auto : si le regex par défaut donne ~1 champ par ligne, passer à l'espace simple
  const dataLineCount = headerLineIdx >= 0 ? cappedLines.length - 1 : cappedLines.length;
  if (delim === 'auto' && dataLineCount > 0) {
    const sample = cappedLines.filter((_, i) => i !== headerLineIdx).slice(0, 5);
    const avgFields = sample.reduce((sum, l) => sum + parseLine(l, regex).length, 0) / sample.length;
    if (avgFields <= 1) {
      regex = / /;
    }
  }

  let colMap: (keyof ParsedSchoolRow | null)[] | null = null;
  if (headerLineIdx >= 0) {
    const headerFields = parseLine(cappedLines[headerLineIdx], regex);
    colMap = headerFields.map(matchHeader);
  }

  const dataLines = cappedLines.filter((_, i) => i !== headerLineIdx);
  const rows: ParsedSchoolRow[] = [];

  for (const line of dataLines) {
    const fields = parseLine(line, regex);

    if (colMap) {
      const row = createEmptyRow();
      fields.forEach((val, idx) => {
        const field = colMap[idx];
        if (field) (row[field] as string) = val;
      });
      rows.push(row);
    } else {
      // Sans en-tête : le premier champ est le nom, les autres sont ignorés
      const nom = fields[0]?.trim() || '';
      if (nom) {
        rows.push({ ...createEmptyRow(), nom });
      }
    }
  }

  // Avertissements pour les lignes sans nom
  rows.forEach((row, i) => {
    if (!row.nom.trim()) {
      warnings.push(`Ligne ${i + 1} : nom de l'école manquant.`);
    }
  });

  return { rows, warnings };
}

export function OcrEcolesImportDialog({ onImported, onClose }: OcrEcolesImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [phase, setPhase] = useState<Phase>('upload');
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [delimiter, setDelimiter] = useState('auto');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    setError('');
    if (!f.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPG, PNG).');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo).`);
      return;
    }
    setFile(f);
  }

  async function runOcr() {
    if (!file) return;
    setPhase('processing');
    setProgress(0);
    setError('');

    try {
      const { createWorker } = await import('tesseract.js');
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
      if (!text) {
        setError("Aucun texte détecté dans l'image. Réessayez avec une image plus nette.");
        setPhase('upload');
        return;
      }

      setRawText(text);
      const parsed = parseOcrText(text, delimiter);
      setParseWarnings(parsed.warnings);

      if (parsed.rows.length === 0) {
        setError('Aucune ligne valide détectée. Ajustez le séparateur ou éditez le texte.');
        setPhase('review');
        return;
      }

      // Appeler l'API de preview pour la détection de doublons
      setLoading(true);
      const res = await fetch('/api/import/ecoles/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.rows }),
      });
      const data2 = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data2.error ?? 'Erreur lors de la vérification.');
        setPreviewRows(parsed.rows.map((r, i) => ({ ...r, rowIndex: i, status: 'ok' as const, messages: [] })));
      } else {
        setPreviewRows(data2.rows);
      }
      setPhase('review');
    } catch {
      setError("Échec de la reconnaissance de texte. Réessayez avec une image plus nette.");
      setPhase('upload');
    }
  }

  function reparse(newDelim: string) {
    setDelimiter(newDelim);
    const parsed = parseOcrText(rawText, newDelim);
    setParseWarnings(parsed.warnings);
    if (parsed.rows.length > 0) {
      checkDuplicates(parsed.rows);
    } else {
      setPreviewRows([]);
    }
  }

  async function checkDuplicates(rows: ParsedSchoolRow[]) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/import/ecoles/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewRows(data.rows);
      } else {
        setPreviewRows(rows.map((r, i) => ({ ...r, rowIndex: i, status: 'ok' as const, messages: [] })));
      }
    } catch {
      setPreviewRows(rows.map((r, i) => ({ ...r, rowIndex: i, status: 'ok' as const, messages: [] })));
    } finally {
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
    setRawText('');
    setPreviewRows([]);
    setParseWarnings([]);
    setError('');
    setResult(null);
    setProgress(0);
    setDelimiter('auto');
  }

  function handleClose() {
    if (workerRef.current) workerRef.current.terminate();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" onClick={handleClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Importer des écoles — Photo (OCR)</h2>
            <p className="text-xs text-slate-500">Prenez une photo d'un document, l'OCR extrait les données automatiquement</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
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
                <p className="font-semibold mb-1">📸 Comment ça marche</p>
                <ul className="space-y-0.5 text-xs text-blue-700">
                  <li>• Prenez une photo claire d'une liste d'écoles (registre, document imprimé)</li>
                  <li>• L'OCR (reconnaissance de texte) extrait les données automatiquement</li>
                  <li>• Vérifiez et corrigez les données extraites avant l'enregistrement</li>
                  <li>• La détection de doublons s'effectue automatiquement</li>
                  <li>• Maximum {MAX_IMPORT_LINES} écoles par import, {MAX_FILE_SIZE / 1024 / 1024} Mo par image</li>
                </ul>
              </div>

              {/* Zone de dépôt / aperçu */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0] ?? null);
                }}
                className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
                }`}
              >
                {/* Input caméra (capture forcée) */}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {/* Input galerie (sans capture) */}
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="aperçu"
                      className="max-h-40 rounded-lg object-contain"
                    />
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} Ko</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto mb-2 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">Prenez une photo ou choisissez une image</p>
                    <p className="mt-1 text-xs text-slate-400">JPG, PNG — scan ou photo de document</p>
                  </div>
                )}
              </div>

              {/* Boutons de sélection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Prendre une photo
                </button>
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17l4.5-4.5L12 17l3-3 6 6" />
                  </svg>
                  Galerie
                </button>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>
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
          {phase === 'review' && (
            <div className="space-y-3">
              {/* Texte OCR éditable */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Texte extrait (modifiable — corrigez si nécessaire) :
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    const parsed = parseOcrText(e.target.value, delimiter);
                    setParseWarnings(parsed.warnings);
                    if (parsed.rows.length > 0) {
                      checkDuplicates(parsed.rows);
                    } else {
                      setPreviewRows([]);
                    }
                  }}
                  className="h-28 w-full resize-y rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                  placeholder="Texte OCR…"
                />
              </div>

              {/* Séparateur */}
              <div className="flex flex-wrap items-center gap-2">
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

              {previewRows.length > 0 && (
                <SchoolPreviewStats rows={previewRows} />
              )}
              <SchoolParseWarnings warnings={parseWarnings} />

              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <p className="text-xs text-blue-700">Vérification des doublons…</p>
                </div>
              )}

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
              onClick={handleClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
          )}

          {phase === 'upload' && file && (
            <button
              onClick={runOcr}
              disabled={!file}
              className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
            >
              🔍 Lancer l'OCR
            </button>
          )}

          {phase === 'review' && (
            <>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Nouvelle image
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
