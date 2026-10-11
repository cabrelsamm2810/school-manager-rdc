'use client';

import { AppShell } from '@/components/AppShell';
import { useSessionUser } from '@/lib/use-session-user';
import { EcolesManagement } from '@/components/admin-smd/EcolesManagement';

/**
 * Console de gestion des établissements — Admin School Manager RDC.
 *
 * Accès réservé au rôle ADMIN_SCHOOL_MANAGER_RDC (middleware + lib/route-access.ts).
 * Toutes les vérifications de permissions sont effectuées côté serveur par les
 * routes /api/admin-smd/ecoles/*. Le masquage des boutons n'est qu'une amélioration
 * ergonomique, jamais une protection.
 */
export default function AdminSmdEcolesPage() {
  const session = useSessionUser();

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          {session ? (
            <EcolesManagement />
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
