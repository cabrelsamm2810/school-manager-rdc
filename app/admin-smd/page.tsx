'use client';

import { AppShell } from '@/components/AppShell';
import { AdminSMDDashboard } from '@/components/dashboards/AdminSMDDashboard';

/**
 * Tableau de bord Admin School Manager RDC.
 *
 * Accès réservé au rôle ADMIN_SCHOOL_MANAGER_RDC (middleware + lib/route-access.ts).
 * Aucune logique de sécurité n'est modifiée : le composant consomme uniquement
 * l'API /api/admin-smd/stats qui vérifie le rôle côté serveur.
 */
export default function AdminSMDPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <AdminSMDDashboard />
        </div>
      </div>
    </AppShell>
  );
}
