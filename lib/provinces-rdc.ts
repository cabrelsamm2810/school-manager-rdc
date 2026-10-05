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
