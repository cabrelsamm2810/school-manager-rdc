'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { getInstitutionLabel } from '@/lib/institution';
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
  ecoleNom?: string | null;
};

const SCOPE_LABELS: Record<string, string> = {
  national: 'Vue nationale',
  provincial: 'Vue provinciale',
  sousProvincial: 'Vue sous-provinciale',
  school: 'Mon école',
  enseignant: 'Espace enseignant'
};

/**
 * Carte de bienvenue : photo de profil réelle (ou avatar aux initiales),
 * identité, rôle et portée de l'espace. Aucune donnée n'est simulée : tout
 * provient de la session serveur. L'heure est affichée par la carte montre.
 */
export function WelcomeCard({ user, scope }: { user: WelcomeUser; scope: string }) {
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const institutionLabel = getInstitutionLabel(user);

  return (
    <section className="dash-card relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B21B6] via-[#6D28D9] to-[#8B5CF6] p-4 text-white shadow-lg shadow-violet-900/20 sm:p-5">
      <span className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Avatar
            photoUrl={user.profilePhotoUrl}
            prenom={user.prenom}
            nom={user.nom}
            size="xl"
            className="shadow-xl ring-4 ring-white/25"
          />

          <div className="min-w-0 sm:hidden">
            <p className="text-[10px] font-medium uppercase tracking-wider text-violet-200">
              {SCOPE_LABELS[scope] ?? 'Tableau de bord'}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-bold leading-tight">Bonjour, {user.prenom}</h1>
            <p className="mt-0.5 text-[11px] text-violet-100">Bienvenue sur votre espace School Manager RDC</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden sm:block">
            <p className="text-[10px] font-medium uppercase tracking-wider text-violet-200">
              {SCOPE_LABELS[scope] ?? 'Tableau de bord'}
            </p>
            <h1 className="mt-0.5 text-xl font-bold leading-tight">Bonjour, {user.prenom}</h1>
            <p className="mt-0.5 text-[13px] text-violet-100">Bienvenue sur votre espace School Manager RDC</p>
          </div>

          <p className="mt-2 truncate text-sm font-semibold text-white sm:text-base">
            {user.prenom} {user.nom}
            {user.postNom ? ` ${user.postNom}` : ''}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white">
              <Icon name="shield" className="h-3 w-3" />
              {roleLabel}
            </span>
            {institutionLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white">
                <Icon name="school" className="h-3 w-3" />
                {institutionLabel}
              </span>
            )}
            {user.ecoleNom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white">
                <Icon name="school" className="h-3 w-3" />
                {user.ecoleNom}
              </span>
            )}
            {user.provinceAdministrative && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white">
                <Icon name="location" className="h-3 w-3" />
                {user.provinceAdministrative}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
