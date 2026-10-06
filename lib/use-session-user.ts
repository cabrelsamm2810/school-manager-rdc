'use client';

import { useEffect, useState } from 'react';

export type SessionUser = {
  id: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
  email: string;
  telephone?: string | null;
  role: string;
  profilePhotoUrl?: string | null;
  provinceAdministrative?: string | null;
  etablissementId?: string | null;
  typeInstitution?: string | null;
  institutionName?: string | null;
};

/**
 * Source unique de la session côté client.
 *
 * Le shell (menu + en-tête) et le tableau de bord consomment la même requête :
 * une seule lecture de `/api/auth/session` est partagée, et le résultat est mis
 * en cache pour éviter de la refaire à chaque navigation.
 *
 * L'événement `profile-photo-updated` (émis par la page profil) invalide le
 * cache afin que la photo affichée dans l'en-tête, le menu et le tableau de
 * bord suive immédiatement la modification.
 */
let cachedUser: SessionUser | null = null;
let inflight: Promise<SessionUser | null> | null = null;

function loadSession(force = false): Promise<SessionUser | null> {
  if (!force && inflight) return inflight;

  const request = fetch('/api/auth/session')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => (data?.authenticated ? (data.user as SessionUser) : null))
    .catch(() => null)
    .then((user) => {
      if (user) cachedUser = user;
      // Échec ou session absente : la prochaine monture pourra réessayer.
      else inflight = null;
      return user;
    });

  inflight = request;
  return request;
}

/** Force la relecture de la session (photo de profil modifiée, etc.). */
export function refreshSessionUser(): Promise<SessionUser | null> {
  inflight = null;
  return loadSession(true);
}

export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(cachedUser);

  useEffect(() => {
    let active = true;
    loadSession().then((next) => {
      if (active && next) setUser(next);
    });

    function onProfilePhotoUpdated() {
      refreshSessionUser().then((next) => {
        if (active && next) setUser(next);
      });
    }

    window.addEventListener('profile-photo-updated', onProfilePhotoUpdated);
    return () => {
      active = false;
      window.removeEventListener('profile-photo-updated', onProfilePhotoUpdated);
    };
  }, []);

  return user;
}
