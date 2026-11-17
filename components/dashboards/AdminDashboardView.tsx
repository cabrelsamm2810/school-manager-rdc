'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { ROLE_LABELS } from '@/lib/roles';
import { visibleNavigationGroups } from '@/lib/navigation';
import { canAccessPath } from '@/lib/route-access';

export type AdminProfile = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  userStatus: string;
  profilePhotoUrl: string | null;
  createdAt: string;
};

const PERMISSION_LABELS: Record<string, string> = {
  'admin:users': 'Gestion des utilisateurs',
  'admin:user-search': 'Recherche d\u2019utilisateurs',
  'admin:user-profiles': 'Profils utilisateurs',
  'admin:user-validate': 'Validation des comptes',
  'admin:user-suspend': 'Suspension des comptes',
  'admin:user-reactivate': 'Réactivation des comptes',
  'admin:ecoles': 'Gestion des établissements',
  'admin:reports': 'Rapports',
  'admin:signalements': 'Signalements',
  'admin:annonces': 'Annonces',
  'admin:schoolchat': 'Modération SchoolChat',
  'admin:stats': 'Statistiques',
  'admin:activity': 'Suivi des activités',
  'admin:export': 'Exports',
  'admin:content': 'Contenus',
  'admin:demands': 'Demandes',
  'admin:audit-view': 'Journal d\u2019audit',
  'admins:manage': 'Gestion des administrateurs',
  'system:config': 'Configuration système',
  'roles:manage': 'Gestion des rôles',
  'permissions:manage': 'Gestion des permissions',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Espace administrateur : profil, permissions et modules accessibles.
 * Les permissions affichées viennent du mapping serveur `ROLE_PERMISSIONS`
 * (aucune permission n'est accordée ici : cet écran est en lecture seule).
 */
export function AdminDashboardView({
  profile,
  permissions,
}: {
  profile: AdminProfile;
  permissions: string[];
}) {
  const modules = visibleNavigationGroups(profile.role)
    .map((group) => ({
      title: group.title,
      items: group.items.filter((item) => canAccessPath(profile.role, item.href)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar photoUrl={profile.profilePhotoUrl} prenom={profile.prenom} nom={profile.nom} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Espace administrateur</p>
            <h1 className="mt-1 truncate text-xl font-bold text-slate-900 md:text-2xl">
              {profile.prenom} {profile.nom}
            </h1>
            <p className="truncate text-sm text-slate-500">{ROLE_LABELS[profile.role] ?? profile.role}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin-smd"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Icon name="chart" className="h-4 w-4" />
            Administration SMD
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Icon name="user" className="h-4 w-4" />
            Mon profil
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-slate-900">Mon profil</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Nom complet', value: `${profile.prenom} ${profile.postNom} ${profile.nom}`.replace(/\s+/g, ' ').trim() },
              { label: 'Adresse email', value: profile.email },
              { label: 'Téléphone', value: profile.telephone || '—' },
              { label: 'Rôle', value: ROLE_LABELS[profile.role] ?? profile.role },
              { label: 'Statut du compte', value: profile.userStatus === 'ACTIF' ? 'Actif' : profile.userStatus },
              { label: 'Compte créé le', value: formatDate(profile.createdAt) },
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <dt className="text-slate-500">{row.label}</dt>
                <dd className="text-right font-medium text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold text-slate-900">Mes permissions</h2>
          <p className="mb-4 text-xs text-slate-500">Permissions accordées par le rôle {ROLE_LABELS[profile.role] ?? profile.role}.</p>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                <Icon name="check" className="h-3 w-3 text-green-600" />
                {PERMISSION_LABELS[permission] ?? permission}
              </span>
            ))}
            {permissions.length === 0 && <p className="text-sm text-slate-500">Aucune permission accordée.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-1 font-bold text-slate-900">Modules accessibles</h2>
        <p className="mb-4 text-xs text-slate-500">Chaque lien a été vérifié avec les règles d'accès serveur du rôle.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{group.title}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <Link
                    key={`${group.title}-${item.href}-${item.label}`}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={item.icon} className="h-4 w-4 text-slate-400" />
                      {item.label}
                    </span>
                    <span className="text-slate-300">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
