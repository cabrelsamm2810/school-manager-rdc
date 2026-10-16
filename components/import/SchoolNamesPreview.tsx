'use client';

import type { ParsedSchoolRow, PreviewRow, FieldConfidence } from '@/lib/txt-import-parser';

const CONFIDENCE_STYLES: Record<NonNullable<FieldConfidence>, { dot: string; label: string }> = {
  high: { dot: 'bg-green-400', label: 'Fiable' },
  medium: { dot: 'bg-amber-400', label: 'Moyen' },
  low: { dot: 'bg-red-400', label: 'Faible' },
};

function ConfidenceDot({ confidence }: { confidence?: FieldConfidence }) {
  if (!confidence) return null;
  const style = CONFIDENCE_STYLES[confidence];
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
      title={`Confiance: ${style.label}`}
    />
  );
}

type SchoolNamesPreviewProps = {
  rows: PreviewRow[];
  onUpdateField: (rowIdx: number, field: keyof ParsedSchoolRow, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddRow: () => void;
};

function rowBorder(status: string) {
  if (status === 'error') return 'border-red-200 bg-red-50';
  if (status === 'warning') return 'border-amber-200 bg-amber-50';
  return 'border-slate-200 bg-white';
}

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-xs text-slate-400">Aucune école détectée. Prenez une photo plus nette.</p>
        </div>
      ) : (
        rows.map((row, ri) => (
          <div key={ri} className={`rounded-xl border p-2.5 ${rowBorder(row.status)}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-500">
                {ri + 1}
              </span>
              {/* Nom — champ principal */}
              <div className="flex flex-1 items-center gap-1.5">
                <span className="text-sm">{FIELD_ICONS.nom}</span>
                <input
                  type="text"
                  value={row.nom}
                  onChange={(e) => onUpdateField(ri, 'nom', e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS.nom}
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-100"
                  style={{ borderColor: row.status === 'error' ? '#fca5a5' : row.status === 'warning' ? '#fcd34d' : undefined }}
                />
                <ConfidenceDot confidence={row.fieldConfidence?.nom} />
              </div>
              {row.messages.length > 0 && (
                <span className="text-xs text-amber-500" title={row.messages.join(', ')}>⚠</span>
              )}
              <button onClick={() => onDeleteRow(ri)} className="shrink-0 text-slate-300 hover:text-red-500" title="Supprimer">
                <TrashIcon />
              </button>
            </div>

            {/* Champs secondaires — adresse, téléphone, chef d'établissement */}
            <div className="mt-1.5 space-y-1.5 pl-8">
              {EXTRA_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-1.5">
                  <span className="text-xs opacity-60">{FIELD_ICONS[field]}</span>
                  <input
                    type="text"
                    value={row[field]}
                    onChange={(e) => onUpdateField(ri, field, e.target.value)}
                    placeholder={FIELD_PLACEHOLDERS[field]}
                    className="flex-1 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1 text-xs text-slate-600 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-100"
                  />
                  <ConfidenceDot confidence={row.fieldConfidence?.[field]} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      {rows.length > 0 && (
        <>
          {/* Légende des points de confiance */}
          <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" /> Fiable</span>
            <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Moyen</span>
            <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" /> Faible</span>
          </div>
          <button onClick={onAddRow} className="text-xs font-medium hover:underline" style={{ color: '#5E58A3' }}>
            + Ajouter une école
          </button>
        </>
      )}
    </div>
  );
}
