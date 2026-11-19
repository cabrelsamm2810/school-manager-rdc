import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';

/**
 * Garde d'accès de l'espace Coordination nationale EC-ERC.
 *
 * Le niveau national est réservé au rôle EXACT `COORDINATION_NATIONALE` :
 * aucun rôle supérieur (SUPER_ADMIN compris) ni inférieur n'ouvre ces
 * fonctions. La décision est prise à partir de la session serveur
 * (cookie httpOnly), jamais d'une valeur envoyée par le navigateur.
 */
export const NATIONAL_ROLE = 'COORDINATION_NATIONALE';

export async function requireNationalAccess(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Connexion requise.' }, { status: 401 }),
    };
  }
  if (user.role !== NATIONAL_ROLE) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Accès réservé à la Coordination nationale.' },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, user };
}

/** Nom affiché d'un utilisateur (prénom + nom). */
export function displayName(user: { prenom: string; nom: string }): string {
  return `${user.prenom} ${user.nom}`.trim();
}
