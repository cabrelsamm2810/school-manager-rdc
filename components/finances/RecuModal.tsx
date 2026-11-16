'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatDateHeure, formatMontant, type RecuPaiement } from '@/lib/finance-types';

type EleveRecu = {
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  ecole: string | null;
};

/**
 * Reçu numérique d'un paiement de frais scolaire.
 *
 * Contient le logo School Manager RDC, l'identité de l'élève, le frais concerné,
 * le montant payé, le solde restant, la date/heure, le mode de paiement, le
 * numéro unique du reçu et un QR code de vérification d'authenticité.
 */
export function RecuModal({
  recu,
  eleve,
  onClose,
  offline = false,
}: {
  recu: RecuPaiement;
  eleve: EleveRecu;
  onClose: () => void;
  offline?: boolean;
}) {
  const [qrCode, setQrCode] = useState('');
  const [shareState, setShareState] = useState('');

  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verifier-recus?numero=${encodeURIComponent(recu.recuNumero)}`
      : '';

  useEffect(() => {
    if (!verifyUrl) return;
    let active = true;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 })
      .then((url) => {
        if (active) setQrCode(url);
      })
      .catch(() => setQrCode(''));
    return () => {
      active = false;
    };
  }, [verifyUrl]);

  async function handleShare() {
    const texte = `Reçu ${recu.recuNumero} — ${recu.categorieNom} : ${formatMontant(recu.montant)} pour ${eleve.nom} ${eleve.prenom} (${eleve.classe}). Vérification : ${verifyUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Reçu ${recu.recuNumero}`, text: texte, url: verifyUrl });
        return;
      }
      await navigator.clipboard.writeText(texte);
      setShareState('Lien du reçu copié.');
    } catch {
      setShareState('Partage indisponible sur cet appareil.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 px-3 py-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #recu-imprimable, #recu-imprimable * { visibility: visible; }
          #recu-imprimable { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
        }
      `}</style>

      <div className="w-full max-w-md">
        <div id="recu-imprimable" className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* En-tête */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-4 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="School Manager RDC"
              className="h-11 w-11 flex-none rounded-lg bg-white/95 p-1 object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">School Manager RDC</p>
              <p className="truncate text-[11px] text-blue-100">{eleve.ecole ?? 'Établissement'}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] uppercase tracking-wide text-blue-100">Reçu n°</p>
              <p className="text-sm font-bold">{recu.recuNumero}</p>
            </div>
          </div>

          {offline && (
            <p className="bg-amber-50 px-5 py-2 text-center text-[11px] font-medium text-amber-700">
              Enregistré hors connexion — reçu officiel après synchronisation
            </p>
          )}

          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Reçu de paiement de frais scolaire
            </p>

            {/* Élève */}
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">
                {eleve.nom} {eleve.postNom} {eleve.prenom}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Matricule {eleve.matricule} · Classe {eleve.classe}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Année scolaire {recu.anneeScolaire}</p>
            </div>

            {/* Montants */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                <span className="text-xs text-slate-500">Frais concerné</span>
                <span className="text-sm font-semibold text-slate-900">{recu.categorieNom}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-xs font-medium text-emerald-700">Montant payé</span>
                <span className="text-base font-bold text-emerald-700">{formatMontant(recu.montant)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="text-xs text-slate-500">Solde restant</span>
                <span className="text-sm font-semibold text-slate-900">{formatMontant(recu.soldeApres)}</span>
              </div>
            </div>

            {/* Détails */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Date et heure</p>
                <p className="mt-0.5 font-medium text-slate-700">{formatDateHeure(recu.dateOperation)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Mode de paiement</p>
                <p className="mt-0.5 font-medium text-slate-700">{recu.modePaiement}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Référence</p>
                <p className="mt-0.5 font-medium text-slate-700">
                  {recu.referenceTransaction || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Enregistré par</p>
                <p className="mt-0.5 font-medium text-slate-700">{recu.enregistreParNom || '—'}</p>
              </div>
            </div>

            {/* QR de vérification */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-3">
              {qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt={`QR de vérification du reçu ${recu.recuNumero}`} className="h-20 w-20" />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-slate-100" />
              )}
              <p className="text-[11px] leading-snug text-slate-500">
                Scannez ce QR code pour vérifier l'authenticité du reçu auprès de School Manager RDC.
              </p>
            </div>
          </div>
        </div>

        {/* Actions (non imprimées) */}
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Imprimer
          </button>
          <button
            onClick={handleShare}
            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Partager
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Fermer
          </button>
        </div>
        {shareState && <p className="mt-2 text-center text-xs text-white/80">{shareState}</p>}
      </div>
    </div>
  );
}
