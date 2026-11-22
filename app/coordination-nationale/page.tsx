'use client';

import { AppShell } from '@/components/AppShell';
import { NationalDashboard } from '@/components/coordination-nationale/NationalDashboard';

/**
 * Espace Coordination nationale EC-ERC — tableau de bord national.
 * Accès réservé au rôle COORDINATION_NATIONALE (middleware + route-access) ;
 * les données sont filtrées côté serveur sur les établissements EC-ERC.
 */
export default function CoordinationNationalePage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          <NationalDashboard />
        </div>
      </div>
    </AppShell>
  );
}
