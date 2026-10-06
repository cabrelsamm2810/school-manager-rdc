'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { DigitalClock } from './DigitalClock';
import { ROLE_LABELS } from '@/lib/rbac';

type WelcomeUser = {
  nom: string;
  prenom: string;
  postNom?: string | null;
  role: string;
  profilePhotoUrl?: string | null;
  typeInstitution?: string | null;
  institutionName?: string | null;
  provinceAdministrative?: string | null;
};

const INSTITUTION_LABELS: Record<string, string> = {
  'EC-ERC': 'EC-ERC',
  PUBLIQUE: 'École publique',
  CATHOLIQUE: 'École catholique',
  ISLAMIQUE: 'École islamique',
  INDEPENDANTE: 'École indépendante'
};

const SCOPE_LABELS: Record<string, string> = {
  national: 'Vue nationale',
  provincial: 'Vue provinciale',
  sousProvincial: 'Vue sous-provinciale',
  school: 'Mon établissement'
};

/**
 * Grande carte de bienvenue premium : photo de profil réelle (ou avatar aux
 * initiales), identité, rôle, message d'accueil et montre numérique.
 * Aucune donnée n'est simulée : tout provient de la session serveur.
 */
export function WelcomeCard({ user, scope }: { user: WelcomeUser; scope: string }) {
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const institutionLabel =
    user.institutionName ||
    (user.typeInstitution ? INSTITUTION_LABELS[user.typeInstitution] ?? user.typeInstitution : null);

  return (
    <section className="dash-card relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#0f2557] p-5 text-white shadow-xl shadow-blue-900/10 sm:p-7">
      <span className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar
            photoUrl={user.profilePhotoUrl}
            prenom={user.prenom}
            nom={user.nom}
            size="xl"
            className="shadow-2xl ring-4 ring-white/25"
          />

          <div className="min-w-0 sm:hidden">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
              {SCOPE_LABELS[scope] ?? 'Tableau de bord'}
            </p>
            <h1 className="mt-1 truncate text-xl font-bold leading-tight">Bonjour, {user.prenom}</h1>
            <p className="mt-1 text-xs text-blue-100">Votre espace School Manager RDC</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden sm:block">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
              {SCOPE_LABELS[scope] ?? 'Tableau de bord'}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">Bonjour, {user.prenom}</h1>
            <p className="mt-1 text-sm text-blue-100">Bienvenue sur votre espace School Manager RDC</p>
          </div>

          <p className="mt-3 truncate text-base font-semibold text-white sm:text-lg">
            {user.prenom} {user.nom}
            {user.postNom ? ` ${user.postNom}` : ''}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Icon name="badge" className="h-3.5 w-3.5" />
              {roleLabel}
            </span>
            {institutionLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <Icon name="school" className="h-3.5 w-3.5" />
                {institutionLabel}
              </span>
            )}
            {user.provinceAdministrative && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <Icon name="location" className="h-3.5 w-3.5" />
                {user.provinceAdministrative}
              </span>
            )}
          </div>
        </div>

        <DigitalClock className="w-full border-t border-white/15 pt-4 sm:w-auto sm:border-0 sm:pt-0" />
      </div>
    </section>
  );
}
