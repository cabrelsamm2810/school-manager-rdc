import { PERM, type Permission } from '@/lib/permissions';

/**
 * Fonctions de la Coordination nationale EC-ERC.
 *
 * Le rôle `COORDINATION_NATIONALE` reste le rôle technique (authentification,
 * routes, périmètre national). La fonction portée par `User.fonction` ajoute
 * une couche de permissions : deux comptes de coordination nationale n'ont
 * donc pas automatiquement les mêmes privilèges.
 *
 * Module pur (sans Prisma) : importable par le middleware, les routes API et
 * les composants clients.
 */

export const NATIONAL_FONCTION = {
  COORDINATEUR_NATIONAL: 'COORDINATEUR_NATIONAL',
  CHEF_ADMINISTRATION_NATIONAL: 'CHEF_ADMINISTRATION_NATIONAL',
  SECRETAIRE_NATIONAL: 'SECRETAIRE_NATIONAL',
  AGENT_NATIONAL: 'AGENT_NATIONAL'
} as const;

export type NationalFonction = (typeof NATIONAL_FONCTION)[keyof typeof NATIONAL_FONCTION];

/** Toutes les permissions de la sphère nationale (référence). */
export const NATIONAL_PERMISSIONS: Permission[] = [
  PERM.NATIONAL_DASHBOARD,
  PERM.NATIONAL_STATS,
  PERM.NATIONAL_REPORTS,
  PERM.NATIONAL_DOSSIERS,
  PERM.NATIONAL_PRESENCES,
  PERM.NATIONAL_COORDINATIONS,
  PERM.NATIONAL_DOCUMENTS,
  PERM.NATIONAL_COMMUNICATIONS,
  PERM.NATIONAL_USERS
];

export type NationalFonctionDef = {
  value: NationalFonction;
  label: string;
  description: string;
  permissions: Permission[];
};

export const NATIONAL_FONCTIONS: NationalFonctionDef[] = [
  {
    value: 'COORDINATEUR_NATIONAL',
    label: 'Coordinateur national',
    description: 'Accès complet aux fonctions nationales : supervision, coordinations, documents, communications et comptes.',
    permissions: [...NATIONAL_PERMISSIONS]
  },
  {
    value: 'CHEF_ADMINISTRATION_NATIONAL',
    label: "Chef d'administration national",
    description: 'Gestion administrative : coordinations, comptes, documents et rapports, sans les communications officielles.',
    permissions: [
      PERM.NATIONAL_DASHBOARD,
      PERM.NATIONAL_STATS,
      PERM.NATIONAL_REPORTS,
      PERM.NATIONAL_DOSSIERS,
      PERM.NATIONAL_PRESENCES,
      PERM.NATIONAL_COORDINATIONS,
      PERM.NATIONAL_DOCUMENTS,
      PERM.NATIONAL_USERS
    ]
  },
  {
    value: 'SECRETAIRE_NATIONAL',
    label: 'Secrétaire national',
    description: 'Correspondances et gestion documentaire : circulaires, décisions, lettres et rapports.',
    permissions: [
      PERM.NATIONAL_DASHBOARD,
      PERM.NATIONAL_REPORTS,
      PERM.NATIONAL_DOCUMENTS,
      PERM.NATIONAL_COMMUNICATIONS
    ]
  },
  {
    value: 'AGENT_NATIONAL',
    label: 'Agent national',
    description: 'Consultation et suivi des missions attribuées : tableau de bord, statistiques, rapports et dossiers.',
    permissions: [
      PERM.NATIONAL_DASHBOARD,
      PERM.NATIONAL_STATS,
      PERM.NATIONAL_REPORTS,
      PERM.NATIONAL_DOSSIERS
    ]
  }
];

const BY_VALUE = new Map(NATIONAL_FONCTIONS.map((f) => [f.value, f]));

/** Définition de la fonction, ou null si la valeur est inconnue / vide. */
export function getNationalFonction(fonction?: string | null): NationalFonctionDef | null {
  if (!fonction) return null;
  return BY_VALUE.get(fonction as NationalFonction) ?? null;
}

/** Libellé affichable — la valeur brute est conservée si elle n'est pas connue. */
export function nationalFonctionLabel(fonction?: string | null): string {
  if (!fonction) return 'Coordination nationale';
  return getNationalFonction(fonction)?.label ?? fonction;
}

/**
 * Permissions nationales effectives.
 *
 * - Fonction reconnue : uniquement celles de la fonction.
 * - Fonction vide (comptes historiques) : toutes les permissions nationales,
 *   afin de ne pas retirer un accès existant.
 * - Fonction inconnue : aucune permission (deny by default).
 */
export function nationalPermissions(fonction?: string | null): Permission[] {
  if (!fonction) return [...NATIONAL_PERMISSIONS];
  const def = getNationalFonction(fonction);
  return def ? def.permissions : [];
}

/** Vérifie une permission nationale pour une fonction donnée. */
export function canNational(fonction: string | null | undefined, permission: Permission): boolean {
  return nationalPermissions(fonction).includes(permission);
}

/** Raccourcis lisibles pour l'interface. */
export function nationalCapabilities(fonction?: string | null) {
  return {
    documents: canNational(fonction, PERM.NATIONAL_DOCUMENTS),
    utilisateurs: canNational(fonction, PERM.NATIONAL_USERS),
    coordinations: canNational(fonction, PERM.NATIONAL_COORDINATIONS),
    communications: canNational(fonction, PERM.NATIONAL_COMMUNICATIONS),
    statistiques: canNational(fonction, PERM.NATIONAL_STATS),
    rapports: canNational(fonction, PERM.NATIONAL_REPORTS)
  };
}
