'use client';

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';

export default function AccessDeniedPage() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="mb-3 text-xl font-bold text-slate-900">Accès non autorisé</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-500">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
            Votre rôle et votre périmètre ne permettent pas cette action.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
