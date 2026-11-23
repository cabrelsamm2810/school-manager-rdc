'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { INSTITUTION_MAP } from '@/lib/institutions';
import type { EcoleProfilEcole, EcoleProfilProfil } from '@/components/ecoles/profil/types';

/** En-tête « carte d'identité » de l'établissement : nom, code école, rattachement. */
export function EcoleProfilEntete({ ecole, profil }: { ecole: EcoleProfilEcole; profil: EcoleProfilProfil }) {
  const [copied, setCopied] = useState(false);
  const inst = INSTITUTION_MAP[ecole.institution];

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(profil.codeEcole);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-5 py-6 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {ecole.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ecole.logoUrl} alt="Logo de l'école" className="h-16 w-16 rounded-2xl bg-white/10 object-cover ring-2 ring-white/30" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold ring-2 ring-white/30">
                {ecole.nom.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Profil de l’établissement</p>
              <h1 className="truncate text-xl font-bold sm:text-2xl">{ecole.nom}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg bg-white/15 px-2.5 py-1 font-medium">{inst?.label || ecole.institution}</span>
                {ecole.type && <span className="rounded-lg bg-white/15 px-2.5 py-1 font-medium">{ecole.type}</span>}
                <StatutBadge statut={ecole.statutValidation} />
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Code école</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wide">{profil.codeEcole}</span>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-lg bg-white/15 p-1.5 transition hover:bg-white/25"
                aria-label="Copier le code école"
                title="Copier le code école"
              >
                <Icon name={copied ? 'check' : 'clipboard'} className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/70">{copied ? 'Code copié' : 'Identifiant unique'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
        <Info label="DINACOPE" value={ecole.dinacope || '—'} />
        <Info label="Province éducationnelle" value={ecole.provinceEducationnelle || '—'} />
        <Info label="Structure de rattachement" value={ecole.coordSousProvinciale?.nom || ecole.ecErc?.nom || '—'} />
        <Info label="Effectif déclaré" value={ecole.effectif.toLocaleString('fr-FR')} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
