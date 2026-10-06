'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { getRoleDestination } from '@/lib/role-destination';
import { Icon } from '@/components/ui/Icon';

type Tab = { label: string; href: string; icon: string };

/**
 * Onglets courts du bas d'écran (mobile uniquement).
 *
 * Chaque rôle dispose de ses propres raccourcis, tous pointant vers des routes
 * déjà ouvertes au rôle (mêmes droits que la barre latérale) : aucune règle
 * d'accès n'est ajoutée ni contournée. Le premier onglet est la destination
 * d'ouverture du rôle, le dernier ouvre le menu complet.
 */
const ROLE_TABS: Record<string, Tab[]> = {
  SUPER_ADMIN: [
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people' },
    { label: 'Écoles', href: '/etablissements', icon: 'school' },
    { label: 'Notifs', href: '/notifications', icon: 'bell' }
  ],
  COORDINATION_NATIONALE: [
    { label: 'Provinces', href: '/provinces', icon: 'globe' },
    { label: 'Coordination', href: '/coordination-nationale', icon: 'flag' },
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people' }
  ],
  COORDINATION_PROVINCIALE: [
    { label: 'Écoles', href: '/etablissements', icon: 'school' },
    { label: 'Coordination', href: '/coordination-provinciale', icon: 'region' },
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people' }
  ],
  COORDINATION_SOUS_PROVINCIALE: [
    { label: 'Écoles', href: '/etablissements', icon: 'school' },
    { label: 'Coordination', href: '/coordination-sous-provinciale', icon: 'district' },
    { label: 'Élèves', href: '/eleves', icon: 'users' }
  ],
  AGENT_PROVINCIAL: [
    { label: 'Dossiers', href: '/dossiers', icon: 'folder' },
    { label: 'Visites', href: '/visites', icon: 'visit' },
    { label: 'Écoles', href: '/etablissements', icon: 'school' }
  ],
  AGENT_SOUS_PROVINCIAL: [
    { label: 'Services', href: '/services', icon: 'services' },
    { label: 'Écoles', href: '/etablissements', icon: 'school' },
    { label: 'Élèves', href: '/eleves', icon: 'users' }
  ],
  DIRECTION_ECOLE: [
    { label: 'Élèves', href: '/eleves', icon: 'users' },
    { label: 'Classes', href: '/classes-rdc', icon: 'school' },
    { label: 'Bulletins', href: '/bulletin-numerique', icon: 'notebook' }
  ],
  ENSEIGNANT: [
    { label: 'Notes', href: '/cahier-de-cote', icon: 'notebook' },
    { label: 'Rappels', href: '/rappels-cotes', icon: 'bell' },
    { label: 'Chat', href: '/schoolchat', icon: 'chat' }
  ],
  PARENT: [
    { label: 'Notifs', href: '/notifications', icon: 'bell' },
    { label: 'Chat', href: '/schoolchat', icon: 'chat' },
    { label: 'Bulletins', href: '/verifier-bulletin', icon: 'notebook' }
  ],
  ELEVE: [
    { label: 'Notifs', href: '/notifications', icon: 'bell' },
    { label: 'Chat', href: '/schoolchat', icon: 'chat' },
    { label: 'Bulletins', href: '/verifier-bulletin', icon: 'notebook' }
  ]
};

const FALLBACK_TABS: Tab[] = [
  { label: 'Notifs', href: '/notifications', icon: 'bell' },
  { label: 'Chat', href: '/schoolchat', icon: 'chat' }
];

export function BottomNav({ role, onMore }: { role?: string | null; onMore: () => void }) {
  const pathname = usePathname();
  const home = getRoleDestination(role);
  const tabs: Tab[] = [{ label: 'Accueil', href: home, icon: 'home' }, ...(ROLE_TABS[role ?? ''] ?? FALLBACK_TABS)];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation rapide"
    >
      <ul className="flex items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-col items-center gap-1 px-0.5 py-2 text-[10px] font-medium transition',
                  active ? 'text-violet-700' : 'text-slate-500 active:text-slate-700'
                )}
              >
                <span
                  className={clsx(
                    'flex h-7 w-11 items-center justify-center rounded-full transition',
                    active && 'bg-violet-100'
                  )}
                >
                  <Icon name={tab.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="w-full truncate text-center">{tab.label}</span>
              </Link>
            </li>
          );
        })}

        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onMore}
            className="flex w-full flex-col items-center gap-1 px-0.5 py-2 text-[10px] font-medium text-slate-500 transition hover:text-violet-700 active:text-violet-700"
          >
            <span className="flex h-7 w-11 items-center justify-center rounded-full">
              <Icon name="more" className="h-[18px] w-[18px]" />
            </span>
            <span className="w-full truncate text-center">Plus</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
