'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

type CoteEntry = {
  id: string;
  cours: string;
  devoir1: number;
  devoir2: number;
  examen: number;
  total: number;
  moyenne: number;
  pourcentage: number;
  mention: string;
};

const MENTION_COLORS: Record<string, string> = {
  'Excellent': 'bg-emerald-100 text-emerald-700',
  'Très Bien': 'bg-blue-100 text-blue-700',
  'Bien': 'bg-sky-100 text-sky-700',
  'Assez Bien': 'bg-amber-100 text-amber-700',
  'Passable': 'bg-orange-100 text-orange-700',
  'Insuffisant': 'bg-red-100 text-red-700',
  'Non évalué': 'bg-slate-100 text-slate-500',
};

export function BulletinSinglePreview({
  eleveId,
  eleveNom,
  classe,
  periode,
  anneeScolaire,
  onClose,
  onDownload,
}: {
  eleveId: string;
  eleveNom: string;
  classe: string;
  periode: string;
  anneeScolaire: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [cotes, setCotes] = useState<CoteEntry[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/cahier-de-cote?eleveId=${eleveId}&periode=${periode}&anneeScolaire=${anneeScolaire}`);
        const data = await res.json();
        setCotes(data.cahierDeCotes || []);
      } catch {
        setCotes([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eleveId, periode, anneeScolaire]);

  const moyenneGenerale = cotes.length > 0
    ? Math.round((cotes.reduce((s, c) => s + c.moyenne, 0) / cotes.length) * 100) / 100
    : 0;
  const pourcentageGeneral = cotes.length > 0
    ? Math.round((moyenneGenerale / 20) * 100 * 100) / 100
    : 0;
  const mentionGenerale = cotes.length > 0 ? getMentionLocal(pourcentageGeneral) : 'Non évalué';

  async function handleDownload() {
    setDownloading(true);
    await onDownload();
    setDownloading(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
        <div className="my-8 w-full max-w-lg">
          <div className="rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Aperçu du bulletin</h3>
                <p className="text-xs text-slate-500">{eleveNom} — {classe} — {periode}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <span className="ml-3 text-sm text-slate-500">Chargement...</span>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    {cotes.length} cours
                  </span>
                  <span className={clsx('rounded-full px-3 py-1 text-xs font-medium', MENTION_COLORS[mentionGenerale])}>
                    {mentionGenerale}
                  </span>
                  {cotes.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Moy. {moyenneGenerale.toFixed(2)}/20 ({pourcentageGeneral}%)
                    </span>
                  )}
                </div>

                {/* Tableau des cotes */}
                {cotes.length > 0 ? (
                  <div className="max-h-[40vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                          <th className="px-4 py-2 text-left font-medium">Cours</th>
                          <th className="px-3 py-2 text-center font-medium">D1</th>
                          <th className="px-3 py-2 text-center font-medium">D2</th>
                          <th className="px-3 py-2 text-center font-medium">Exam</th>
                          <th className="px-3 py-2 text-center font-medium">Moy.</th>
                          <th className="px-3 py-2 text-center font-medium">Mention</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cotes.map((c, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium text-slate-900">{c.cours}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{c.devoir1.toFixed(1)}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{c.devoir2.toFixed(1)}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{c.examen.toFixed(1)}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-900">{c.moyenne.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', MENTION_COLORS[c.mention] || 'bg-slate-100 text-slate-500')}>
                                {c.mention}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-slate-500">Aucune cote enregistrée pour cette période.</p>
                    <p className="mt-1 text-xs text-slate-400">Le bulletin sera généré avec la mention « Non évalué ».</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                  <button
                    onClick={onClose}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13v6h6v-6M9 9l3 3 3-3" />
                        </svg>
                        Télécharger le PDF
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function getMentionLocal(pourcentage: number): string {
  if (pourcentage >= 90) return 'Excellent';
  if (pourcentage >= 80) return 'Très Bien';
  if (pourcentage >= 70) return 'Bien';
  if (pourcentage >= 60) return 'Assez Bien';
  if (pourcentage >= 50) return 'Passable';
  return 'Insuffisant';
}
