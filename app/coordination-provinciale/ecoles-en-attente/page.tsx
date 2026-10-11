'use client';

import { AppShell } from '@/components/AppShell';
import { useSessionUser } from '@/lib/use-session-user';
import { EcolesEnAttente } from '@/components/admin-smd/EcolesEnAttente';

/**
 * Écoles en attente de validation — Coordination provinciale.
 *
 * Accès réservé au rôle COORDINATION_PROVINCIALE (middleware + lib/route-access.ts).
 * Les actions de validation/rejet sont effectuées via POST /api/ecoles/[id]/valider
 * qui vérifie les permissions et le périmètre côté serveur.
 */
export default function CoordinationProvincialeEcolesEnAttentePage() {
  const session = useSessionUser();

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          {session ? (
            <EcolesEnAttente />
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
