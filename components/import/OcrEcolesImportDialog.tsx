'use client';

import { useRef, useState } from 'react';
import type { Worker } from 'tesseract.js';
import {
  type ParsedSchoolRow,
  type PreviewRow,
  MAX_IMPORT_LINES,
} from '@/lib/txt-import-parser';
import { SchoolNamesPreview } from '@/components/import/SchoolNamesPreview';
import { SchoolParseWarnings, SchoolImportResult, type BatchResult } from '@/components/import/SchoolPreviewShared';
import { OcrWorkflowStepper } from '@/components/import/OcrWorkflowStepper';

type OcrEcolesImportDialogProps = {
  onImported: () => void;
  onClose: () => void;
};

type Phase = 'upload' | 'processing' | 'review-table' | 'result';

const PHASE_STEP: Record<Phase, number> = {
  upload: 0,
  processing: 1,
  'review-table': 2,
  result: 3,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const OCR_MAX_WIDTH = 3000; // Préserver la netteté — ne réduire que les très grandes images

/** Mots-clés typiques dans les noms d'écoles (insensible aux accents/casse). */
const SCHOOL_KEYWORDS = [
  'ecole', 'institut', 'complex', 'college', 'lycee', 'centre', 'groupe',
  'etablissement', 'academie', 'universite', 'faculte', 'section', 'annexe',
  'programme', 'project', 'scolaire', 'polytechnique', 'technique',
  'professionnel', 'maternelle', 'primaire', 'secondaire', 'fondamental',
];

/** Mots-clés d'en-têtes administratifs à exclure (insensible aux accents/casse). */
const HEADER_KEYWORDS = [
  'republique', 'ministere', 'gouvernement', 'secretariat', 'direction',
  'inspection', 'coordination', 'sous-province', 'province de',
  'division provinciale', 'liste des ecoles', 'liste des etablissements',
  'annuaire', 'catalogue', 'table des matieres', 'sommaire',
  'democratique du congo', 'kinshasa, le', 'fait a', 'arrete a',
];

/** Patterns de bruit à exclure (numéros de page, dates seules, lignes de séparation, etc.). */
const NOISE_PATTERNS = [
  /^page\s+\d+/i,
  /^page\s+\d+\s*\/\s*\d+$/i,
  /^\d+\s*\/\s*\d+$/,
  /^\d{1,3}$/,
  /^[#*•\-_=~]{2,}$/,
  /^(date|signature|cachet|nom|prenom|post[- ]?nom)\s*[:.]?$/i,
  /^(n[°o]?\s*)?[:.]?\s*\d{4,}$/i,
  /^\[?\d{1,2}\s*[\).\-]\s*$/,
  /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s*[:.]?$/i,
  /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/,
];

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Vérifie si une ligne est du bruit OCR (pas une donnée d'école). */
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return true;
  if (NOISE_PATTERNS.some((p) => p.test(trimmed))) return true;
  // Ligne composée uniquement de chiffres et ponctuation
  if (/^[\d\s\-.,;:|/()]+$/.test(trimmed)) return true;
  // En-têtes administratifs (République, Ministère, etc.)
  const norm = normalizeText(trimmed);
  if (HEADER_KEYWORDS.some((kw) => norm.includes(kw))) return true;
  // Ligne en MAJUSCULES de plus de 40 caractères = probablement un en-tête/bandeau
  if (trimmed.length > 40 && trimmed === trimmed.toUpperCase() && !/[a-zà-ÿ]/.test(trimmed)) return true;
  return false;
}

/** Nettoie une ligne en supprimant la numérotation de début (ex: "1. École…" → "École…"). */
function cleanLinePrefix(line: string): string {
  return line.replace(/^\[?\s*\d{1,3}\s*[\).\-:]\s*/, '').trim();
}

/** Vérifie si un texte ressemble à un nom d'école. */
function looksLikeSchoolName(text: string): boolean {
  const norm = normalizeText(text);
  if (norm.length < 3) return false;
  if (!/[a-zà-ÿ]/i.test(text)) return false;
  // Doit contenir au moins un mot de 3+ lettres
  if (!/[a-zà-ÿ]{3,}/i.test(text)) return false;
  // Doit contenir un mot-clé d'école OU avoir une structure plausible (initiale + mots)
  if (SCHOOL_KEYWORDS.some((kw) => norm.includes(kw))) return true;
  // Repli strict : au moins 2 mots alphabétiques de 3+ lettres (ex: "Bon Berger", "Saint Joseph")
  const words = norm.split(/\s+/).filter((w) => w.length >= 3 && /[a-zà-ÿ]{3,}/i.test(w));
  return words.length >= 2;
}

/**
 * Extraction rapide des noms d'écoles depuis le texte OCR.
 * Filtre le bruit et ne garde que les lignes qui ressemblent à des noms d'écoles.
 */
function extractSchoolNames(text: string): { rows: ParsedSchoolRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const allLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (allLines.length === 0) {
    return { rows: [], warnings: ['Aucun texte détecté.'] };
  }

  const lines = allLines.filter((l) => !isNoiseLine(l));

  if (lines.length === 0) {
    return { rows: [], warnings: ['Aucune ligne valide détectée après filtrage du bruit OCR.'] };
  }

  if (lines.length > MAX_IMPORT_LINES) {
    warnings.push(`Le texte contient ${lines.length} lignes. Seules les ${MAX_IMPORT_LINES} premières seront traitées.`);
  }

  const cappedLines = lines.slice(0, MAX_IMPORT_LINES);
  const rows: ParsedSchoolRow[] = [];
  const seen = new Set<string>();

  for (const line of cappedLines) {
    // Nettoyer la numérotation de début (ex: "1. École…" → "École…")
    const nom = cleanLinePrefix(line);
    if (!nom || !looksLikeSchoolName(nom)) continue;
    // Déduplication basique (même nom normalisé)
    const key = normalizeText(nom);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      nom, type: '', institution: '', dinacope: '', province: '',
      provinceEducationnelle: '', ville: '', commune: '', adresse: '',
      telephone: '', email: '', chefEcole: '', effectif: '',
    });
  }

  return { rows, warnings };
}

/**
 * Prétraite une image pour l'OCR : ne réduit que les très grandes images (max 3000px).
 * Retourne un Blob PNG sans perte pour préserver la netteté du texte.
 */
async function preprocessImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, OCR_MAX_WIDTH / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/png',
    );
  });
}

export function OcrEcolesImportDialog({ onImported, onClose }: OcrEcolesImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [phase, setPhase] = useState<Phase>('upload');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError('');
    const valid: File[] = [];
    for (const f of Array.from(fileList)) {
      if (!f.type.startsWith('image/')) {
        setError(`${f.name} : type non supporté (JPG, PNG uniquement).`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`${f.name} : trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo).`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
    }
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runOcr() {
    if (files.length === 0) return;
    setPhase('processing');
    setProgress(0);
    setProgressLabel('');
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

      const allText: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgressLabel(`Image ${i + 1} / ${files.length}`);
        setProgress(0);
        // Prétraiter l'image pour accélérer l'OCR
        const processed = await preprocessImage(files[i]);
        const { data } = await worker.recognize(processed);
        const text = data.text.trim();
        if (text) allText.push(text);
      }

      await worker.terminate();
      workerRef.current = null;

      const combinedText = allText.join('\n\n');
      if (!combinedText) {
        setError("Aucun texte détecté dans les images. Réessayez avec des images plus nettes.");
        setPhase('upload');
        return;
      }

      // Extraction rapide des noms d'écoles uniquement
      const parsed = extractSchoolNames(combinedText);
      setParseWarnings(parsed.warnings);

      if (parsed.rows.length === 0) {
        setError("Aucun nom d'école détecté. Réessayez avec une photo plus nette du document.");
        setPhase('upload');
        return;
      }

      await checkDuplicates(parsed.rows);
      setPhase('review-table');
    } catch {
      setError("Échec de la reconnaissance de texte. Réessayez avec des images plus nettes.");
      setPhase('upload');
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

  function updateName(rowIdx: number, value: string) {
    setPreviewRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, nom: value } : r)),
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
    setFiles([]);
    setPreviewRows([]);
    setParseWarnings([]);
    setError('');
    setResult(null);
    setProgress(0);
    setProgressLabel('');
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
          <h2 className="text-lg font-bold text-slate-900">Importer les écoles depuis une photo</h2>
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
            <div className="space-y-5">
              {/* Input caméra (capture forcée) */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {/* Input galerie (sans capture, plusieurs images) */}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {files.length > 0 ? (
                <>
                  {/* Aperçu des images sélectionnées */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    className={`flex flex-wrap justify-center gap-3 rounded-2xl border-2 border-dashed p-4 transition ${
                      dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-200'
                    }`}
                  >
                    {files.map((f, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="h-24 w-24 rounded-lg object-cover"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                        >
                          ✕
                        </button>
                        <p className="mt-1 max-w-[6rem] truncate text-[10px] text-slate-500">{f.name}</p>
                      </div>
                    ))}
                  </div>

                  {/* Boutons compacts quand images déjà sélectionnées */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition hover:opacity-80"
                      style={{ borderColor: '#5E58A3', backgroundColor: '#E0E7FF', color: '#5E58A3' }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Prendre une photo
                    </button>
                    <button
                      onClick={() => galleryRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition hover:opacity-80"
                      style={{ borderColor: '#5E58A3', backgroundColor: '#E0E7FF', color: '#5E58A3' }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4.5-4.5L12 17l3-3 6 6" />
                      </svg>
                      Ajouter des photos
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Illustration centrale */}
                  <div className="flex flex-col items-center pt-4">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#E0E7FF' }}
                    >
                      <svg className="h-10 w-10" fill="none" stroke="#5E58A3" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">Photographier une liste d'écoles</h3>
                    <p className="mt-1 max-w-xs text-center text-sm text-slate-500">
                      Prenez une photo d'un document contenant les noms d'écoles. L'IA détectera automatiquement les noms.
                    </p>
                  </div>

                  {/* Boutons d'action en pointillés verticaux */}
                  <div className="space-y-3">
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-sm font-semibold transition hover:opacity-80"
                      style={{ borderColor: '#5E58A3', backgroundColor: '#E0E7FF', color: '#5E58A3' }}
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.9l.814-1.62a2 2 0 011.664-.9h5.856a2 2 0 011.664.9l.814 1.62A2 2 0 0019.07 7H20a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Prendre une photo
                    </button>
                    <button
                      onClick={() => galleryRef.current?.click()}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-sm font-semibold transition hover:opacity-80"
                      style={{ borderColor: '#5E58A3', backgroundColor: '#E0E7FF', color: '#5E58A3' }}
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4.5-4.5L12 17l3-3 6 6" />
                      </svg>
                      Importer plusieurs photos
                    </button>
                  </div>

                  <p className="text-center text-xs text-slate-400">
                    JPG, PNG — une ou plusieurs images · max {MAX_FILE_SIZE / 1024 / 1024} Mo · {MAX_IMPORT_LINES} écoles max
                  </p>
                  <p className="text-center text-xs font-medium" style={{ color: '#5E58A3' }}>
                    💡 Astuce : maintenez la touche pour sélectionner plusieurs photos à la fois
                  </p>
                </>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>
          )}

          {/* Phase: Processing */}
          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200" style={{ borderTopColor: '#5E58A3' }} />
              <p className="text-sm font-medium text-slate-700">Analyse de l'image en cours…</p>
              {progressLabel && (
                <p className="mt-1 text-xs text-slate-500">{progressLabel}</p>
              )}
              <div className="mt-4 w-full max-w-xs">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: '#5E58A3' }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-slate-500">{progress}%</p>
              </div>
            </div>
          )}

          {/* Phase: Review-table — vérification des noms d'écoles */}
          {phase === 'review-table' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: '#E0E7FF', color: '#5E58A3' }}>
                <span className="font-medium">✓ {previewRows.length} école(s) détectée(s) — vérifiez et corrigez les noms</span>
              </div>

              <SchoolParseWarnings warnings={parseWarnings} />

              {loading && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <p className="text-xs text-blue-700">Vérification des doublons…</p>
                </div>
              )}

              <SchoolNamesPreview
                rows={previewRows}
                onUpdateName={updateName}
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

        {/* Stepper */}
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <OcrWorkflowStepper currentStep={PHASE_STEP[phase]} />
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

          {phase === 'upload' && files.length > 0 && (
            <button
              onClick={runOcr}
              disabled={files.length === 0}
              className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
            >
              🔍 Analyser ({files.length} image{files.length > 1 ? 's' : ''})
            </button>
          )}

          {phase === 'review-table' && (
            <>
              <button
                onClick={reset}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Nouvelle photo
              </button>
              <button
                onClick={handleSave}
                disabled={previewRows.length === 0 || loading}
                className={`btn-primary flex-1 px-4 py-2.5 text-sm ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (
                  <><span className="btn-spinner" /> Enregistrement…</>
                ) : (
                  `✓ Enregistrer ${previewRows.length} école(s)`
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
