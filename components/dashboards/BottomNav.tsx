'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { getRoleDestination } from '@/lib/role-destination';
import { canAccessPath } from '@/lib/route-access';
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
    { label: 'Écoles', href: '/ecoles', icon: 'school' },
    { label: 'Notifs', href: '/notifications', icon: 'bell' }
  ],
  ADMIN_SCHOOL_MANAGER_RDC: [
    { label: 'Établissements', href: '/admin-smd/ecoles', icon: 'school' },
    { label: 'En attente', href: '/admin-smd/ecoles-en-attente', icon: 'clock' },
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people' }
  ],
  COORDINATION_NATIONALE: [
    { label: 'Provinces', href: '/provinces', icon: 'globe' },
    { label: 'Coordination', href: '/coordination-nationale', icon: 'flag' },
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people' }
  ],
  COORDINATION_PROVINCIALE: [
    { label: 'Institutions', href: '/ecoles', icon: 'school' },
    { label: 'Coordination', href: '/coordination-provinciale', icon: 'region' },
    { label: 'Utilisateurs', href: '/admin/users', icon: 'people' }
  ],
  COORDINATION_SOUS_PROVINCIALE: [
    { label: 'Institutions', href: '/ecoles', icon: 'school' },
    { label: 'Coordination', href: '/coordination-sous-provinciale', icon: 'district' },
    { label: 'Élèves', href: '/eleves', icon: 'users' }
  ],
  AGENT_PROVINCIAL: [
    { label: 'Dossiers', href: '/dossiers', icon: 'folder' },
    { label: 'Visites', href: '/visites', icon: 'visit' },
    { label: 'Institutions', href: '/ecoles', icon: 'school' }
  ],
  AGENT_SOUS_PROVINCIAL: [
    { label: 'Services', href: '/services', icon: 'services' },
    { label: 'Institutions', href: '/ecoles', icon: 'school' },
    { label: 'Élèves', href: '/eleves', icon: 'users' }
  ],
  CHEF_ADMINISTRATION: [
    { label: 'Écoles', href: '/ecoles', icon: 'school' },
    { label: 'Élèves', href: '/eleves', icon: 'users' },
    { label: 'Notifs', href: '/notifications', icon: 'bell' }
  ],
  PROMOTEUR: [
    { label: 'Écoles', href: '/ecoles', icon: 'school' },
    { label: 'Élèves', href: '/eleves', icon: 'users' },
    { label: 'Chat', href: '/schoolchat', icon: 'chat' }
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
  SECRETAIRE: [
    { label: 'Chat', href: '/schoolchat', icon: 'chat' },
    { label: 'Notifs', href: '/notifications', icon: 'bell' }
  ],
  COMPTABLE: [
    { label: 'Paiements', href: '/paiements', icon: 'card' },
    { label: 'Chat', href: '/schoolchat', icon: 'chat' },
    { label: 'Notifs', href: '/notifications', icon: 'bell' }
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
  ],
  VISITEUR: [
    { label: 'Notifs', href: '/notifications', icon: 'bell' },
    { label: 'Chat', href: '/schoolchat', icon: 'chat' }
  ]
};

const FALLBACK_TABS: Tab[] = [
  { label: 'Notifs', href: '/notifications', icon: 'bell' },
  { label: 'Chat', href: '/schoolchat', icon: 'chat' }
];

export function BottomNav({ role, onMore }: { role?: string | null; onMore: () => void }) {
  const pathname = usePathname();
  const home = getRoleDestination(role);
  // Les onglets fermés au rôle sont retirés : aucun onglet mort sur mobile.
  const tabs: Tab[] = [{ label: 'Accueil', href: home, icon: 'home' }, ...(ROLE_TABS[role ?? ''] ?? FALLBACK_TABS)]
    .filter((tab) => canAccessPath(role, tab.href));

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
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
                  'relative flex flex-col items-center gap-1 px-0.5 pt-2.5 pb-2 text-[10px] transition',
                  active ? 'font-bold text-brand-700' : 'font-medium text-slate-500 active:text-slate-700'
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-brand-600" />
                )}
                <span
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition',
                    active ? 'bg-brand-100 ring-1 ring-brand-200' : 'bg-transparent'
                  )}
                >
                  <Icon name={tab.icon} className={clsx('transition', active ? 'h-[19px] w-[19px]' : 'h-[18px] w-[18px]')} />
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
            className="relative flex w-full flex-col items-center gap-1 px-0.5 pt-2.5 pb-2 text-[10px] font-medium text-slate-500 transition hover:text-brand-700 active:text-brand-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl">
              <Icon name="more" className="h-[18px] w-[18px]" />
            </span>
            <span className="w-full truncate text-center">Plus</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
