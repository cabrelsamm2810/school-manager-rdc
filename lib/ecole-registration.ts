/**
 * Enregistrement complet d'un établissement scolaire.
 *
 * Toute création d'école doit produire, en plus de l'école elle-même :
 *  - un code unique d'établissement (`codeEcole`) ;
 *  - un QR code d'identification (`qrCodeUrl`, data URL PNG) ;
 *  - un profil administratif (numéro de dossier + rattachement par identifiants) ;
 *  - le chef d'établissement principal, relié à l'école par son identifiant.
 *
 * Les objets retournés sont des charges utiles `create` imbriquées Prisma :
 * l'école, son profil et son chef sont donc écrits dans une seule opération.
 */

import QRCode from 'qrcode';

export type EcoleChefInput = {
  nom?: string | null;
  telephone?: string | null;
  email?: string | null;
  fonction?: string | null;
};

export type EcoleRegistrationInput = {
  identifiantSM: string;
  nom: string;
  codeEcole?: string | null;
  institution: string;
  province?: string | null;
  provinceEducationnelle?: string | null;
  coordSousProvincialeId?: string | null;
  structureRattachementId?: string | null;
  structureRattachementType?: string | null;
  chef?: EcoleChefInput | null;
};

export type EcoleRegistration = {
  codeEcole: string;
  qrCodeUrl: string;
  profilAdministratif: ReturnType<typeof buildProfilAdministratif>;
  chefPrincipal?: {
    nom: string;
    telephone: string;
    email: string;
    fonction: string;
  };
};

/** Charge utile du QR code : elle identifie l'école par ses codes uniques. */
export function buildEcoleQrPayload(input: { identifiantSM: string; codeEcole: string; nom: string }): string {
  return `SMRDC-ECOLE|ID:${input.identifiantSM}|CODE:${input.codeEcole}|NOM:${input.nom}`;
}

/** Génère le QR code d'identification de l'école sous forme de data URL PNG. */
export async function generateEcoleQrCode(input: { identifiantSM: string; codeEcole: string; nom: string }): Promise<string> {
  return QRCode.toDataURL(buildEcoleQrPayload(input), {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

/** Champs du profil administratif, réutilisés à la création et à la modification. */
export function buildProfilAdministratif(input: Omit<EcoleRegistrationInput, 'nom' | 'chef' | 'codeEcole'>) {
  return {
    numeroDossier: `DOS-${input.identifiantSM}`,
    institution: input.institution,
    province: input.province?.trim() || '',
    provinceEducationnelle: input.provinceEducationnelle?.trim() || '',
    coordSousProvincialeId: input.coordSousProvincialeId || null,
    structureRattachementId: input.structureRattachementId || null,
    structureRattachementType: input.structureRattachementType || '',
  };
}

export async function buildEcoleRegistration(input: EcoleRegistrationInput): Promise<EcoleRegistration> {
  const codeEcole = input.codeEcole?.trim() || input.identifiantSM;
  const qrCodeUrl = await generateEcoleQrCode({
    identifiantSM: input.identifiantSM,
    codeEcole,
    nom: input.nom,
  });

  const chefNom = input.chef?.nom?.trim();

  return {
    codeEcole,
    qrCodeUrl,
    profilAdministratif: buildProfilAdministratif(input),
    ...(chefNom
      ? {
          chefPrincipal: {
            nom: chefNom,
            telephone: input.chef?.telephone?.trim() || '',
            email: input.chef?.email?.trim() || '',
            fonction: input.chef?.fonction?.trim() || "Chef d'établissement",
          },
        }
      : {}),
  };
}
