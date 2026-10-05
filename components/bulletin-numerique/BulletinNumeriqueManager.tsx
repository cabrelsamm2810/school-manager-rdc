'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { PERIODES, getCurrentAnneeScolaire } from '@/lib/cahier-de-cote';
import { BulletinPreview } from '@/components/cahier-de-cote/BulletinPreview';

type Bulletin = {
  id: string;
  eleveId: string;
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
  qrToken: string;
  generePar: string;
  createdAt: string;
};

const ANNEE_SCOLAIRE = getCurrentAnneeScolaire();

const MENTION_COLORS: Record<string, string> = {
  'Excellent': 'bg-emerald-100 text-emerald-700',
  'Très Bien': 'bg-blue-100 text-blue-700',
  'Bien': 'bg-sky-100 text-sky-700',
  'Assez Bien': 'bg-amber-100 text-amber-700',
  'Passable': 'bg-orange-100 text-orange-700',
  'Insuffisant': 'bg-red-100 text-red-700',
  'Non évalué': 'bg-slate-100 text-slate-500',
};

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export function BulletinNumeriqueManager() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewBulletin, setPreviewBulletin] = useState<Bulletin | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBulletins();
  }, []);

  async function fetchBulletins() {
    setLoading(true);
    try {
      const res = await fetch('/api/cahier-de-cote/bulletin');
      const data = await res.json();
      setBulletins(data.bulletins || []);
    } catch {
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  }

  const classes = [...new Set(bulletins.map((b) => b.classe).filter(Boolean))].sort();

  const filtered = bulletins.filter((b) => {
    if (search && !b.eleveNom.toLowerCase().includes(search.toLowerCase()) && !b.eleveMatricule.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPeriode && b.periode !== filterPeriode) return false;
    if (filterClasse && b.classe !== filterClasse) return false;
    return true;
  });

  async function handleDownloadPdf(bulletin: Bulletin) {
    setDownloadingId(bulletin.id);
    try {
      const res = await fetch(`/api/cahier-de-cote/bulletin/pdf?bulletinId=${bulletin.id}`);
      if (!res.ok) throw new Error('Erreur');
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
      setDownloadingId(null);
    }
  }

  function handlePreview(bulletin: Bulletin) {
    setPreviewBulletin(bulletin);
    setShowPreview(true);
  }

  function handlePrint(bulletin: Bulletin) {
    setPreviewBulletin(bulletin);
    setShowPreview(true);
    setTimeout(() => window.print(), 300);
  }

  function getVerifyUrl(bulletin: Bulletin) {
    const base = window.location.origin;
    return `${base}/verifier-bulletin?token=${bulletin.qrToken}`;
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Rechercher</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou matricule…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Période</label>
            <select value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)} className={inputClass}>
              <option value="">Toutes</option>
              {PERIODES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Classe</label>
            <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} className={inputClass}>
              <option value="">Toutes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-500">Bulletins générés</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{bulletins.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-500">Affichés</p>
          <p className="mt-1 text-xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-500">Moyenne générale</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {filtered.length > 0 ? (filtered.reduce((s, b) => s + b.moyenneGenerale, 0) / filtered.length).toFixed(2) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-500">Classes</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{classes.length}</p>
        </div>
      </div>

      {/* Liste des bulletins */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <span className="ml-3 text-sm text-slate-500">Chargement…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Aucun bulletin généré. Les bulletins sont créés depuis le Cahier de cote.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Info élève */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {b.eleveNom.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{b.eleveNom}</p>
                    <p className="text-xs text-slate-500">
                      {b.eleveMatricule} · {b.classe} · {b.periode} · {b.anneeScolaire}
                    </p>
                  </div>
                </div>

                {/* Résultat */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Moyenne</p>
                    <p className="text-sm font-bold text-slate-900">{b.moyenneGenerale.toFixed(2)}/20</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">%</p>
                    <p className="text-sm font-bold text-slate-900">{b.pourcentageGeneral}%</p>
                  </div>
                  <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium', MENTION_COLORS[b.mentionGenerale] || 'bg-slate-100 text-slate-500')}>
                    {b.mentionGenerale}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => handlePreview(b)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Aperçu
                </button>
                <button
                  onClick={() => handleDownloadPdf(b)}
                  disabled={downloadingId === b.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50"
                >
                  {downloadingId === b.id ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13v6h6v-6M9 9l3 3 3-3" />
                    </svg>
                  )}
                  PDF
                </button>
                <button
                  onClick={() => handlePrint(b)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>
                <a
                  href={getVerifyUrl(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3z" />
                  </svg>
                  Vérifier
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal aperçu */}
      {showPreview && previewBulletin && (
        <BulletinPreview
          eleveId={previewBulletin.eleveId}
          periode={previewBulletin.periode}
          anneeScolaire={previewBulletin.anneeScolaire}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
