'use client';

import type { PreviewRow } from '@/lib/txt-import-parser';

export type BatchResult = {
  imported: number;
  ignored: number;
  rejected: number;
  total: number;
  details: { row: number; nom: string; action: 'imported' | 'ignored' | 'rejected'; message: string }[];
};

type SchoolPreviewStatsProps = {
  rows: PreviewRow[];
  extraBadges?: React.ReactNode;
};

export function SchoolPreviewStats({ rows, extraBadges }: SchoolPreviewStatsProps) {
  const okCount = rows.filter((r) => r.status === 'ok').length;
  const warningCount = rows.filter((r) => r.status === 'warning').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        {rows.length} école(s)
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
      {extraBadges}
    </div>
  );
}

type SchoolParseWarningsProps = {
  warnings: string[];
};

export function SchoolParseWarnings({ warnings }: SchoolParseWarningsProps) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-xl bg-amber-50 px-3 py-2">
      <p className="text-xs font-semibold text-amber-800 mb-1">Avertissements :</p>
      <ul className="space-y-0.5 text-xs text-amber-700">
        {warnings.slice(0, 5).map((w, i) => <li key={i}>• {w}</li>)}
      </ul>
    </div>
  );
}

type SchoolImportResultProps = {
  result: BatchResult;
};

export function SchoolImportResult({ result }: SchoolImportResultProps) {
  return (
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
  );
}
