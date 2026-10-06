'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

const SIZE_CLASSES = {
  xs: 'h-8 w-8 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl'
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

/**
 * Photo de profil circulaire, recadrée au carré et centrée (`object-cover object-center`).
 * Aucune déformation : l'image remplit le cercle.
 * Sans photo — ou si la photo n'est plus accessible — un avatar élégant aux
 * initiales de l'utilisateur est affiché.
 */
export function Avatar({
  photoUrl,
  prenom,
  nom,
  size = 'md',
  className
}: {
  photoUrl?: string | null;
  prenom?: string | null;
  nom?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || 'SM';
  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <span
      className={clsx(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700',
        SIZE_CLASSES[size],
        className
      )}
    >
      {showPhoto ? (
        <img
          src={photoUrl as string}
          alt={`${prenom ?? ''} ${nom ?? ''}`.trim() || 'Photo de profil'}
          className="h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-bold leading-none tracking-wide text-white">{initials}</span>
      )}
    </span>
  );
}
