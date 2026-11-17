/**
 * Filtre Prisma partagé par la liste des établissements de la console Admin SMD
 * (`/api/admin-smd/ecoles`) et son export (`/api/admin-smd/ecoles/export`),
 * afin que le fichier téléchargé contienne exactement les écoles affichées.
 */

export function buildAdminEcolesWhere(
  searchParams: URLSearchParams,
): Record<string, unknown> {
  const search = searchParams.get('search')?.trim() || '';
  const typeFilter = searchParams.get('type') || '';
  const statutFilter = searchParams.get('statut') || '';
  const statutValidationFilter = searchParams.get('statutValidation') || '';
  const provinceFilter = searchParams.get('province') || '';
  const provinceEducFilter = searchParams.get('provinceEducationnelle') || '';
  const communeFilter = searchParams.get('commune') || '';
  const niveauFilter = searchParams.get('niveau') || '';
  const institutionFilter = searchParams.get('institution') || '';

  const where: Record<string, unknown> = {};

  if (typeFilter) where.type = typeFilter;
  if (statutFilter) where.statut = statutFilter;
  if (statutValidationFilter) where.statutValidation = statutValidationFilter;
  if (provinceFilter) where.province = provinceFilter;
  if (provinceEducFilter) where.provinceEducationnelle = provinceEducFilter;
  if (communeFilter) where.commune = communeFilter;
  if (niveauFilter) where.type = niveauFilter; // niveau scolaire stocké dans `type`
  if (institutionFilter) where.institution = institutionFilter;

  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { dinacope: { contains: search, mode: 'insensitive' } },
      { adresse: { contains: search, mode: 'insensitive' } },
      { commune: { contains: search, mode: 'insensitive' } },
      { ville: { contains: search, mode: 'insensitive' } },
      { province: { contains: search, mode: 'insensitive' } },
      { provinceEducationnelle: { contains: search, mode: 'insensitive' } },
      { chefEcole: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { identifiantSM: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}
