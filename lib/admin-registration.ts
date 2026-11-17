import { z } from 'zod';

/**
 * Règles de préenregistrement des administrateurs School Manager RDC.
 *
 * Module volontairement pur (ni Prisma, ni `next/server`) : il contient les
 * validations partagées par l'espace Super Admin, l'inscription publique et les
 * tests unitaires. Toutes les décisions de sécurité sont prises côté serveur.
 */

/** Rôle unique des administrateurs gérés par ce module. */
export const ADMIN_ROLE = 'ADMIN_SCHOOL_MANAGER_RDC' as const;

/** Valeurs possibles du statut prévu par le Super Administrateur. */
export const ADMIN_STATUTS_PREVUS = ['ACTIF', 'INACTIF'] as const;
export type AdminStatutPrevu = (typeof ADMIN_STATUTS_PREVUS)[number];

/** États d'une autorisation de préenregistrement. */
export const ADMIN_AUTHORIZATION_STATUSES = ['EN_ATTENTE', 'COMPTE_CREE', 'REVOQUE'] as const;
export type AdminAuthorizationStatus = (typeof ADMIN_AUTHORIZATION_STATUSES)[number];

/** Module du journal d'audit utilisé par ce domaine. */
export const ADMIN_AUDIT_MODULE = 'administrateurs';

/** Message exigé lorsque l'adresse n'est pas (ou plus) autorisée. */
export const ADMIN_NOT_AUTHORIZED_MESSAGE =
  "Cette adresse Gmail n'est pas autorisée à créer un compte administrateur. Veuillez contacter le Super Administrateur de School Manager RDC.";

/** Message renvoyé lorsque l'adresse est autorisée mais que les noms diffèrent. */
export const ADMIN_NAMES_MISMATCH_MESSAGE =
  "Les informations fournies ne correspondent pas à l'autorisation enregistrée. Vérifiez votre nom, post-nom et prénom.";

const GMAIL_PATTERN = /^[^\s@]+@gmail\.com$/;

/** Normalise une adresse email (casse et espaces) pour toute comparaison. */
export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Vrai uniquement pour une adresse Gmail (domaine `gmail.com`). */
export function isGmailAddress(value: string | null | undefined): boolean {
  return GMAIL_PATTERN.test(normalizeEmail(value));
}

/**
 * Normalise un nom pour la comparaison : minuscules, sans accents, sans
 * ponctuation et avec des espaces simples. « KABEYA  wa MUKENDI » et
 * « Kabeya wa Mukendi » sont donc considérés identiques.
 */
export function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type NameLike = { nom: string; postNom?: string | null; prenom: string };

/**
 * Compare les noms saisis avec ceux du préenregistrement.
 * Retourne la liste des champs qui ne correspondent pas.
 */
export function findNameMismatches(
  registered: NameLike,
  input: NameLike,
): ('nom' | 'postNom' | 'prenom')[] {
  const fields: ('nom' | 'postNom' | 'prenom')[] = ['nom', 'postNom', 'prenom'];
  return fields.filter((field) => normalizeName(registered[field]) !== normalizeName(input[field]));
}

export type AdminAuthorizationRecord = {
  email: string;
  nom: string;
  postNom: string;
  prenom: string;
  statut: AdminAuthorizationStatus | string;
  statutPrevu: AdminStatutPrevu | string;
};

export type AdminAuthorizationVerdict =
  | { ok: true; record: AdminAuthorizationRecord }
  | { ok: false; reason: 'NOT_AUTHORIZED' | 'NAMES_MISMATCH'; error: string };

/**
 * Décide si une inscription « Admin School Manager RDC » est autorisée.
 * Aucune exception : une autorisation absente ou révoquée renvoie le message exact.
 */
export function evaluateAdminAuthorization(
  record: AdminAuthorizationRecord | null | undefined,
  input: NameLike & { email: string },
): AdminAuthorizationVerdict {
  if (!record || record.statut === 'REVOQUE') {
    return { ok: false, reason: 'NOT_AUTHORIZED', error: ADMIN_NOT_AUTHORIZED_MESSAGE };
  }
  if (normalizeEmail(record.email) !== normalizeEmail(input.email)) {
    return { ok: false, reason: 'NOT_AUTHORIZED', error: ADMIN_NOT_AUTHORIZED_MESSAGE };
  }
  if (findNameMismatches(record, input).length > 0) {
    return { ok: false, reason: 'NAMES_MISMATCH', error: ADMIN_NAMES_MISMATCH_MESSAGE };
  }
  return { ok: true, record };
}

/**
 * État du compte après vérification du code email, selon la règle du Super Admin :
 * un administrateur prévu « INACTIF » reste sans accès jusqu'à activation manuelle.
 */
export function activationFromStatutPrevu(statutPrevu: string | null | undefined): {
  isActive: boolean;
  userStatus: 'ACTIF' | 'DESACTIVE';
} {
  return statutPrevu === 'INACTIF'
    ? { isActive: false, userStatus: 'DESACTIVE' }
    : { isActive: true, userStatus: 'ACTIF' };
}

/** Schéma de création / modification d'un préenregistrement (Super Admin). */
export const adminPreRegistrationSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().max(80).optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  telephone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("L'adresse Gmail est invalide.")
    .refine((value) => isGmailAddress(value), "L'adresse doit être une adresse Gmail (@gmail.com)."),
  statutPrevu: z.enum(ADMIN_STATUTS_PREVUS).default('ACTIF'),
});

export type AdminPreRegistrationPayload = z.infer<typeof adminPreRegistrationSchema>;

/** Schéma de modification : l'adresse email d'une autorisation n'est pas modifiable. */
export const adminPreRegistrationUpdateSchema = adminPreRegistrationSchema.omit({ email: true });

/** Schéma des champs saisis lors de l'inscription publique d'un administrateur. */
export const adminSignupSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().trim().optional().or(z.literal('')),
  prenom: z.string().trim().min(2, 'Le prénom est obligatoire.'),
  email: z.string().trim().toLowerCase().email("L'adresse Gmail est invalide."),
  telephone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
});
