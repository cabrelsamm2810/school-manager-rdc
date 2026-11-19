'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

const TABS = [
  { href: '/coordination-nationale', label: "Vue d'ensemble", icon: 'home' },
  { href: '/coordination-nationale/coordination', label: 'Coordination & comptes', icon: 'people' },
  { href: '/coordination-nationale/documents', label: 'Documents', icon: 'document' },
  { href: '/coordination-nationale/securite', label: 'Sécurité & journal', icon: 'shield' },
  { href: '/coordination-nationale/organisation', label: 'Référentiel', icon: 'flag' },
];

/** Navigation secondaire de l'espace national (sous la barre latérale). */
export function NationalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation coordination nationale"
      className="mb-5 flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700',
            )}
          >
            <Icon name={tab.icon} className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
