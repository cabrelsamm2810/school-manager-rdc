import { getScopeLevel } from '@/lib/territory-filter';

/**
 * Règles d'accès au Profil École — module pur (aucun accès Prisma).
 *
 * Elles garantissent la règle métier « aucune donnée d'une école n'est
 * accessible à une autre école sans autorisation ».
 */

export type ProfilUtilisateur = {
  id: string;
  role: string;
  nom?: string;
  postNom?: string | null;
  prenom?: string;
  typeInstitution?: string | null;
  provinceAdministrative?: string | null;
  coordSousProvincialeId?: string | null;
  ecoleId?: string | null;
};

export type EcolePerimetre = {
  id: string;
  institution: string;
  province: string;
  coordSousProvincialeId: string | null;
};

/** Rôles qui modifient la fiche administrative d'une école de leur périmètre. */
const EDITEURS = [
  'SUPER_ADMIN',
  'ADMIN_SCHOOL_MANAGER_RDC',
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'PROMOTEUR',
];

/** L'utilisateur peut-il consulter cette école ? */
export function canAccessEcole(user: ProfilUtilisateur, ecole: EcolePerimetre): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.typeInstitution && user.typeInstitution !== ecole.institution) return false;

  switch (getScopeLevel(user.role)) {
    case 'national':
      return true;
    case 'provincial':
      return !user.provinceAdministrative || ecole.province === user.provinceAdministrative;
    case 'sousProvincial':
      return !!user.coordSousProvincialeId && ecole.coordSousProvincialeId === user.coordSousProvincialeId;
    default:
      return !!user.ecoleId && user.ecoleId === ecole.id;
  }
}

/** L'utilisateur peut-il modifier la fiche (et ses sections/options) ? */
export function canEditEcoleProfil(user: ProfilUtilisateur, ecole: EcolePerimetre): boolean {
  return EDITEURS.includes(user.role) && canAccessEcole(user, ecole);
}
