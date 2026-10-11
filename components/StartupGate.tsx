'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/SplashScreen';
import { getRoleDestination } from '@/lib/role-destination';

/**
 * Ouverture intelligente : splash → vérification de la session → destination du rôle.
 *
 * La session est vérifiée côté serveur (/api/auth/session, cookie httpOnly) pendant le
 * splash : aucune valeur stockée dans le navigateur n'accorde l'accès à un espace.
 */
export function StartupGate() {
  const router = useRouter();
  const sessionCheck = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    sessionCheck.current = fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => (data?.authenticated && data.user?.role ? getRoleDestination(data.user.role) : null))
      .catch(() => null);
  }, []);

  /* Fin du splash : connecté → son espace, sinon l'accueil public reste affiché. */
  const handleDone = useCallback(() => {
    sessionCheck.current?.then((destination) => {
      if (destination) router.replace(destination);
    });
  }, [router]);

  return <SplashScreen onDone={handleDone} />;
}
