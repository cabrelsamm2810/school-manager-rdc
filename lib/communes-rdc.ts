/**
 * Communes de la RDC regroupées par province éducationnelle.
 *
 * Source : découpage territorial officiel (EPST / SESCOEP).
 * Pour Kinshasa, les 24 communes sont réparties across les 5 provinces
 * éducationnelles. Pour les autres provinces, les principaux territoires
 * et communes du chef-lieu sont listés par province éducationnelle.
 *
 * Utilisé par le formulaire d'inscription d'école pour filtrer la commune
 * en cascade : Province → Province éduc. → Commune.
 */

export const COMMUNES_BY_PROVINCE_EDUC: Record<string, string[]> = {
  // ── Kinshasa (24 communes, 5 provinces éduc.) ──
  'Kinshasa Lukunga': ['Gombe', 'Barumbu', 'Kinshasa', 'Kintambo', 'Lingwala', 'Bandalungwa', 'Bokela'],
  'Kinshasa Funa': ['Bumbu', 'Kalamu', 'Kasa-Vubu', 'Ngiri-Ngiri', 'Selembao', 'Makala'],
  'Kinshasa Mont-Amba': ['Lemba', 'Limete', 'Ngaba', 'Matete'],
  'Kinshasa Tshangu': ['Kimbanseke', 'Masina', 'Ndjili', 'Nsele'],
  'Kinshasa Plateau': ['Mont-Ngafula', 'Ngaliema', 'Ndilo'],

  // ── Kongo Central (3 provinces éduc.) ──
  'Kongo Central 1': ['Matadi', 'Mvuzi', 'Songololo', 'Mbanza-Ngungu'],
  'Kongo Central 2': ['Boma', 'Moanda', 'Muanda'],
  'Kongo Central 3': ['Lukula', 'Seke-Banza', 'Tshela'],

  // ── Kasaï (2) ──
  'Kasaï 1': ['Tshikapa', 'Kamuesha', 'Mbuji-Mayi'],
  'Kasaï 2': ['Luebo', 'Dibaya', 'Ilebo'],

  // ── Kasaï-Central (2) ──
  'Kasaï-Central 1': ['Kananga', 'Nganza', 'Tshibala'],
  'Kasaï-Central 2': ['Tshikapa', 'Dimbelenge', 'Luiza'],

  // ── Kasaï-Oriental (2) ──
  'Kasaï-Oriental 1': ['Mbuji-Mayi', 'Diulu', 'Kanshi'],
  'Kasaï-Oriental 2': ['Mbuji-Mayi', 'Miabi', 'Kabeya-Kamwanga'],

  // ── Lomami (2) ──
  'Lomami 1': ['Kabinda', 'Tshofa', 'Lubao'],
  'Lomami 2': ['Ngandajika', 'Luputa', 'Lubao'],

  // ── Sankuru (2) ──
  'Sankuru 1': ['Lusambo', 'Lodja', 'Lubefu'],
  'Sankuru 2': ['Lodja', 'Katako-Kombe', 'Lubefu'],

  // ── Maniema (2) ──
  'Maniema 1': ['Kindu', 'Kasongo', 'Kabambare'],
  'Maniema 2': ['Kasongo', 'Kabambare', 'Pangi'],

  // ── Sud-Kivu (3) ──
  'Sud-Kivu 1': ['Bukavu', 'Ibanda', 'Kadutu', 'Bagira'],
  'Sud-Kivu 2': ['Uvira', 'Fizi', 'Nundu'],
  'Sud-Kivu 3': ['Shabunda', 'Mwenga', 'Kalehe'],

  // ── Nord-Kivu (3) ──
  'Nord-Kivu 1': ['Goma', 'Karisimbi', 'Nyiragongo'],
  'Nord-Kivu 2': ['Beni', 'Lubero', 'Butembo'],
  'Nord-Kivu 3': ['Masisi', 'Rutshuru', 'Walikale'],

  // ── Ituri (3) ──
  'Ituri 1': ['Bunia', 'Mahagi', 'Aru'],
  'Ituri 2': ['Irumu', 'Mambasa', 'Bunia'],
  'Ituri 3': ['Aru', 'Djugu', 'Mahagi'],

  // ── Haut-Uélé (2) ──
  'Haut-Uélé 1': ['Isiro', 'Rungu', 'Wamba'],
  'Haut-Uélé 2': ['Watsa', 'Niangara', 'Faradje'],

  // ── Bas-Uélé (1) ──
  'Bas-Uélé': ['Buta', 'Aketi', 'Bondo', 'Ango'],

  // ── Équateur (2) ──
  'Équateur 1': ['Mbandaka', 'Wangata', 'Bikoro'],
  'Équateur 2': ['Basankusu', 'Bolomba', 'Lukolela'],

  // ── Tshopo (2) ──
  'Tshopo 1': ['Kisangani', 'Ubundu', 'Yangambi'],
  'Tshopo 2': ['Isangi', 'Bafwasende', 'Banalia'],

  // ── Mongala (2) ──
  'Mongala 1': ['Lisala', 'Bumba', 'Bongandanga'],
  'Mongala 2': ['Bumba', 'Aketi', 'Yakoma'],

  // ── Nord-Ubangi (2) ──
  'Nord-Ubangi 1': ['Gbadolite', 'Yakoma', 'Bosobolo'],
  'Nord-Ubangi 2': ['Yakoma', 'Libenge', 'Kungu'],

  // ── Sud-Ubangi (2) ──
  'Sud-Ubangi 1': ['Gemena', 'Budjala', 'Kungu'],
  'Sud-Ubangi 2': ['Libenge', 'Businga', 'Bosobolo'],

  // ── Tshuapa (2) ──
  'Tshuapa 1': ['Boende', 'Bokungu', 'Djolu'],
  'Tshuapa 2': ['Bokungu', 'Ikela', 'Monkoto'],

  // ── Haut-Lomami (2) ──
  'Haut-Lomami 1': ['Kamina', 'Bukama', 'Kabongo'],
  'Haut-Lomami 2': ['Bukama', 'Kabongo', 'Malemba-Nkulu'],

  // ── Lualaba (2) ──
  'Lualaba 1': ['Kolwezi', 'Manika', 'Dilolo'],
  'Lualaba 2': ['Likasi', 'Kapanga', 'Sandoa'],

  // ── Haut-Katanga (2) ──
  'Haut-Katanga 1': ['Lubumbashi', 'Kampemba', 'Katuba', 'Lubumbashi'],
  'Haut-Katanga 2': ['Pweto', 'Sakania', 'Kipushi'],

  // ── Tanganyika (2) ──
  'Tanganyika 1': ['Kalemie', 'Nyunzu', 'Kabalo'],
  'Tanganyika 2': ['Kabalo', 'Manono', 'Moba'],

  // ── Kwango (2) ──
  'Kwango 1': ['Kenge', 'Popokabaka', 'Kahemba'],
  'Kwango 2': ['Popokabaka', 'Kahemba', 'Feshi'],

  // ── Kwilu (3) ──
  'Kwilu 1': ['Bandundu', 'Bagata', 'Bulungu'],
  'Kwilu 2': ['Kikwit', 'Bandundu', 'Idiofa'],
  'Kwilu 3': ['Bulungu', 'Masimanimba', 'Niokolo'],

  // ── Mai-Ndombe (3) ──
  'Mai-Ndombe 1': ['Inongo', 'Kiri', 'Oshwe'],
  'Mai-Ndombe 2': ['Oshwe', 'Kutu', 'Bolobo'],
  'Mai-Ndombe 3': ['Kwamouth', 'Bolobo', 'Inongo'],
};

/**
 * Retourne la liste des communes pour une province éducationnelle donnée.
 * Retourne un tableau vide si aucune commune n'est enregistrée pour cette province.
 */
export function getCommunesForProvinceEduc(provinceEduc: string): string[] {
  return COMMUNES_BY_PROVINCE_EDUC[provinceEduc] ?? [];
}
