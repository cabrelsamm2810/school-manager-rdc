/**
 * Les 26 provinces administratives et éducationnelles de la RDC.
 *
 * Découpage territorial effectif depuis 2015 (Constitution de 2006).
 * Chaque province est à la fois une entité administrative et une
 * circonscription éducationnelle (province éducationnelle).
 */

export type ProvinceRDC = {
  nom: string;
  chefLieu: string;
  ancienneProvince: string;
  langue: string;
  superficie: number; // km²
};

export const PROVINCES_RDC: ProvinceRDC[] = [
  { nom: 'Kinshasa', chefLieu: 'Kinshasa', ancienneProvince: 'Kinshasa', langue: 'Lingala', superficie: 9965 },
  { nom: 'Kongo Central', chefLieu: 'Matadi', ancienneProvince: 'Bas-Congo', langue: 'Kikongo', superficie: 53920 },
  { nom: 'Kwango', chefLieu: 'Kenge', ancienneProvince: 'Bandundu', langue: 'Kikongo', superficie: 89974 },
  { nom: 'Kwilu', chefLieu: 'Bandundu', ancienneProvince: 'Bandundu', langue: 'Kikongo', superficie: 78219 },
  { nom: 'Mai-Ndombe', chefLieu: 'Inongo', ancienneProvince: 'Bandundu', langue: 'Lingala', superficie: 127465 },
  { nom: 'Kasaï', chefLieu: 'Tshikapa', ancienneProvince: 'Kasaï Occidental', langue: 'Tshiluba', superficie: 95631 },
  { nom: 'Kasaï Central', chefLieu: 'Kananga', ancienneProvince: 'Kasaï Occidental', langue: 'Tshiluba', superficie: 60958 },
  { nom: 'Kasaï Oriental', chefLieu: 'Mbuji-Mayi', ancienneProvince: 'Kasaï Oriental', langue: 'Tshiluba', superficie: 9481 },
  { nom: 'Lomami', chefLieu: 'Kabinda', ancienneProvince: 'Kasaï Oriental', langue: 'Tshiluba', superficie: 56426 },
  { nom: 'Sankuru', chefLieu: 'Lusambo', ancienneProvince: 'Kasaï Oriental', langue: 'Lotetela', superficie: 104331 },
  { nom: 'Maniema', chefLieu: 'Kindu', ancienneProvince: 'Maniema', langue: 'Swahili', superficie: 132520 },
  { nom: 'Sud-Kivu', chefLieu: 'Bukavu', ancienneProvince: 'Sud-Kivu', langue: 'Swahili', superficie: 65070 },
  { nom: 'Nord-Kivu', chefLieu: 'Goma', ancienneProvince: 'Nord-Kivu', langue: 'Swahili', superficie: 59483 },
  { nom: 'Ituri', chefLieu: 'Bunia', ancienneProvince: 'Province Orientale', langue: 'Swahili', superficie: 65658 },
  { nom: 'Haut-Uele', chefLieu: 'Isiro', ancienneProvince: 'Province Orientale', langue: 'Lingala', superficie: 98683 },
  { nom: 'Bas-Uele', chefLieu: 'Buta', ancienneProvince: 'Province Orientale', langue: 'Lingala', superficie: 148331 },
  { nom: 'Tshopo', chefLieu: 'Kisangani', ancienneProvince: 'Province Orientale', langue: 'Swahili', superficie: 199567 },
  { nom: 'Mongala', chefLieu: 'Lisala', ancienneProvince: 'Équateur', langue: 'Lingala', superficie: 58141 },
  { nom: 'Nord-Ubangi', chefLieu: 'Gbadolite', ancienneProvince: 'Équateur', langue: 'Lingala', superficie: 56644 },
  { nom: 'Sud-Ubangi', chefLieu: 'Gemena', ancienneProvince: 'Équateur', langue: 'Lingala', superficie: 51648 },
  { nom: 'Équateur', chefLieu: 'Mbandaka', ancienneProvince: 'Équateur', langue: 'Lingala', superficie: 103902 },
  { nom: 'Tshuapa', chefLieu: 'Boende', ancienneProvince: 'Équateur', langue: 'Lingala', superficie: 132957 },
  { nom: 'Haut-Lomami', chefLieu: 'Kamina', ancienneProvince: 'Katanga', langue: 'Swahili', superficie: 108204 },
  { nom: 'Lualaba', chefLieu: 'Kolwezi', ancienneProvince: 'Katanga', langue: 'Swahili', superficie: 121308 },
  { nom: 'Haut-Katanga', chefLieu: 'Lubumbashi', ancienneProvince: 'Katanga', langue: 'Swahili', superficie: 132425 },
  { nom: 'Tanganyika', chefLieu: 'Kalemie', ancienneProvince: 'Katanga', langue: 'Swahili', superficie: 134940 },
];

/** Liste simple des noms de provinces pour les listes déroulantes. */
export const PROVINCE_NAMES = PROVINCES_RDC.map((p) => p.nom);

/** Map nom → chef-lieu. */
export const CHEF_LIEU_MAP: Record<string, string> = Object.fromEntries(
  PROVINCES_RDC.map((p) => [p.nom, p.chefLieu]),
);

/** Retrouve la province par son nom (insensible à la casse). */
export function findProvince(nom: string): ProvinceRDC | undefined {
  return PROVINCES_RDC.find((p) => p.nom.toLowerCase() === nom.toLowerCase());
}

/* ── Provinces éducationnelles (EPST) ──
 *
 * La RDC compte 60 provinces éducationnelles gérées par l'EPST
 * (Enseignement Primaire, Secondaire et Technique), réparties dans
 * les 26 provinces administratives. Chaque province éducationnelle
 * est dirigée par un PROVED, un IPP et une DIPROCOPE.
 */

export type ProvinceEducationnelle = {
  nom: string;
  provinceAdministrative: string;
  chefLieu: string;
  sousDivisions: number;
};

export const PROVINCES_EDUCATIONNELLES: ProvinceEducationnelle[] = [
  // Kinshasa (5)
  { nom: 'Kinshasa Lukunga', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 13 },
  { nom: 'Kinshasa Funa', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 12 },
  { nom: 'Kinshasa Mont-Amba', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 10 },
  { nom: 'Kinshasa Tshangu', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 10 },
  { nom: 'Kinshasa Plateau', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 8 },
  // Kongo Central (3)
  { nom: 'Kongo Central 1', provinceAdministrative: 'Kongo Central', chefLieu: 'Matadi', sousDivisions: 8 },
  { nom: 'Kongo Central 2', provinceAdministrative: 'Kongo Central', chefLieu: 'Boma', sousDivisions: 7 },
  { nom: 'Kongo Central 3', provinceAdministrative: 'Kongo Central', chefLieu: 'Moanda', sousDivisions: 5 },
  // Bas-Uélé (1)
  { nom: 'Bas-Uélé', provinceAdministrative: 'Bas-Uele', chefLieu: 'Buta', sousDivisions: 6 },
  // Équateur (2)
  { nom: 'Équateur 1', provinceAdministrative: 'Équateur', chefLieu: 'Mbandaka', sousDivisions: 23 },
  { nom: 'Équateur 2', provinceAdministrative: 'Équateur', chefLieu: 'Basankusu', sousDivisions: 15 },
  // Haut-Katanga (2)
  { nom: 'Haut-Katanga 1', provinceAdministrative: 'Haut-Katanga', chefLieu: 'Lubumbashi', sousDivisions: 10 },
  { nom: 'Haut-Katanga 2', provinceAdministrative: 'Haut-Katanga', chefLieu: 'Pweto', sousDivisions: 4 },
  // Haut-Lomami (2)
  { nom: 'Haut-Lomami 1', provinceAdministrative: 'Haut-Lomami', chefLieu: 'Kamina', sousDivisions: 12 },
  { nom: 'Haut-Lomami 2', provinceAdministrative: 'Haut-Lomami', chefLieu: 'Bukama', sousDivisions: 8 },
  // Haut-Uélé (2)
  { nom: 'Haut-Uélé 1', provinceAdministrative: 'Haut-Uele', chefLieu: 'Isiro', sousDivisions: 5 },
  { nom: 'Haut-Uélé 2', provinceAdministrative: 'Haut-Uele', chefLieu: 'Watsa', sousDivisions: 4 },
  // Ituri (3)
  { nom: 'Ituri 1', provinceAdministrative: 'Ituri', chefLieu: 'Bunia', sousDivisions: 8 },
  { nom: 'Ituri 2', provinceAdministrative: 'Ituri', chefLieu: 'Irumu', sousDivisions: 6 },
  { nom: 'Ituri 3', provinceAdministrative: 'Ituri', chefLieu: 'Aru', sousDivisions: 5 },
  // Kasaï (2)
  { nom: 'Kasaï 1', provinceAdministrative: 'Kasaï', chefLieu: 'Tshikapa', sousDivisions: 6 },
  { nom: 'Kasaï 2', provinceAdministrative: 'Kasaï', chefLieu: 'Luebo', sousDivisions: 4 },
  // Kasaï-Central (2)
  { nom: 'Kasaï-Central 1', provinceAdministrative: 'Kasaï Central', chefLieu: 'Kananga', sousDivisions: 8 },
  { nom: 'Kasaï-Central 2', provinceAdministrative: 'Kasaï Central', chefLieu: 'Tshikapa', sousDivisions: 6 },
  // Kasaï-Oriental (2)
  { nom: 'Kasaï-Oriental 1', provinceAdministrative: 'Kasaï Oriental', chefLieu: 'Mbuji-Mayi', sousDivisions: 8 },
  { nom: 'Kasaï-Oriental 2', provinceAdministrative: 'Kasaï Oriental', chefLieu: 'Mbuji-Mayi', sousDivisions: 6 },
  // Kwango (2)
  { nom: 'Kwango 1', provinceAdministrative: 'Kwango', chefLieu: 'Kenge', sousDivisions: 5 },
  { nom: 'Kwango 2', provinceAdministrative: 'Kwango', chefLieu: 'Popokabaka', sousDivisions: 4 },
  // Kwilu (3)
  { nom: 'Kwilu 1', provinceAdministrative: 'Kwilu', chefLieu: 'Bandundu', sousDivisions: 8 },
  { nom: 'Kwilu 2', provinceAdministrative: 'Kwilu', chefLieu: 'Kikwit', sousDivisions: 10 },
  { nom: 'Kwilu 3', provinceAdministrative: 'Kwilu', chefLieu: 'Bulungu', sousDivisions: 6 },
  // Lomami (2)
  { nom: 'Lomami 1', provinceAdministrative: 'Lomami', chefLieu: 'Kabinda', sousDivisions: 5 },
  { nom: 'Lomami 2', provinceAdministrative: 'Lomami', chefLieu: 'Ngandajika', sousDivisions: 4 },
  // Lualaba (2)
  { nom: 'Lualaba 1', provinceAdministrative: 'Lualaba', chefLieu: 'Kolwezi', sousDivisions: 6 },
  { nom: 'Lualaba 2', provinceAdministrative: 'Lualaba', chefLieu: 'Likasi', sousDivisions: 4 },
  // Mai-Ndombe (3)
  { nom: 'Mai-Ndombe 1', provinceAdministrative: 'Mai-Ndombe', chefLieu: 'Inongo', sousDivisions: 6 },
  { nom: 'Mai-Ndombe 2', provinceAdministrative: 'Mai-Ndombe', chefLieu: 'Oshwe', sousDivisions: 5 },
  { nom: 'Mai-Ndombe 3', provinceAdministrative: 'Mai-Ndombe', chefLieu: 'Kwamouth', sousDivisions: 4 },
  // Maniema (2)
  { nom: 'Maniema 1', provinceAdministrative: 'Maniema', chefLieu: 'Kindu', sousDivisions: 6 },
  { nom: 'Maniema 2', provinceAdministrative: 'Maniema', chefLieu: 'Kasongo', sousDivisions: 5 },
  // Mongala (2)
  { nom: 'Mongala 1', provinceAdministrative: 'Mongala', chefLieu: 'Lisala', sousDivisions: 5 },
  { nom: 'Mongala 2', provinceAdministrative: 'Mongala', chefLieu: 'Bumba', sousDivisions: 4 },
  // Nord-Kivu (3)
  { nom: 'Nord-Kivu 1', provinceAdministrative: 'Nord-Kivu', chefLieu: 'Goma', sousDivisions: 8 },
  { nom: 'Nord-Kivu 2', provinceAdministrative: 'Nord-Kivu', chefLieu: 'Beni', sousDivisions: 6 },
  { nom: 'Nord-Kivu 3', provinceAdministrative: 'Nord-Kivu', chefLieu: 'Masisi', sousDivisions: 5 },
  // Nord-Ubangi (2)
  { nom: 'Nord-Ubangi 1', provinceAdministrative: 'Nord-Ubangi', chefLieu: 'Gbadolite', sousDivisions: 5 },
  { nom: 'Nord-Ubangi 2', provinceAdministrative: 'Nord-Ubangi', chefLieu: 'Yakoma', sousDivisions: 4 },
  // Sankuru (2)
  { nom: 'Sankuru 1', provinceAdministrative: 'Sankuru', chefLieu: 'Lusambo', sousDivisions: 6 },
  { nom: 'Sankuru 2', provinceAdministrative: 'Sankuru', chefLieu: 'Lodja', sousDivisions: 5 },
  // Sud-Kivu (3)
  { nom: 'Sud-Kivu 1', provinceAdministrative: 'Sud-Kivu', chefLieu: 'Bukavu', sousDivisions: 8 },
  { nom: 'Sud-Kivu 2', provinceAdministrative: 'Sud-Kivu', chefLieu: 'Uvira', sousDivisions: 6 },
  { nom: 'Sud-Kivu 3', provinceAdministrative: 'Sud-Kivu', chefLieu: 'Shabunda', sousDivisions: 5 },
  // Sud-Ubangi (2)
  { nom: 'Sud-Ubangi 1', provinceAdministrative: 'Sud-Ubangi', chefLieu: 'Gemena', sousDivisions: 5 },
  { nom: 'Sud-Ubangi 2', provinceAdministrative: 'Sud-Ubangi', chefLieu: 'Libenge', sousDivisions: 4 },
  // Tanganyika (2)
  { nom: 'Tanganyika 1', provinceAdministrative: 'Tanganyika', chefLieu: 'Kalemie', sousDivisions: 6 },
  { nom: 'Tanganyika 2', provinceAdministrative: 'Tanganyika', chefLieu: 'Kabalo', sousDivisions: 4 },
  // Tshopo (2)
  { nom: 'Tshopo 1', provinceAdministrative: 'Tshopo', chefLieu: 'Kisangani', sousDivisions: 8 },
  { nom: 'Tshopo 2', provinceAdministrative: 'Tshopo', chefLieu: 'Isangi', sousDivisions: 5 },
  // Tshuapa (2)
  { nom: 'Tshuapa 1', provinceAdministrative: 'Tshuapa', chefLieu: 'Boende', sousDivisions: 6 },
  { nom: 'Tshuapa 2', provinceAdministrative: 'Tshuapa', chefLieu: 'Bokungu', sousDivisions: 4 },
];

/** Liste simple des noms de provinces éducationnelles pour les listes déroulantes. */
export const PROVINCE_EDUCATIONNELLE_NAMES = PROVINCES_EDUCATIONNELLES.map((p) => p.nom);

/** Provinces éducationnelles regroupées par province administrative. */
export const PROVINCES_EDUC_BY_ADMIN: Record<string, ProvinceEducationnelle[]> = PROVINCES_EDUCATIONNELLES.reduce(
  (acc, pe) => {
    if (!acc[pe.provinceAdministrative]) acc[pe.provinceAdministrative] = [];
    acc[pe.provinceAdministrative].push(pe);
    return acc;
  },
  {} as Record<string, ProvinceEducationnelle[]>,
);
