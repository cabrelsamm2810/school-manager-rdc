'use client';

import type { ParsedSchoolRow, PreviewRow, FieldConfidence } from '@/lib/txt-import-parser';

const CONFIDENCE_STYLES: Record<NonNullable<FieldConfidence>, { dot: string; label: string; text: string }> = {
  high: { dot: 'bg-green-500', label: 'Fiable', text: 'text-green-600' },
  medium: { dot: 'bg-amber-500', label: 'Moyen', text: 'text-amber-600' },
  low: { dot: 'bg-red-500', label: 'Faible', text: 'text-red-600' },
};

function ConfidenceBadge({ confidence }: { confidence?: FieldConfidence }) {
  if (!confidence) return null;
  const style = CONFIDENCE_STYLES[confidence];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium ${style.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

type SchoolNamesPreviewProps = {
  rows: PreviewRow[];
  onUpdateField: (rowIdx: number, field: keyof ParsedSchoolRow, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddRow: () => void;
};

function cardStyle(status: string) {
  if (status === 'error') return 'border-red-200 bg-red-50/60 shadow-red-100/50';
  if (status === 'warning') return 'border-amber-200 bg-amber-50/60 shadow-amber-100/50';
  return 'border-slate-200 bg-white shadow-slate-100/50';
}

const TrashIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
  </svg>
);

const FIELD_ICONS: Record<string, string> = {
  nom: '🏫',
  adresse: '📍',
  telephone: '📞',
  chefEcole: '👤',
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  nom: "Nom de l'école",
  adresse: 'Adresse',
  telephone: 'Téléphone',
  chefEcole: "Chef d'établissement",
};

const EXTRA_FIELDS: (keyof ParsedSchoolRow)[] = ['adresse', 'telephone', 'chefEcole'];

export function SchoolNamesPreview({ rows, onUpdateField, onDeleteRow, onAddRow }: SchoolNamesPreviewProps) {
  const okCount = rows.filter((r) => r.status === 'ok').length;
  const warningCount = rows.filter((r) => r.status === 'warning').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-sm text-slate-400">Aucune école détectée. Prenez une photo plus nette.</p>
        </div>
      ) : (
        <>
          {/* En-tête résumé */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">{rows.length}</span>
              <span className="text-xs text-slate-500">école(s) détectée(s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {okCount > 0 && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  {okCount} OK
                </span>
              )}
              {warningCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {warningCount} doublon{warningCount > 1 ? 's' : ''}
                </span>
              )}
              {errorCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  {errorCount} erreur{errorCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Cartes des écoles */}
          <div className="space-y-2.5">
            {rows.map((row, ri) => (
              <div
                key={ri}
                className={`rounded-2xl border p-3 shadow-sm transition ${cardStyle(row.status)}`}
              >
                {/* Ligne principale : numéro + nom + actions */}
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold" style={{ color: '#5E58A3' }}>
                    {ri + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🏫</span>
                      <input
                        type="text"
                        value={row.nom}
                        onChange={(e) => onUpdateField(ri, 'nom', e.target.value)}
                        placeholder={FIELD_PLACEHOLDERS.nom}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                        style={{ borderColor: row.status === 'error' ? '#fca5a5' : row.status === 'warning' ? '#fcd34d' : undefined }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pl-7">
                      <ConfidenceBadge confidence={row.fieldConfidence?.nom} />
                      {row.messages.length > 0 && (
                        <span className="text-[10px] text-amber-600" title={row.messages.join(', ')}>
                          ⚠ {row.messages[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteRow(ri)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Supprimer"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Champs secondaires */}
                <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pl-9 pt-2">
                  {EXTRA_FIELDS.map((field) => (
                    <div key={field} className="flex items-center gap-1.5">
                      <span className="text-xs opacity-50">{FIELD_ICONS[field]}</span>
                      <input
                        type="text"
                        value={row[field]}
                        onChange={(e) => onUpdateField(ri, field, e.target.value)}
                        placeholder={FIELD_PLACEHOLDERS[field]}
                        className="flex-1 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-600 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-100"
                      />
                      <ConfidenceBadge confidence={row.fieldConfidence?.[field]} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Légende + ajout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Fiable</span>
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" /> Moyen</span>
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" /> Faible</span>
            </div>
          </div>
          <button
            onClick={onAddRow}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
          >
            + Ajouter une école
          </button>
        </>
      )}
    </div>
  );
}
