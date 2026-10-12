'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { INSTITUTION_MAP, VALIDATION_STATUT_COLORS } from '@/lib/institutions';

const STATUT_BADGE_CLASSES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

type EcoleRecue = {
  id: string;
  nom: string;
  type: string;
  institution: string;
  province: string;
  commune: string;
  chefEcole: string;
  logoUrl: string | null;
  identifiantSM: string | null;
  statutValidation: string;
  createdAt: string;
  coordSousProvinciale?: { id: string; nom: string } | null;
  _count?: { documents: number };
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/**
 * Affiche un résumé des dossiers reçus des écoles, avec un lien vers la page
 * de validation détaillée. Utilisé sur les pages de coordination provinciale
 * et sous-provinciale.
 */
export function DocumentsRecusSummary({ detailHref }: { detailHref: string }) {
  const [ecoles, setEcoles] = useState<EcoleRecue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ecoles-en-attente');
      const data = await res.json();
      if (res.ok) setEcoles(data.ecoles ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enAttente = ecoles.filter((e) => e.statutValidation === 'En attente de vérification');
  const enCours = ecoles.filter((e) => e.statutValidation === 'En cours de vérification');
  const totalDocs = ecoles.reduce((sum, e) => sum + (e._count?.documents ?? 0), 0);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-3 h-20 animate-pulse rounded-xl bg-slate-50" />
      </div>
    );
  }

  if (ecoles.length === 0) {
    return null; // Ne pas afficher s'il n'y a rien
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Icon name="document" className="h-4 w-4 text-blue-600" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Documents reçus des écoles</h2>
            <p className="text-xs text-slate-500">{ecoles.length} dossier(s) en attente de traitement</p>
          </div>
        </div>
        <a
          href={detailHref}
          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          Traiter
          <Icon name="chevron-right" className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Stats compactes */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-amber-700">{enAttente.length}</p>
          <p className="text-xs text-slate-500">En attente</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-blue-700">{enCours.length}</p>
          <p className="text-xs text-slate-500">En cours</p>
        </div>
        <div className="rounded-xl bg-green-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-green-700">{totalDocs}</p>
          <p className="text-xs text-slate-500">Documents</p>
        </div>
      </div>

      {/* Liste des écoles les plus récentes (max 3) */}
      <div className="mt-3 space-y-1.5">
        {ecoles.slice(0, 3).map((ecole) => {
          const sv = VALIDATION_STATUT_COLORS[ecole.statutValidation];
          const badgeCls = sv ? STATUT_BADGE_CLASSES[sv.color] : 'bg-slate-100 text-slate-700';
          const docCount = ecole._count?.documents ?? 0;
          return (
            <div key={ecole.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                {ecole.logoUrl ? (
                  <img src={ecole.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                    {ecole.nom[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-900">{ecole.nom}</p>
                  <p className="truncate text-xs text-slate-400">
                    {ecole.commune || '—'} · {docCount} doc(s) · {formatDate(ecole.createdAt)}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                {sv?.label || ecole.statutValidation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
