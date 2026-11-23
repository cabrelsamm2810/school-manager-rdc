export type EcoleProfilEcole = {
  id: string;
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  adresse: string;
  telephone: string;
  email: string;
  chefEcole: string;
  logoUrl: string | null;
  identifiantSM: string | null;
  effectif: number;
  statut: string;
  statutValidation: string;
  coordSousProvinciale: { id: string; nom: string } | null;
  ecErc: { id: string; nom: string } | null;
};

export type EcoleProfilProfil = {
  id: string;
  codeEcole: string;
  statut: string;
  chefUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EcoleProfilChef = {
  id: string;
  nom: string;
  postNom: string | null;
  prenom: string;
  email: string;
  telephone: string;
  profilePhotoUrl: string | null;
};

export type EcoleSection = {
  id: string;
  type: string;
  nom: string;
  cycle: string;
  ordre: number;
  statut: string;
};

export type EcoleProfilData = {
  ecole: EcoleProfilEcole;
  profil: EcoleProfilProfil;
  chef: EcoleProfilChef | null;
  sections: EcoleSection[];
  qrPayload: string;
  permissions: { canEdit: boolean };
};

export type EcoleHistoriqueEntry = {
  id: string;
  action: string;
  champ: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  userName: string;
  userRole: string;
  createdAt: string;
};

export const profilSectionClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-card';
export const profilLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-400';
export const profilValueClass = 'mt-0.5 text-sm font-medium text-slate-900';
export const profilInputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';
export const profilLabelFieldClass = 'mb-1.5 block text-xs font-medium text-slate-600';
