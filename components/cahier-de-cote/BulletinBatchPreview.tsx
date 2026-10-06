'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
};

type BulletinSummary = {
  eleveNom: string;
  eleveMatricule: string;
  moyenneGenerale: number;
  pourcentageGeneral: number;
  mentionGenerale: string;
  nbCours: number;
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

export function BulletinBatchPreview({
  classe,
  periode,
  anneeScolaire,
  ecoleId,
  onClose,
  onDownload,
}: {
  classe: string;
  periode: string;
  anneeScolaire: string;
  ecoleId: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [summaries, setSummaries] = useState<BulletinSummary[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Charger les élèves
        const params = new URLSearchParams({ classe });
        if (ecoleId) params.set('ecoleId', ecoleId);
        const resEleves = await fetch(`/api/eleves?${params}`);
        const dataEleves = await resEleves.json();
        const list: Eleve[] = dataEleves.eleves || [];
        setEleves(list);

        // Charger les cotes pour chaque élève
        const cotesParams = new URLSearchParams({
          classe,
          periode,
          anneeScolaire,
        });
        if (ecoleId) params.set('ecoleId', ecoleId);
        const resCotes = await fetch(`/api/cahier-de-cote?${cotesParams}`);
        const dataCotes = await resCotes.json();
        const allCotes = dataCotes.cahierDeCotes || [];

        // Grouper par élève
        const byEleve = new Map<string, typeof allCotes>();
        allCotes.forEach((c: any) => {
          if (!byEleve.has(c.eleveId)) byEleve.set(c.eleveId, []);
          byEleve.get(c.eleveId)!.push(c);
        });

        const sums: BulletinSummary[] = list.map((e) => {
          const cotes = byEleve.get(e.id) || [];
          if (cotes.length === 0) {
            return {
              eleveNom: `${e.prenom} ${e.nom} ${e.postNom}`.trim(),
              eleveMatricule: e.matricule,
              moyenneGenerale: 0,
              pourcentageGeneral: 0,
              mentionGenerale: 'Non évalué',
              nbCours: 0,
            };
          }
          const moy = Math.round((cotes.reduce((s: number, c: any) => s + c.moyenne, 0) / cotes.length) * 100) / 100;
          const pct = Math.round((moy / 20) * 100 * 100) / 100;
          const mention = getMentionLocal(pct);
          return {
            eleveNom: `${e.prenom} ${e.nom} ${e.postNom}`.trim(),
            eleveMatricule: e.matricule,
            moyenneGenerale: moy,
            pourcentageGeneral: pct,
            mentionGenerale: mention,
            nbCours: cotes.length,
          };
        });
        setSummaries(sums);
      } catch {
        setEleves([]);
        setSummaries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classe, periode, anneeScolaire, ecoleId]);

  async function handleDownload() {
    setDownloading(true);
    await onDownload();
    setDownloading(false);
  }

  const totalEleves = summaries.length;
  const withCotes = summaries.filter((s) => s.nbCours > 0).length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
        <div className="my-8 w-full max-w-2xl">
          <div className="rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Aperçu des bulletins</h3>
                <p className="text-xs text-slate-500">{classe} — {periode} — {anneeScolaire}</p>
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
                <span className="ml-3 text-sm text-slate-500">Chargement de l'aperçu...</span>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="flex gap-3 border-b border-slate-100 px-5 py-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    {totalEleves} élève(s)
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                    {withCotes} avec cotes
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                    {totalEleves - withCotes} sans cotes
                  </span>
                </div>

                {/* Liste des élèves */}
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="px-4 py-2 text-left font-medium">#</th>
                        <th className="px-4 py-2 text-left font-medium">Élève</th>
                        <th className="px-4 py-2 text-center font-medium">Cours</th>
                        <th className="px-4 py-2 text-center font-medium">Moy.</th>
                        <th className="px-4 py-2 text-center font-medium">%</th>
                        <th className="px-4 py-2 text-center font-medium">Mention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaries.map((s, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                          <td className="px-4 py-2">
                            <p className="font-medium text-slate-900">{s.eleveNom}</p>
                            <p className="text-xs text-slate-400">{s.eleveMatricule}</p>
                          </td>
                          <td className="px-4 py-2 text-center text-slate-600">{s.nbCours}</td>
                          <td className="px-4 py-2 text-center font-bold text-slate-900">
                            {s.nbCours > 0 ? s.moyenneGenerale.toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-2 text-center text-slate-600">
                            {s.nbCours > 0 ? `${s.pourcentageGeneral}%` : '—'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={clsx(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              MENTION_COLORS[s.mentionGenerale] || 'bg-slate-100 text-slate-500'
                            )}>
                              {s.mentionGenerale}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                  <button
                    onClick={onClose}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading || totalEleves === 0}
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
