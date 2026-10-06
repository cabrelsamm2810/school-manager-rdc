'use client';

import { ROLE_LABELS } from '@/lib/rbac';

type DashboardUser = {
  id: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
  email: string;
  role: string;
  profilePhotoUrl?: string | null;
  typeInstitution?: string | null;
  institutionName?: string | null;
  provinceAdministrative?: string | null;
};

const INSTITUTION_LABELS: Record<string, string> = {
  'EC-ERC': 'EC-ERC',
  'PUBLIQUE': 'École publique',
  'CATHOLIQUE': 'École catholique',
  'ISLAMIQUE': 'École islamique',
  'INDEPENDANTE': 'École indépendante',
};

export function DashboardHeader({ user, scope }: { user: DashboardUser; scope: string }) {
  const initials = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const institutionLabel = user.institutionName
    || (user.typeInstitution ? INSTITUTION_LABELS[user.typeInstitution] ?? user.typeInstitution : null);

  const scopeLabel: Record<string, string> = {
    national: 'Vue nationale',
    provincial: 'Vue provinciale',
    sousProvincial: 'Vue sous-provinciale',
    school: 'Mon établissement',
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {/* Photo / Avatar */}
        {user.profilePhotoUrl ? (
          <img
            src={user.profilePhotoUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/30"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white ring-2 ring-white/30">
            {initials}
          </div>
        )}

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-200">
            {scopeLabel[scope] ?? 'Tableau de bord'}
          </p>
          <h1 className="mt-1 text-xl font-bold leading-tight sm:text-2xl">
            Bienvenue, {user.prenom} {user.nom}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {roleLabel}
            </span>
            {institutionLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h9v18h-9V3zM13.5 8.25h6v12.75h-6V8.25z" />
                </svg>
                {institutionLabel}
              </span>
            )}
            {user.provinceAdministrative && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {user.provinceAdministrative}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
