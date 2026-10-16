'use client';

import type { PreviewRow } from '@/lib/txt-import-parser';

type SchoolNamesPreviewProps = {
  rows: PreviewRow[];
  onUpdateName: (rowIdx: number, value: string) => void;
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

export function SchoolNamesPreview({ rows, onUpdateName, onDeleteRow, onAddRow }: SchoolNamesPreviewProps) {
  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-xs text-slate-400">Aucune école détectée. Prenez une photo plus nette.</p>
        </div>
      ) : (
        rows.map((row, ri) => (
          <div key={ri} className={`flex items-center gap-2 rounded-xl border p-2.5 ${rowBorder(row.status)}`}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-500">
              {ri + 1}
            </span>
            <input
              type="text"
              value={row.nom}
              onChange={(e) => onUpdateName(ri, e.target.value)}
              placeholder="Nom de l'école"
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-100"
              style={{ borderColor: row.status === 'error' ? '#fca5a5' : row.status === 'warning' ? '#fcd34d' : undefined }}
            />
            {row.messages.length > 0 && (
              <span className="text-xs text-amber-500" title={row.messages.join(', ')}>⚠</span>
            )}
            <button onClick={() => onDeleteRow(ri)} className="shrink-0 text-slate-300 hover:text-red-500" title="Supprimer">
              <TrashIcon />
            </button>
          </div>
        ))
      )}
      {rows.length > 0 && (
        <button onClick={onAddRow} className="text-xs font-medium text-violet-600 hover:underline" style={{ color: '#5E58A3' }}>
          + Ajouter une école
        </button>
      )}
    </div>
  );
}
