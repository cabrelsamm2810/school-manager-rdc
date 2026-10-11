'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { QRScannerModal, type ScanResult } from '@/components/enseignant/QRScannerModal';

type EleveInfo = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  sexe: string;
  dateNaissance: string | null;
  lieuNaissance: string;
  ecole: string | null;
};

export default function ScannerElevePage() {
  const [showScanner, setShowScanner] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [eleveInfo, setEleveInfo] = useState<EleveInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleScan = useCallback(async (scannedValue: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/enseignant/scan-eleve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannedValue }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLastResult({
          eleve: data.eleve || { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' },
          status: 'alreadyPresent',
          error: data.error || 'Erreur lors du scan',
        });
        setEleveInfo(null);
        return;
      }

      setEleveInfo(data.eleve);
      setLastResult({
        eleve: {
          id: data.eleve.id,
          matricule: data.eleve.matricule,
          nom: data.eleve.nom,
          postNom: data.eleve.postNom,
          prenom: data.eleve.prenom,
          classe: data.eleve.classe,
          ecole: data.eleve.ecole,
        },
        status: 'created',
      });
    } catch {
      setLastResult({
        eleve: { id: '', matricule: '', nom: '', postNom: '', prenom: '', classe: '' },
        status: 'alreadyPresent',
        error: 'Erreur réseau',
      });
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          {/* En-tête */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 text-blue-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Scanner un élève</h1>
              <p className="text-sm text-slate-500">Scannez le QR code de la carte scolaire pour identifier un élève</p>
            </div>
          </div>

          {/* Bouton scanner */}
          {!showScanner && !eleveInfo && (
            <button
              onClick={() => {
                setLastResult(null);
                setShowScanner(true);
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
              </svg>
              Scanner le QR code
            </button>
          )}

          {/* Fiche élève identifié */}
          {eleveInfo && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <p className="text-sm font-semibold text-green-800">Élève identifié</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* Avatar + nom */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {eleveInfo.prenom.charAt(0)}
                    {eleveInfo.nom.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {eleveInfo.nom} {eleveInfo.postNom} {eleveInfo.prenom}
                    </h2>
                    <p className="text-sm text-slate-500">Matricule : {eleveInfo.matricule}</p>
                  </div>
                </div>

                {/* Informations */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <InfoRow label="Classe" value={eleveInfo.classe} />
                  <InfoRow label="École" value={eleveInfo.ecole || '—'} />
                  <InfoRow label="Sexe" value={eleveInfo.sexe || '—'} />
                  <InfoRow
                    label="Date de naissance"
                    value={
                      eleveInfo.dateNaissance
                        ? new Date(eleveInfo.dateNaissance).toLocaleDateString('fr-FR')
                        : '—'
                    }
                  />
                  <InfoRow label="Lieu de naissance" value={eleveInfo.lieuNaissance || '—'} />
                </div>
              </div>

              {/* Bouton nouveau scan */}
              <button
                onClick={() => {
                  setEleveInfo(null);
                  setLastResult(null);
                  setShowScanner(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Scanner un autre élève
              </button>
            </div>
          )}

          {/* Info permissions */}
          {!showScanner && !eleveInfo && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              <p className="font-medium text-slate-700">Informations</p>
              <ul className="mt-2 space-y-1.5 text-xs">
                <li>• Vous ne pouvez scanner que les élèves de vos classes affectées.</li>
                <li>• Un élève hors de votre établissement affichera « Accès non autorisé pour cet élève. ».</li>
                <li>• Aucune information financière n'est accessible via ce scanner.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal scanner */}
      {showScanner && (
        <QRScannerModal
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          flashOn={flashOn}
          onToggleFlash={() => setFlashOn((f) => !f)}
          lastResult={lastResult}
          submitting={submitting}
          title="Scanner un élève"
          subtitle="Scannez le QR code de la carte scolaire"
          renderResult={(result) => {
            if (result.error) {
              return (
                <p className="text-sm font-medium text-red-300">⚠️ {result.error}</p>
              );
            }
            return (
              <p className="text-sm font-medium text-green-300">
                ✅ {result.eleve.nom} {result.eleve.postNom} {result.eleve.prenom} — {result.eleve.classe}
              </p>
            );
          }}
        />
      )}
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
