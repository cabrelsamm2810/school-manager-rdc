'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  CalendarCheck,
  FileText,
  IdCard,
  MapPin,
  NotebookPen,
  ScanLine,
  School,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
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
  anneeScolaire: string | null;
  statut: string | null;
  photoUrl: string | null;
  ecole: {
    nom: string;
    dinacope: string;
    province: string;
    provinceEducationnelle: string;
  } | null;
};

/** Valeur affichée quand la donnée n'existe pas : jamais de valeur inventée. */
const VIDE = '—';

function afficher(valeur: string | null | undefined): string {
  const texte = (valeur ?? '').trim();
  return texte.length > 0 ? texte : VIDE;
}

function libelleSexe(sexe: string): string {
  if (sexe === 'M') return 'Masculin';
  if (sexe === 'F') return 'Féminin';
  return afficher(sexe);
}

function formaterDate(date: string | null): string {
  if (!date) return VIDE;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return VIDE;
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function initiales(eleve: EleveScanne): string {
  return `${eleve.prenom.charAt(0)}${eleve.nom.charAt(0)}`.toUpperCase();
}

type Action = { label: string; href: string; icon: typeof UserRound };

/**
 * Fiche élève affichée après le scan du QR Code de la carte scolaire.
 * Seules les informations d'identification sont présentées (aucune donnée
 * financière ni coordonnée de tuteur). Les actions ne pointent que vers des
 * routes ouvertes au rôle connecté (`canAccessPath`).
 */
export function EleveScanFiche({
  eleve,
  role,
  onScanAgain,
}: {
  eleve: EleveScanne;
  role?: string | null;
  onScanAgain: () => void;
}) {
  // « Voir le profil » : la liste des élèves pour la direction, l'espace
  // « Mes élèves » pour l'enseignant (seule vue de profil ouverte à ce rôle).
  const profilHref = canAccessPath(role, '/eleves') ? '/eleves' : '/mes-eleves';

  const actions: Action[] = [
    { label: 'Voir le profil', href: profilHref, icon: UserRound },
    { label: 'Carte scolaire', href: '/carte-scolaire', icon: IdCard },
    { label: 'Bulletin', href: '/bulletin-numerique', icon: FileText },
    { label: 'Cahier de cotes', href: '/cahier-de-cote', icon: NotebookPen },
    { label: 'Présences', href: '/presences-qr', icon: CalendarCheck },
  ].filter((action) => canAccessPath(role, action.href));

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
      {/* En-tête : identité */}
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-4 py-5 text-white">
        <div className="flex items-center gap-3">
          {eleve.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={eleve.photoUrl}
              alt={`Photo de ${eleve.prenom} ${eleve.nom}`}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/40"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-2 ring-white/25">
              {initiales(eleve)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Élève identifié
            </p>
            <h2 className="mt-1 truncate text-lg font-bold leading-tight">
              {afficher(eleve.nom)} {eleve.postNom ? eleve.postNom : ''}
            </h2>
            <p className="truncate text-sm text-white/80">{afficher(eleve.prenom)}</p>
          </div>

          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 sm:inline-flex">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Vérifié
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-white ring-1 ring-white/20">
            {afficher(eleve.matricule)}
          </span>
          <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
            {afficher(eleve.classe)}
          </span>
          <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/20 sm:hidden">
            <BadgeCheck className="mr-1 inline h-3 w-3 align-[-2px]" aria-hidden />
            Vérifié
          </span>
        </div>
      </div>

      {/* Identité détaillée */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 py-4 sm:grid-cols-3">
        <Field label="Nom" value={afficher(eleve.nom)} />
        <Field label="Post-nom" value={afficher(eleve.postNom)} />
        <Field label="Prénom" value={afficher(eleve.prenom)} />
        <Field label="Sexe" value={libelleSexe(eleve.sexe)} />
        <Field label="Date de naissance" value={formaterDate(eleve.dateNaissance)} />
        <Field label="Classe / Niveau" value={afficher(eleve.classe)} />
        <Field label="Matricule" value={afficher(eleve.matricule)} mono />
        <Field label="Année scolaire" value={afficher(eleve.anneeScolaire)} />
        <Field label="Statut de l'élève" value={afficher(eleve.statut)} />
      </dl>

      {/* Établissement */}
      <div className="mx-4 mb-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          <School className="h-3.5 w-3.5" aria-hidden />
          Établissement
        </p>
        <p className="mt-1.5 text-sm font-semibold text-slate-900">{afficher(eleve.ecole?.nom)}</p>
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">DINACOPE</p>
            <p className="break-words font-mono text-[12px] font-medium text-slate-700">
              {afficher(eleve.ecole?.dinacope)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              <MapPin className="h-3 w-3" aria-hidden />
              Province éducationnelle
            </p>
            <p className="break-words text-[12px] font-medium text-slate-700">
              {afficher(eleve.ecole?.provinceEducationnelle || eleve.ecole?.province)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions autorisées au rôle connecté */}
      {actions.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/60 active:scale-[0.99]"
              >
                <action.icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span className="leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 px-4 py-3.5">
        <button
          type="button"
          onClick={onScanAgain}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.99]"
        >
          <ScanLine className="h-4 w-4" aria-hidden />
          Retour au scanner
        </button>
      </div>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-0.5 break-words text-[13px] font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
