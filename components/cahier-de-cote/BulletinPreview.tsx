'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { getMention } from '@/lib/cahier-de-cote';

type Bulletin = {
  id: string;
  eleveNom: string;
  eleveMatricule: string;
  classe: string;
  etablissementNom: string;
  periode: string;
  anneeScolaire: string;
  donnees: string;
  moyenneGenerale: number;
  pourcentageGeneral: number;
  mentionGenerale: string;
  qrDataUrl: string;
  qrToken: string;
  generePar: string;
  createdAt: string;
};

type BulletinData = {
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
  'Excellent': 'text-emerald-600',
  'Très Bien': 'text-blue-600',
  'Bien': 'text-sky-600',
  'Assez Bien': 'text-amber-600',
  'Passable': 'text-orange-600',
  'Insuffisant': 'text-red-600',
};

export function BulletinPreview({
  eleveId,
  periode,
  anneeScolaire,
  onClose,
}: {
  eleveId: string;
  periode: string;
  anneeScolaire: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function generate() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/cahier-de-cote/bulletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eleveId, periode, anneeScolaire }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération.');
        setBulletin(data.bulletin);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [eleveId, periode, anneeScolaire]);

  const donnees: BulletinData[] = bulletin ? JSON.parse(bulletin.donnees) : [];

  const [downloading, setDownloading] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    if (!bulletin) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/cahier-de-cote/bulletin/pdf?bulletinId=${bulletin.id}`);
      if (!res.ok) throw new Error('Erreur lors de la génération du PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${bulletin.eleveNom.replace(/\s+/g, '_')}_${bulletin.periode.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 print:static print:p-0 print:overflow-visible">
        <div className="my-8 w-full max-w-3xl print:my-0 print:max-w-none">
          <div className="rounded-2xl bg-white shadow-2xl print:shadow-none">
            {/* Header avec bouton fermer */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 print:hidden">
              <h3 className="text-sm font-semibold text-slate-900">Bulletin numérique</h3>
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
                <span className="ml-3 text-sm text-slate-500">Génération du bulletin...</span>
              </div>
            ) : error ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Veuillez d'abord enregistrer les cotes avant de générer le bulletin.
                </p>
              </div>
            ) : bulletin ? (
              <div className="bulletin-print p-5 md:p-8">
                {/* En-tête du bulletin */}
                <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="School Manager RDC" className="h-14 w-14 object-contain" />
                    <div>
                      <h1 className="text-lg font-bold text-slate-900">School Manager RDC</h1>
                      <p className="text-xs text-slate-500">{bulletin.etablissementNom || 'Établissement'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-500">Bulletin de notes</p>
                    <p className="text-sm font-bold text-slate-900">{bulletin.periode}</p>
                    <p className="text-xs text-slate-500">{bulletin.anneeScolaire}</p>
                  </div>
                </div>

                {/* Informations élève */}
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">Nom de l'élève</p>
                    <p className="text-sm font-bold text-slate-900">{bulletin.eleveNom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Matricule</p>
                    <p className="text-sm font-mono font-medium text-slate-700">{bulletin.eleveMatricule}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Classe</p>
                    <p className="text-sm font-medium text-slate-700">{bulletin.classe}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Établissement</p>
                    <p className="text-sm font-medium text-slate-700">{bulletin.etablissementNom || '—'}</p>
                  </div>
                </div>

                {/* Tableau des cotes */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100 text-xs text-slate-600">
                        <th className="px-2 py-2 text-left font-medium">Cours</th>
                        <th className="px-2 py-2 text-center font-medium">D1</th>
                        <th className="px-2 py-2 text-center font-medium">D2</th>
                        <th className="px-2 py-2 text-center font-medium">Exam</th>
                        <th className="px-2 py-2 text-center font-medium">Total</th>
                        <th className="px-2 py-2 text-center font-medium">Moy.</th>
                        <th className="px-2 py-2 text-center font-medium">%</th>
                        <th className="px-2 py-2 text-center font-medium">Mention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donnees.map((d, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="px-2 py-2 font-medium text-slate-900">{d.cours}</td>
                          <td className="px-2 py-2 text-center text-slate-600">{d.devoir1.toFixed(1)}</td>
                          <td className="px-2 py-2 text-center text-slate-600">{d.devoir2.toFixed(1)}</td>
                          <td className="px-2 py-2 text-center text-slate-600">{d.examen.toFixed(1)}</td>
                          <td className="px-2 py-2 text-center font-medium text-slate-700">{d.total.toFixed(2)}</td>
                          <td className="px-2 py-2 text-center font-bold text-slate-900">{d.moyenne.toFixed(2)}</td>
                          <td className="px-2 py-2 text-center text-slate-600">{d.pourcentage}%</td>
                          <td className={clsx('px-2 py-2 text-center text-xs font-medium', MENTION_COLORS[d.mention] || 'text-slate-600')}>
                            {d.mention}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-blue-50">
                        <td colSpan={5} className="px-2 py-3 text-right font-bold text-slate-900">Moyenne générale</td>
                        <td className="px-2 py-3 text-center text-lg font-bold text-blue-700">{bulletin.moyenneGenerale.toFixed(2)}</td>
                        <td className="px-2 py-3 text-center font-bold text-slate-900">{bulletin.pourcentageGeneral}%</td>
                        <td className={clsx('px-2 py-3 text-center text-xs font-bold', MENTION_COLORS[bulletin.mentionGenerale] || 'text-slate-600')}>
                          {bulletin.mentionGenerale}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* QR Code et authentification */}
                <div className="mt-6 flex flex-col items-center gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    {bulletin.qrDataUrl && (
                      <img src={bulletin.qrDataUrl} alt="QR Code de vérification" className="h-24 w-24 rounded-lg border border-slate-200" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Vérification d'authenticité</p>
                      <p className="mt-1 text-xs text-slate-500">Scannez le QR code pour vérifier l'authenticité de ce bulletin sur School Manager RDC.</p>
                      <p className="mt-1 text-xs font-mono text-slate-400">Token: {bulletin.qrToken}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Généré par</p>
                    <p className="text-sm font-medium text-slate-700">{bulletin.generePar}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(bulletin.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                {/* Pied de page */}
                <div className="mt-4 border-t border-slate-200 pt-3 text-center">
                  <p className="text-xs text-slate-400">
                    Document généré par School Manager RDC — Plateforme nationale de gestion scolaire
                  </p>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            {bulletin && (
              <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-3 print:hidden sm:flex-row sm:justify-end">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>
                <button
                  onClick={handleDownloadPdf}
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
                      Télécharger PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
