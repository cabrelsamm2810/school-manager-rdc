'use client';

import { Check, ShieldCheck } from 'lucide-react';

const ETAPES = [
  {
    titre: 'Ouvrez le scanner',
    texte: 'Autorisez l’accès à la caméra si le navigateur le demande.',
  },
  {
    titre: 'Cadrez le QR Code',
    texte: 'Placez la carte scolaire dans le cadre : la détection est automatique.',
  },
  {
    titre: 'Consultez la fiche',
    texte: 'Identité, classe et établissement s’affichent instantanément.',
  },
];

const GARANTIES = [
  'Le QR Code ne contient que le matricule signé — aucune donnée personnelle.',
  'Seuls les élèves de votre établissement peuvent être consultés.',
  'Aucune information financière ni coordonnée de tuteur n’est affichée.',
];

/** Guide d’utilisation et garanties affichés tant qu’aucun élève n’est scanné. */
export function ScannerEleveGuide() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Étapes */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Comment ça marche
        </p>
        <ol className="mt-3 space-y-3">
          {ETAPES.map((etape, index) => (
            <li key={etape.titre} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight text-slate-800">{etape.titre}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{etape.texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Garanties */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden />
          Scan sécurisé
        </p>
        <ul className="mt-3 space-y-2.5">
          {GARANTIES.map((garantie) => (
            <li key={garantie} className="flex gap-2.5 text-[12px] leading-relaxed text-slate-600">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <Check className="h-2.5 w-2.5" aria-hidden />
              </span>
              <span>{garantie}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
