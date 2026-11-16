'use client';

import {
  TXT_COLUMNS,
  type ParsedSchoolRow,
  type PreviewRow,
} from '@/lib/txt-import-parser';

type SchoolPreviewTableProps = {
  rows: PreviewRow[];
  onUpdateCell: (rowIdx: number, key: keyof ParsedSchoolRow, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
  onAddRow: () => void;
};

/** Badge color for a row status. */
function rowBorder(status: string) {
  if (status === 'error') return 'border-red-200 bg-red-50';
  if (status === 'warning') return 'border-amber-200 bg-amber-50';
  return 'border-slate-200 bg-white';
}

function msgColor(status: string) {
  if (status === 'error') return 'text-red-600';
  if (status === 'warning') return 'text-amber-600';
  return 'text-slate-500';
}

function msgColorSmall(status: string) {
  if (status === 'error') return 'text-red-500';
  if (status === 'warning') return 'text-amber-600';
  return 'text-slate-400';
}

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
  </svg>
);

export function SchoolPreviewTable({ rows, onUpdateCell, onDeleteRow, onAddRow }: SchoolPreviewTableProps) {
  return (
    <div className="space-y-3">
      {/* Editable table — mobile cards */}
      <div className="space-y-2 lg:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-xs text-slate-400">Aucune ligne détectée. Ajustez le séparateur ou éditez le texte.</p>
          </div>
        ) : (
          rows.map((row, ri) => (
            <div key={ri} className={`rounded-xl border p-3 ${rowBorder(row.status)}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">#{ri + 1}</span>
                <button onClick={() => onDeleteRow(ri)} className="text-slate-300 hover:text-red-500" title="Supprimer">
                  <TrashIcon />
                </button>
              </div>
              {row.messages.length > 0 && (
                <div className="mb-2 space-y-0.5">
                  {row.messages.map((msg, mi) => (
                    <p key={mi} className={`text-xs ${msgColor(row.status)}`}>⚠ {msg}</p>
                  ))}
                </div>
              )}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={row.nom}
                  onChange={(e) => onUpdateCell(ri, 'nom', e.target.value)}
                  placeholder="Nom de l'école *"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={row.institution}
                    onChange={(e) => onUpdateCell(ri, 'institution', e.target.value)}
                    placeholder="Convention"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.provinceEducationnelle}
                    onChange={(e) => onUpdateCell(ri, 'provinceEducationnelle', e.target.value)}
                    placeholder="Province éduc."
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.commune}
                    onChange={(e) => onUpdateCell(ri, 'commune', e.target.value)}
                    placeholder="Sous-division"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.adresse}
                    onChange={(e) => onUpdateCell(ri, 'adresse', e.target.value)}
                    placeholder="Adresse"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.telephone}
                    onChange={(e) => onUpdateCell(ri, 'telephone', e.target.value)}
                    placeholder="Téléphone"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.type}
                    onChange={(e) => onUpdateCell(ri, 'type', e.target.value)}
                    placeholder="Type"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editable table — desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Aucune ligne détectée. Ajustez le séparateur ou éditez le texte.
          </div>
        ) : (
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
              {rows.map((row, ri) => (
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
                        onChange={(e) => onUpdateCell(ri, col.key, e.target.value)}
                        className={`w-full min-w-[70px] rounded border border-transparent px-1.5 py-1 text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 ${
                          col.key === 'nom' ? 'font-medium' : ''
                        }`}
                      />
                      {col.key === 'nom' && row.messages.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {row.messages.map((msg, mi) => (
                            <p key={mi} className={`text-[10px] ${msgColorSmall(row.status)}`}>⚠ {msg}</p>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1 align-top">
                    <button onClick={() => onDeleteRow(ri)} className="text-slate-300 hover:text-red-500" title="Supprimer la ligne">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > 0 && (
        <button onClick={onAddRow} className="text-xs font-medium text-blue-600 hover:underline">
          + Ajouter une ligne
        </button>
      )}
    </div>
  );
}
