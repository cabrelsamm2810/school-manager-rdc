'use client';

import { Camera, CheckCircle2, ChevronRight, QrCode, ScanLine, ShieldCheck, WifiOff } from 'lucide-react';

/**
 * En-tête de la page « Scanner QR Code élève » : présentation, état du réseau
 * et bouton d'ouverture du scanner. Aucune logique de scan ici — tout est
 * piloté par la page via `online` et `onScan`.
 */
export function ScannerEleveHero({
  online,
  onScan,
}: {
  online: boolean;
  onScan: () => void;
}) {
  return (
    <div>
      {/* Présentation */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 p-5 text-white shadow-lg shadow-brand-900/20">
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" aria-hidden />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1 ring-inset ring-white/25">
            <QrCode className="h-3.5 w-3.5" aria-hidden />
            Espace enseignant
          </span>

          <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-tight sm:text-2xl">
            Scanner QR Code élève
          </h1>
          <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-white/80">
            Scannez la carte scolaire : la fiche de l&apos;élève s&apos;affiche automatiquement.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-inset ring-white/15">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
              Détection automatique
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-inset ring-white/15">
              <ScanLine className="h-3.5 w-3.5 text-sky-200" aria-hidden />
              Sans bouton
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-inset ring-white/15">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-200" aria-hidden />
              Sécurisé
            </span>
          </div>
        </div>
      </section>

      {/* État hors ligne */}
      {!online && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900"
        >
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Mode hors ligne.</span> La recherche d&apos;un élève nécessite une
            connexion. Aucune donnée n&apos;est affichée tant que le réseau n&apos;est pas rétabli.
          </p>
        </div>
      )}

      {/* Action principale */}
      <button
        type="button"
        onClick={onScan}
        disabled={!online}
        className="group mt-4 flex w-full items-center gap-3.5 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-4 text-left text-white shadow-lg shadow-brand-600/25 transition hover:shadow-xl hover:shadow-brand-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
          <Camera className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold leading-tight">Scanner un QR Code</span>
          <span className="mt-0.5 block text-[12px] leading-tight text-white/80">
            Ouvrir la caméra et cadrer la carte scolaire
          </span>
        </span>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-white/80 transition group-hover:translate-x-0.5"
          aria-hidden
        />
      </button>
    </div>
  );
}
