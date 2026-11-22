import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { can, type Permission } from '@/lib/permissions';
import { canNational, nationalCapabilities, nationalFonctionLabel } from '@/lib/national-fonctions';

/**
 * Accès serveur à l'espace Coordination nationale EC-ERC.
 *
 * Deux niveaux, toujours côté serveur :
 * 1. le rôle technique doit être `COORDINATION_NATIONALE` ;
 * 2. la fonction du compte doit accorder la permission demandée.
 *
 * Les routes API restent donc protégées même si un client masque ou non un
 * bouton : l'interface n'est jamais la sécurité.
 */

export type NationalSessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

type Denied = { ok: false; status: number; error: string };
type Granted = { ok: true; user: NationalSessionUser };

export async function getNationalUser(request: NextRequest): Promise<Granted | Denied> {
  const user = await getSessionUser(request);
  if (!user) return { ok: false, status: 401, error: 'Connexion requise.' };
  if (user.role !== 'COORDINATION_NATIONALE') {
    return { ok: false, status: 403, error: "Espace réservé à la Coordination nationale EC-ERC." };
  }
  return { ok: true, user };
}

export async function requireNationalPermission(
  request: NextRequest,
  permission: Permission
): Promise<Granted | Denied> {
  const auth = await getNationalUser(request);
  if (!auth.ok) return auth;

  const allowed = can(auth.user.role, permission) && canNational(auth.user.fonction, permission);
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: "Votre fonction à la Coordination nationale ne permet pas cette action."
    };
  }
  return auth;
}

/** Profil national exposé au client (aucune donnée sensible). */
export function nationalProfile(user: NationalSessionUser) {
  return {
    id: user.id,
    nom: user.nom,
    postNom: user.postNom,
    prenom: user.prenom,
    email: user.email,
    telephone: user.telephone,
    profilePhotoUrl: user.profilePhotoUrl,
    fonction: user.fonction ?? '',
    fonctionLabel: nationalFonctionLabel(user.fonction),
    peut: nationalCapabilities(user.fonction)
  };
}
