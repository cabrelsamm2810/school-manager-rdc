/**
 * Filtre Prisma partagé par la liste des écoles (`/api/ecoles`) et son export
 * (`/api/ecoles/export`), afin que le fichier téléchargé contienne exactement
 * les écoles affichées : mêmes recherche, filtres et périmètre utilisateur.
 */

import { getScopeLevel } from '@/lib/territory-filter';

export type EcoleFilterUser = {
  role: string;
  typeInstitution?: string | null;
  provinceAdministrative?: string | null;
  coordSousProvincialeId?: string | null;
  ecoleId?: string | null;
};

export function buildEcolesWhere(
  searchParams: URLSearchParams,
  user: EcoleFilterUser,
): Record<string, unknown> {
  const search = searchParams.get('search') || undefined;
  const province = searchParams.get('province') || undefined;
  const provinceEducationnelle = searchParams.get('provinceEducationnelle') || undefined;
  const commune = searchParams.get('commune') || undefined;
  const type = searchParams.get('type') || undefined;
  const institution = searchParams.get('institution') || undefined;
  const statutValidation = searchParams.get('statutValidation') || undefined;

  const where: Record<string, unknown> = {};
  if (province) where.province = province;
  if (provinceEducationnelle) where.provinceEducationnelle = provinceEducationnelle;
  if (commune) where.commune = commune;
  if (type) where.type = type;
  if (institution) where.institution = institution;
  if (statutValidation) where.statutValidation = statutValidation;
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { dinacope: { contains: search, mode: 'insensitive' } },
      { identifiantSM: { contains: search, mode: 'insensitive' } },
      { province: { contains: search, mode: 'insensitive' } },
      { ville: { contains: search, mode: 'insensitive' } },
      { commune: { contains: search, mode: 'insensitive' } },
    ];
  }

  // ── Isolation par institution ──
  // SUPER_ADMIN voit tout ; les autres ne voient que leur institution.
  if (user.role !== 'SUPER_ADMIN' && user.typeInstitution && !institution) {
    where.institution = user.typeInstitution;
  }

  // Filtrage hiérarchique par périmètre territorial
  const scope = getScopeLevel(user.role);
  if (scope === 'sousProvincial' && user.coordSousProvincialeId) {
    where.coordSousProvincialeId = user.coordSousProvincialeId;
  } else if (scope === 'school' && user.ecoleId) {
    where.id = user.ecoleId;
  } else if (scope !== 'national') {
    const userProv = user.provinceAdministrative;
    if (userProv) where.province = userProv;
  }

  return where;
}
