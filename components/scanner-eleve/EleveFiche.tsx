'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { canAccessPath } from '@/lib/route-access';

export type EleveScanne = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string | null;
  lieuNaissance: string;
  classe: string;
  anneeScolaire: string;
  statut: string;
  photoUrl: string | null;
  ecole: {
    id: string;
    nom: string;
    dinacope: string;
    province: string;
    provinceEducationnelle: string;
    statut: string;
  } | null;
};

type Action = { label: string; href: string; icon: string };

/** Actions proposées après identification, filtrées par les droits du rôle. */
function actionsForRole(role: string | null | undefined): Action[] {
  const profile = ['/dossiers-eleves', '/mes-eleves'].find((href) => canAccessPath(role, href));
  const candidates: (Action | null)[] = [
    profile ? { label: 'Voir le profil', href: profile, icon: 'user' } : null,
    { label: 'Carte scolaire', href: '/carte-scolaire', icon: 'map' },
    { label: 'Voir le bulletin', href: '/bulletin-numerique', icon: 'notebook' },
    { label: 'Cahier de cotes', href: '/cahier-de-cote', icon: 'clipboard' },
    { label: 'Voir les présences', href: '/presences-qr', icon: 'calendar' },
  ];
  return candidates.filter(
    (action): action is Action => Boolean(action) && canAccessPath(role, action!.href),
  );
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function initials(eleve: EleveScanne): string {
  return `${eleve.prenom.charAt(0)}${eleve.nom.charAt(0)}`.toUpperCase();
}

export function EleveFiche({
  eleve,
  role,
  onRescan,
}: {
  eleve: EleveScanne;
  role: string | null | undefined;
  onRescan: () => void;
}) {
  const actions = actionsForRole(role);
  const nomComplet = `${eleve.nom} ${eleve.postNom} ${eleve.prenom}`.replace(/\s+/g, ' ').trim();

  return (
    <div className="space-y-4 animate-[cardIn_0.4s_cubic-bezier(0.22,1,0.36,1)_forwards]">
      {/* Bandeau de confirmation */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">Élève identifié</p>
          <p className="text-xs text-emerald-700">Carte scolaire reconnue par School Manager RDC.</p>
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {/* Identité */}
        <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-4 pb-5 pt-4 text-white">
          <div className="flex items-start gap-3.5">
            {eleve.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={eleve.photoUrl}
                alt={`Photo de ${nomComplet}`}
                className="h-16 w-16 shrink-0 rounded-2xl bg-white/20 object-cover ring-2 ring-white/40"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-2 ring-white/30">
                {initials(eleve)}
                <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wider text-white/60">
                  Photo
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200">
                Élève
              </p>
              <h2 className="mt-0.5 break-words text-lg font-bold leading-tight">{nomComplet}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide">
                  Matricule {eleve.matricule}
                </span>
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-50">
                  {eleve.statut}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* État civil */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 border-b border-slate-100 p-4">
          <Field label="Nom" value={eleve.nom} />
          <Field label="Post-nom" value={eleve.postNom} />
          <Field label="Prénom" value={eleve.prenom} />
          <Field label="Sexe" value={eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : eleve.sexe || '—'} />
          <Field label="Date de naissance" value={formatDate(eleve.dateNaissance)} />
          <Field label="Classe / niveau" value={eleve.classe} />
          <Field label="Année scolaire" value={eleve.anneeScolaire} />
          <Field label="Statut" value={eleve.statut} />
        </div>

        {/* Établissement */}
        <div className="space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Établissement
          </p>
          <Field label="École" value={eleve.ecole?.nom || '—'} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
            <Field label="DINACOPE" value={eleve.ecole?.dinacope || '—'} />
            <Field label="Province éducationnelle" value={eleve.ecole?.provinceEducationnelle || '—'} />
          </div>
        </div>
      </article>

      {/* Actions */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Actions
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-slate-700 shadow-soft transition hover:border-brand-300 hover:text-brand-700 active:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon name={action.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0 leading-snug">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRescan}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition active:scale-[0.99]"
      >
        <Icon name="scan" className="h-4 w-4" />
        Retour au scanner
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="break-words text-[13px] font-semibold leading-snug text-slate-800">
        {value || '—'}
      </p>
    </div>
  );
}
