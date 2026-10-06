'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

type Action = {
  label: string;
  href: string;
  icon: string;
  color: string;
};

const ROLE_ACTIONS: Record<string, Action[]> = {
  SUPER_ADMIN: [
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people', color: 'blue' },
    { label: 'Administration', href: '/admin', icon: 'shield', color: 'violet' },
    { label: 'Provinces', href: '/provinces', icon: 'globe', color: 'cyan' },
    { label: 'Notifications', href: '/notifications', icon: 'bell', color: 'amber' },
  ],
  COORDINATION_NATIONALE: [
    { label: 'Coord. nationale', href: '/coordination-nationale', icon: 'flag', color: 'blue' },
    { label: 'Provinces', href: '/provinces', icon: 'globe', color: 'cyan' },
    { label: 'Sous-divisions', href: '/sous-divisions', icon: 'district', color: 'violet' },
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people', color: 'emerald' },
  ],
  COORDINATION_PROVINCIALE: [
    { label: 'Coord. provinciale', href: '/coordination-provinciale', icon: 'region', color: 'cyan' },
    { label: 'Sous-divisions', href: '/sous-divisions', icon: 'district', color: 'violet' },
    { label: 'Établissements', href: '/etablissements', icon: 'school', color: 'blue' },
    { label: 'Bureaux & fonctions', href: '/bureaux-fonctions', icon: 'office', color: 'amber' },
  ],
  AGENT_PROVINCIAL: [
    { label: 'Dossiers', href: '/dossiers', icon: 'folder', color: 'rose' },
    { label: 'Visites', href: '/visites', icon: 'visit', color: 'blue' },
    { label: 'Établissements', href: '/etablissements', icon: 'school', color: 'violet' },
    { label: 'Élèves', href: '/eleves', icon: 'users', color: 'emerald' },
  ],
  COORDINATION_SOUS_PROVINCIALE: [
    { label: 'Coord. sous-provinciale', href: '/coordination-sous-provinciale', icon: 'district', color: 'violet' },
    { label: 'Établissements', href: '/etablissements', icon: 'school', color: 'blue' },
    { label: 'Services', href: '/services', icon: 'services', color: 'cyan' },
    { label: 'Élèves', href: '/eleves', icon: 'users', color: 'emerald' },
  ],
  AGENT_SOUS_PROVINCIAL: [
    { label: 'Services', href: '/services', icon: 'services', color: 'cyan' },
    { label: 'Établissements', href: '/etablissements', icon: 'school', color: 'blue' },
    { label: 'Dossiers', href: '/dossiers', icon: 'folder', color: 'rose' },
    { label: 'Élèves', href: '/eleves', icon: 'users', color: 'emerald' },
  ],
  DIRECTION_ECOLE: [
    { label: 'Ajouter un élève', href: '/eleves', icon: 'users', color: 'blue' },
    { label: 'Cahier de cote', href: '/cahier-de-cote', icon: 'notebook', color: 'amber' },
    { label: 'Bulletins', href: '/bulletin-numerique', icon: 'document', color: 'violet' },
    { label: 'Carte scolaire', href: '/carte-scolaire', icon: 'map', color: 'cyan' },
    { label: 'Enseignants', href: '/enseignants', icon: 'teacher', color: 'emerald' },
    { label: 'Classes', href: '/classes-rdc', icon: 'school', color: 'violet' },
    { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', color: 'emerald' },
    { label: 'Documents', href: '/dossiers-eleves', icon: 'folder', color: 'rose' },
  ],
  ENSEIGNANT: [
    { label: 'Mon tableau de bord', href: '/enseignant/dashboard', icon: 'home', color: 'blue' },
    { label: 'Cahier de cote', href: '/cahier-de-cote', icon: 'notebook', color: 'amber' },
    { label: 'Rappels de cotes', href: '/rappels-cotes', icon: 'bell', color: 'rose' },
    { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', color: 'emerald' },
  ],
  PARENT: [
    { label: 'Notifications', href: '/notifications', icon: 'bell', color: 'blue' },
    { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', color: 'emerald' },
    { label: 'Vérifier un bulletin', href: '/verifier-bulletin', icon: 'notebook', color: 'amber' },
  ],
  ELEVE: [
    { label: 'Notifications', href: '/notifications', icon: 'bell', color: 'blue' },
    { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', color: 'emerald' },
    { label: 'Vérifier un bulletin', href: '/verifier-bulletin', icon: 'notebook', color: 'amber' },
  ],
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
};

/**
 * Accès rapide : raccourcis vers les fonctionnalités réellement ouvertes au rôle
 * connecté. Les droits restent inchangés (mêmes routes, mêmes contrôles).
 */
export function QuickActions({ role }: { role: string }) {
  const actions = ROLE_ACTIONS[role] ?? ROLE_ACTIONS.DIRECTION_ECOLE;

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Accès rapide</h2>
      <p className="mt-1 text-sm text-slate-500">Les actions les plus utilisées dans votre espace.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => {
          const c = COLOR_MAP[action.color] ?? COLOR_MAP.blue;
          return (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className="dash-card group flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:shadow-md active:bg-slate-50"
              style={{ animationDelay: `${Math.min(index * 0.04, 0.3)}s` }}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
                <ActionIcon name={action.icon} />
              </span>
              <span className="min-w-0 flex-1 leading-snug">{action.label}</span>
              <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ActionIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    people: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.625 5.176-1.335 9-6.033 9-11.625 0-1.31-.21-2.571-.598-3.75a11.959 11.959 0 01-8.402-3.286z',
    globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-18c2.5 3 4 6 4 9s-1.5 6-4 9m-4-18c-2.5 3-4 6-4 9s1.5 6 4 9',
    bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.422 23.848 23.848 0 005.454 1.31m6.726 0a24.255 24.255 0 01-6.726 0m6.726 0a3 3 0 11-6.726 0',
    flag: 'M3 3v1.5M3 21l3-9 9 3-3-9 9 3',
    region: 'M9 6.75V15m6-6v8.25m.75 1.5H7.5m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
    district: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    school: 'M3.75 21h16.5M4.5 3h9v18h-9V3zM13.5 8.25h6v12.75h-6V8.25z',
    office: 'M3.75 21h16.5M4.5 3v18M19.5 3v18M9 7.5h6M9 12h6M9 16.5h6',
    folder: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
    visit: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.39a12.035 12.035 0 01-7.143-7.143c-.162-.441.014-.928.39-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    services: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.49-2.49a3.5 3.5 0 004.95 4.95l-1.5 1.5M11.42 15.17l-4.655 4.655a2.652 2.652 0 11-3.75-3.75l4.655-4.655m0 0a3.5 3.5 0 104.95-4.95l-4.655 4.655m0 0L9 9',
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    teacher: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25v14.25',
    notebook: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25v14.25m0-14.25c1.952 0 3.81.456 5.454 1.262',
    qr: 'M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z',
    home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V15a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v6a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V9.75',
    chat: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
    document: 'M14.25 3v5.25h5.25M6.75 3h7.5l5.25 5.25V21H6.75V3zM9.75 12.75h4.5M9.75 16.5h4.5',
    map: 'M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z',
  };

  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name] ?? paths.home} />
    </svg>
  );
}
