'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type VerifyData = {
  authentique: boolean;
  bulletin: {
    eleveNom: string;
    eleveMatricule: string;
    classe: string;
    ecoleNom: string;
    periode: string;
    anneeScolaire: string;
    moyenneGenerale: number;
    pourcentageGeneral: number;
    mentionGenerale: string;
    generePar: string;
    createdAt: string;
  };
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Token de vérification manquant.');
      setLoading(false);
      return;
    }
    fetch(`/api/cahier-de-cote/bulletin/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!r_ok(d)) {
          setError(d.error || 'Bulletin introuvable.');
        } else {
          setData(d);
        }
      })
      .catch(() => setError('Erreur de connexion.'))
      .finally(() => setLoading(false));
  }, [token]);

  function r_ok(d: any): boolean {
    return d && d.authentique === true && d.bulletin;
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            SM
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Vérification de bulletin</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500">Vérification en cours…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-red-700">Bulletin non authentifié</p>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        ) : data?.authentique ? (
          <div className="space-y-4">
            {/* Badge authentique */}
            <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-bold text-green-700">Bulletin authentique</p>
              <p className="text-xs text-green-600">Ce document a été généré par School Manager RDC</p>
            </div>

            {/* Informations du bulletin */}
            <div className="space-y-3 rounded-2xl border border-slate-200 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Élève</p>
                  <p className="text-sm font-bold text-slate-900">{data.bulletin.eleveNom}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Matricule</p>
                  <p className="text-sm font-mono font-medium text-slate-700">{data.bulletin.eleveMatricule}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Classe</p>
                  <p className="text-sm font-medium text-slate-700">{data.bulletin.classe}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">École</p>
                  <p className="text-sm font-medium text-slate-700">{data.bulletin.ecoleNom || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Période</p>
                  <p className="text-sm font-medium text-slate-700">{data.bulletin.periode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Année scolaire</p>
                  <p className="text-sm font-medium text-slate-700">{data.bulletin.anneeScolaire}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <p className="text-xs text-slate-500">Moyenne</p>
                    <p className="text-lg font-bold text-blue-700">{data.bulletin.moyenneGenerale.toFixed(2)}/20</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Pourcentage</p>
                    <p className="text-lg font-bold text-slate-700">{data.bulletin.pourcentageGeneral}%</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-2">
                    <p className="text-xs text-slate-500">Mention</p>
                    <p className="text-sm font-bold text-green-700">{data.bulletin.mentionGenerale}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
                <p>Généré par : <span className="font-medium text-slate-600">{data.bulletin.generePar}</span></p>
                <p>Date : <span className="font-medium text-slate-600">{new Date(data.bulletin.createdAt).toLocaleDateString('fr-FR')}</span></p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              Token : <span className="font-mono">{token}</span>
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function VerifierBulletinPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-slate-500">Chargement…</p></div>}>
      <VerifyContent />
    </Suspense>
  );
}
