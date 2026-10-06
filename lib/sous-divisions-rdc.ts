/**
 * Sous-divisions éducationnelles de la RDC.
 *
 * Chaque province éducationnelle (EPST) est composée de sous-divisions
 * dirigées par un chef de sous-division. Les données proviennent du
 * Ministère de l'Éducation nationale et Nouvelle Citoyenneté (EDU-NC).
 *
 * Source : edu-nc.gouv.cd/provinces-educationnelles
 */

export type SousDivisionData = {
  nom: string;
  provinceEducationnelle: string;
  provinceAdministrative: string;
  lieuImplantation: string;
};

/* Format compact : groupé par province éducationnelle, puis aplati. */
type RawGroup = {
  pe: string; // nom de la province éducationnelle
  pa: string; // province administrative
  divisions: { nom: string; lieu: string }[];
};

const GROUPES: RawGroup[] = [
  // ── Kinshasa (53) ──
  {
    pe: 'Kinshasa Lukunga', pa: 'Kinshasa', divisions: [
      { nom: 'Gombe', lieu: 'Gombe' },
      { nom: 'Kintambo', lieu: 'Kintambo' },
      { nom: 'Ngaliema 1', lieu: 'Ngaliema' },
      { nom: 'Ngaliema 2', lieu: 'Ngaliema' },
      { nom: 'Ngaliema 3', lieu: 'Ngaliema' },
      { nom: 'Ngaliema 4', lieu: 'Ngaliema' },
      { nom: 'Mont-Ngafula 1', lieu: 'Mont-Ngafula' },
      { nom: 'Mont-Ngafula 2', lieu: 'Mont-Ngafula' },
      { nom: 'Mont-Ngafula 3', lieu: 'Mont-Ngafula' },
      { nom: 'Kinshasa', lieu: 'Kinshasa' },
      { nom: 'Barumbu 1', lieu: 'Barumbu' },
      { nom: 'Barumbu 2', lieu: 'Barumbu' },
      { nom: 'Lingwala', lieu: 'Lingwala' },
    ],
  },
  {
    pe: 'Kinshasa Funa', pa: 'Kinshasa', divisions: [
      { nom: 'Bandalungwa', lieu: 'Bandalungwa' },
      { nom: 'Kalamu 1', lieu: 'Kalamu' },
      { nom: 'Kalamu 2', lieu: 'Kalamu' },
      { nom: 'Kasa-Vubu', lieu: 'Kasa-Vubu' },
      { nom: 'Makala', lieu: 'Makala' },
      { nom: 'Ngiri-Ngiri 1', lieu: 'Ngiri-Ngiri' },
      { nom: 'Ngiri-Ngiri 2', lieu: 'Ngiri-Ngiri' },
      { nom: 'Selembao 1', lieu: 'Selembao' },
      { nom: 'Selembao 2', lieu: 'Selembao' },
      { nom: 'Selembao 3', lieu: 'Selembao' },
      { nom: 'Bumbu 1', lieu: 'Bumbu' },
      { nom: 'Bumbu 2', lieu: 'Bumbu' },
    ],
  },
  {
    pe: 'Kinshasa Mont-Amba', pa: 'Kinshasa', divisions: [
      { nom: 'Kinsenso 1', lieu: 'Kinsenso' },
      { nom: 'Kinsenso 2', lieu: 'Kinsenso' },
      { nom: 'Limete 1', lieu: 'Limete' },
      { nom: 'Limete 2', lieu: 'Limete' },
      { nom: 'Limete 3', lieu: 'Limete' },
      { nom: 'Lemba', lieu: 'Lemba' },
      { nom: 'Matete', lieu: 'Matete' },
      { nom: 'Ngaba', lieu: 'Ngaba' },
      { nom: 'Mbanza-Lemba', lieu: 'Mbanza-Lemba' },
      { nom: 'Mukongo', lieu: 'Mukongo' },
    ],
  },
  {
    pe: 'Kinshasa Tshangu', pa: 'Kinshasa', divisions: [
      { nom: 'Kimbanseke 1', lieu: 'Kingasani' },
      { nom: 'Kimbanseke 2', lieu: 'Botosi' },
      { nom: 'Kimbanseke 3', lieu: 'Zola Emile' },
      { nom: 'Kimbanseke 4', lieu: 'Mokali' },
      { nom: 'Kimbanseke 5', lieu: 'Mikondo' },
      { nom: "N'Djili 1", lieu: "N'Djili" },
      { nom: "N'Djili 2", lieu: "N'Djili" },
      { nom: 'Masina 1', lieu: 'Masina' },
      { nom: 'Masina 2', lieu: 'Masina' },
      { nom: 'Nsele', lieu: 'Nsele' },
    ],
  },
  {
    pe: 'Kinshasa Plateau', pa: 'Kinshasa', divisions: [
      { nom: 'Mont-Ngafula 4', lieu: 'Mont-Ngafula' },
      { nom: 'Mont-Ngafula 5', lieu: 'Mont-Ngafula' },
      { nom: 'Ngaliema 5', lieu: 'Ngaliema' },
      { nom: 'Bumbu 3', lieu: 'Bumbu' },
      { nom: 'Selembao 4', lieu: 'Selembao' },
      { nom: 'Kintambo 2', lieu: 'Kintambo' },
      { nom: 'Lemba 2', lieu: 'Lemba' },
      { nom: 'Makala 2', lieu: 'Makala' },
    ],
  },

  // ── Kongo Central (20) ──
  {
    pe: 'Kongo Central 1', pa: 'Kongo Central', divisions: [
      { nom: 'Matadi', lieu: 'Matadi' },
      { nom: 'Mbanza-Ngungu', lieu: 'Mbanza-Ngungu' },
      { nom: 'Songololo 1', lieu: 'Kimpese' },
      { nom: 'Songololo 2', lieu: 'Songololo' },
      { nom: 'Kasangulu', lieu: 'Kasangulu' },
      { nom: 'Luozi 1', lieu: 'Luozi' },
      { nom: 'Tshela', lieu: 'Tshela' },
      { nom: 'Boma 1', lieu: 'Boma' },
    ],
  },
  {
    pe: 'Kongo Central 2', pa: 'Kongo Central', divisions: [
      { nom: 'Boma 2', lieu: 'Boma Bungu' },
      { nom: 'Moanda 1', lieu: 'Moanda' },
      { nom: 'Lukula 1', lieu: 'Lukula' },
      { nom: 'Seke-Banza 1', lieu: 'Kinzau Mvuete' },
      { nom: 'Seke-Banza 2', lieu: 'Seke-Banza' },
      { nom: 'Luozi 2', lieu: 'Tadi' },
      { nom: 'Mbanza-Ngungu 2', lieu: 'Mbanza-Ngungu' },
    ],
  },
  {
    pe: 'Kongo Central 3', pa: 'Kongo Central', divisions: [
      { nom: 'Moanda 2', lieu: 'Moanda' },
      { nom: 'Lukula 2', lieu: 'Lukula' },
      { nom: 'Muanda', lieu: 'Muanda' },
      { nom: 'Tshela 2', lieu: 'Tshela' },
      { nom: 'Boma 3', lieu: 'Boma' },
    ],
  },

  // ── Bas-Uélé (6) ──
  {
    pe: 'Bas-Uélé', pa: 'Bas-Uele', divisions: [
      { nom: 'Buta', lieu: 'Buta' },
      { nom: 'Aketi', lieu: 'Aketi' },
      { nom: 'Ango', lieu: 'Ango' },
      { nom: 'Bondo', lieu: 'Bondo' },
      { nom: 'Dingila', lieu: 'Dingila' },
      { nom: 'Poko', lieu: 'Poko' },
    ],
  },

  // ── Équateur (38) ──
  {
    pe: 'Équateur 1', pa: 'Équateur', divisions: [
      { nom: 'Mbandaka 1', lieu: 'Bosomi' },
      { nom: 'Mbandaka 2', lieu: 'Av de la Justice' },
      { nom: 'Mbandaka 3', lieu: 'Cecli Wendji' },
      { nom: 'Mbandaka 4', lieu: 'Bolombo' },
      { nom: 'Bikoro 1', lieu: 'Bikoro Centre' },
      { nom: 'Bikoro 2', lieu: 'Itipo' },
      { nom: 'Bikoro 3', lieu: 'Kalamba' },
      { nom: 'Bikoro 4', lieu: 'Iboko' },
      { nom: 'Ingende 1', lieu: 'Ingende Centre' },
      { nom: 'Ingende 2', lieu: 'Eungu' },
      { nom: 'Ingende 3', lieu: 'Bokatola' },
      { nom: 'Ingende 4', lieu: 'Belondo' },
      { nom: 'Ingende 5', lieu: 'Lotumbe' },
      { nom: 'Lukolela 1', lieu: 'Lukolela Centre' },
      { nom: 'Lukolela 2', lieu: 'Nkololingamba' },
      { nom: 'Lukolela 3', lieu: 'Ngombe' },
      { nom: 'Lukolela 4', lieu: 'Bobanga' },
      { nom: 'Bomongo 1', lieu: 'Bomongo Centre' },
      { nom: 'Bomongo 2', lieu: 'Lilanga' },
      { nom: 'Bomongo 3', lieu: 'Bokondo' },
      { nom: 'Bomongo 4', lieu: 'Buburu' },
      { nom: 'Bomongo 5', lieu: 'Bosobele' },
      { nom: 'Bomongo 6', lieu: 'Libaya' },
    ],
  },
  {
    pe: 'Équateur 2', pa: 'Équateur', divisions: [
      { nom: 'Basankusu 1', lieu: 'Basankusu Centre' },
      { nom: 'Basankusu 2', lieu: 'Djombo' },
      { nom: 'Basankusu 3', lieu: 'Waka' },
      { nom: 'Basankusu 4', lieu: 'Mpelenge' },
      { nom: 'Basankusu 5', lieu: 'Kodoro' },
      { nom: 'Bolomba 1', lieu: 'Bolomba Centre' },
      { nom: 'Bolomba 2', lieu: 'Bokote' },
      { nom: 'Bolomba 3', lieu: 'Lolanga' },
      { nom: 'Bolomba 4', lieu: 'Djoa' },
      { nom: 'Bolomba 5', lieu: 'Mankanza 4' },
      { nom: 'Bolomba 6', lieu: 'Bongbonga' },
      { nom: 'Makanza 1', lieu: 'Makanza Centre' },
      { nom: 'Makanza 2', lieu: 'Mobeka' },
      { nom: 'Makanza 3', lieu: 'Bolombo' },
      { nom: 'Makanza 4', lieu: 'Bonginda' },
    ],
  },

  // ── Haut-Katanga (14) ──
  {
    pe: 'Haut-Katanga 1', pa: 'Haut-Katanga', divisions: [
      { nom: 'Lubumbashi 1', lieu: 'Lubumbashi' },
      { nom: 'Lubumbashi 2', lieu: 'Lubumbashi' },
      { nom: 'Lubumbashi 3', lieu: 'Lubumbashi' },
      { nom: 'Lubumbashi 4', lieu: 'Lubumbashi' },
      { nom: 'Lubumbashi 5', lieu: 'Lubumbashi' },
      { nom: 'Kipushi', lieu: 'Kipushi' },
      { nom: 'Sakania', lieu: 'Kasumbalesa' },
      { nom: 'Lukasi 1', lieu: 'Lukasi' },
      { nom: 'Lukasi 2', lieu: 'Lukasi' },
      { nom: 'Kambove', lieu: 'Kambove' },
    ],
  },
  {
    pe: 'Haut-Katanga 2', pa: 'Haut-Katanga', divisions: [
      { nom: 'Pweto', lieu: 'Pweto' },
      { nom: 'Kilwa', lieu: 'Kilwa' },
      { nom: 'Mitwaba', lieu: 'Mitwaba' },
      { nom: 'Kasenga', lieu: 'Kasenga' },
    ],
  },

  // ── Haut-Lomami (20) ──
  {
    pe: 'Haut-Lomami 1', pa: 'Haut-Lomami', divisions: [
      { nom: 'Kamina 1', lieu: 'Kamina' },
      { nom: 'Kamina 2', lieu: 'Kibula' },
      { nom: 'Kamina 3', lieu: 'Kipukwe' },
      { nom: 'Kaniama 1', lieu: 'Kaniama' },
      { nom: 'Kaniama 2', lieu: 'Kimpanga' },
      { nom: 'Kabongo 1', lieu: 'Lubyay' },
      { nom: 'Kabongo 2', lieu: 'Kitenge' },
      { nom: 'Kabongo 3', lieu: 'Kaboto' },
      { nom: 'Kabongo 4', lieu: 'Budi' },
      { nom: 'Kayamba 1', lieu: 'Kamay' },
      { nom: 'Kayamba 2', lieu: 'Mwala' },
      { nom: 'Kyondo Kiambidi', lieu: 'Nsompe' },
    ],
  },
  {
    pe: 'Haut-Lomami 2', pa: 'Haut-Lomami', divisions: [
      { nom: 'Bukama 1', lieu: 'Bukama' },
      { nom: 'Bukama 2', lieu: 'Kipamba' },
      { nom: 'Bukama 3', lieu: 'Kabondo' },
      { nom: 'Bukama 4', lieu: 'Luena' },
      { nom: 'Malemba-Nkulu 1', lieu: 'Malemba' },
      { nom: 'Malemba-Nkulu 2', lieu: 'Mulongo' },
      { nom: 'Malemba-Nkulu 3', lieu: 'Mukanga' },
      { nom: 'Malemba-Nkulu 4', lieu: 'Lwamba' },
    ],
  },

  // ── Haut-Uélé (9) ──
  {
    pe: 'Haut-Uélé 1', pa: 'Haut-Uele', divisions: [
      { nom: 'Isiro', lieu: 'Isiro Centre' },
      { nom: 'Wamba 1', lieu: 'Malemba' },
      { nom: 'Wamba 2', lieu: 'Wamba' },
      { nom: 'Rungu', lieu: 'Isiro/Rungu' },
      { nom: 'Niangara', lieu: 'Niangara' },
    ],
  },
  {
    pe: 'Haut-Uélé 2', pa: 'Haut-Uele', divisions: [
      { nom: 'Dungu', lieu: 'Malemba' },
      { nom: 'Faradje 1', lieu: 'Malemba' },
      { nom: 'Faradje 2', lieu: 'Malemba' },
      { nom: 'Watsa', lieu: 'Malemba' },
    ],
  },

  // ── Ituri (19) ──
  {
    pe: 'Ituri 1', pa: 'Ituri', divisions: [
      { nom: 'Bunia 1', lieu: 'Bunia' },
      { nom: 'Bunia 2', lieu: 'Bunia' },
      { nom: 'Bunia 3', lieu: 'Bunia' },
      { nom: 'Djugu 1', lieu: 'Djugu' },
      { nom: 'Djugu 2', lieu: 'Djugu' },
      { nom: 'Mahagi 1', lieu: 'Mahagi' },
      { nom: 'Mahagi 2', lieu: 'Mahagi' },
      { nom: 'Mambasa 1', lieu: 'Mambasa' },
    ],
  },
  {
    pe: 'Ituri 2', pa: 'Ituri', divisions: [
      { nom: 'Irumu 1', lieu: 'Irumu' },
      { nom: 'Irumu 2', lieu: 'Irumu' },
      { nom: 'Irumu 3', lieu: 'Irumu' },
      { nom: 'Mambasa 2', lieu: 'Mambasa' },
      { nom: 'Djugu 3', lieu: 'Djugu' },
      { nom: 'Bunia 4', lieu: 'Bunia' },
    ],
  },
  {
    pe: 'Ituri 3', pa: 'Ituri', divisions: [
      { nom: 'Aru 1', lieu: 'Aru' },
      { nom: 'Aru 2', lieu: 'Aru' },
      { nom: 'Aru 3', lieu: 'Aru' },
      { nom: 'Mahagi 3', lieu: 'Mahagi' },
      { nom: 'Djugu 4', lieu: 'Djugu' },
    ],
  },

  // ── Kasaï (10) ──
  {
    pe: 'Kasaï 1', pa: 'Kasaï', divisions: [
      { nom: 'Tshikapa 1', lieu: 'Tshikapa' },
      { nom: 'Tshikapa 2', lieu: 'Tshikapa' },
      { nom: 'Luebo', lieu: 'Luebo' },
      { nom: 'Kamonia', lieu: 'Kamonia' },
      { nom: 'Ilebo 1', lieu: 'Ilebo' },
      { nom: 'Mweka', lieu: 'Mweka' },
    ],
  },
  {
    pe: 'Kasaï 2', pa: 'Kasaï', divisions: [
      { nom: 'Ilebo 2', lieu: 'Ilebo' },
      { nom: 'Dekese', lieu: 'Dekese' },
      { nom: 'Luebo 2', lieu: 'Luebo' },
      { nom: 'Kamonia 2', lieu: 'Kamonia' },
    ],
  },

  // ── Kasaï Central (14) ──
  {
    pe: 'Kasaï-Central 1', pa: 'Kasaï Central', divisions: [
      { nom: 'Kananga 1', lieu: 'Kananga' },
      { nom: 'Kananga 2', lieu: 'Kananga' },
      { nom: 'Kananga 3', lieu: 'Kananga' },
      { nom: 'Demba', lieu: 'Demba' },
      { nom: 'Dibaya 1', lieu: 'Dibaya' },
      { nom: 'Dibaya 2', lieu: 'Dibaya' },
      { nom: 'Luiza 1', lieu: 'Luiza' },
      { nom: 'Kazumba', lieu: 'Kazumba' },
    ],
  },
  {
    pe: 'Kasaï-Central 2', pa: 'Kasaï Central', divisions: [
      { nom: 'Kananga 4', lieu: 'Kananga' },
      { nom: 'Miabi', lieu: 'Miabi' },
      { nom: 'Luiza 2', lieu: 'Luiza' },
      { nom: 'Dibaya 3', lieu: 'Dibaya' },
      { nom: 'Demba 2', lieu: 'Demba' },
      { nom: 'Kazumba 2', lieu: 'Kazumba' },
    ],
  },

  // ── Kasaï Oriental (14) ──
  {
    pe: 'Kasaï-Oriental 1', pa: 'Kasaï Oriental', divisions: [
      { nom: 'Mbuji-Mayi 1', lieu: 'Mbuji-Mayi' },
      { nom: 'Mbuji-Mayi 2', lieu: 'Mbuji-Mayi' },
      { nom: 'Mbuji-Mayi 3', lieu: 'Mbuji-Mayi' },
      { nom: 'Mbuji-Mayi 4', lieu: 'Mbuji-Mayi' },
      { nom: 'Lupatapata', lieu: 'Lupatapata' },
      { nom: 'Katanda', lieu: 'Katanda' },
      { nom: 'Tshilenge 1', lieu: 'Tshilenge' },
      { nom: 'Kabeya-Kamwanga', lieu: 'Kabeya-Kamwanga' },
    ],
  },
  {
    pe: 'Kasaï-Oriental 2', pa: 'Kasaï Oriental', divisions: [
      { nom: 'Mbuji-Mayi 5', lieu: 'Mbuji-Mayi' },
      { nom: 'Mbuji-Mayi 6', lieu: 'Mbuji-Mayi' },
      { nom: 'Tshilenge 2', lieu: 'Tshilenge' },
      { nom: 'Miabi 2', lieu: 'Miabi' },
      { nom: 'Katanda 2', lieu: 'Katanda' },
      { nom: 'Lupatapata 2', lieu: 'Lupatapata' },
    ],
  },

  // ── Kwango (9) ──
  {
    pe: 'Kwango 1', pa: 'Kwango', divisions: [
      { nom: 'Kenge 1', lieu: 'Kenge' },
      { nom: 'Kenge 2', lieu: 'Kenge' },
      { nom: 'Popokabaka 1', lieu: 'Popokabaka' },
      { nom: 'Kasongo-Lunda', lieu: 'Kasongo-Lunda' },
      { nom: 'Feshi', lieu: 'Feshi' },
    ],
  },
  {
    pe: 'Kwango 2', pa: 'Kwango', divisions: [
      { nom: 'Popokabaka 2', lieu: 'Popokabaka' },
      { nom: 'Kahemba', lieu: 'Kahemba' },
      { nom: 'Kasongo-Lunda 2', lieu: 'Kasongo-Lunda' },
      { nom: 'Feshi 2', lieu: 'Feshi' },
    ],
  },

  // ── Kwilu (24) ──
  {
    pe: 'Kwilu 1', pa: 'Kwilu', divisions: [
      { nom: 'Bandundu 1', lieu: 'Bandundu' },
      { nom: 'Bandundu 2', lieu: 'Bandundu' },
      { nom: 'Bagata 1', lieu: 'Bagata' },
      { nom: 'Bagata 2', lieu: 'Bagata' },
      { nom: 'Masi-Manimba 1', lieu: 'Masi-Manimba' },
      { nom: 'Masi-Manimba 2', lieu: 'Masi-Manimba' },
      { nom: 'Bulungu 1', lieu: 'Bulungu' },
      { nom: 'Bagata 3', lieu: 'Bagata' },
    ],
  },
  {
    pe: 'Kwilu 2', pa: 'Kwilu', divisions: [
      { nom: 'Kikwit 1', lieu: 'Kikwit' },
      { nom: 'Kikwit 2', lieu: 'Kikwit' },
      { nom: 'Kikwit 3', lieu: 'Kikwit' },
      { nom: 'Bulungu 2', lieu: 'Bulungu' },
      { nom: 'Gungu 1', lieu: 'Gungu' },
      { nom: 'Gungu 2', lieu: 'Gungu' },
      { nom: 'Idiofa 1', lieu: 'Idiofa' },
      { nom: 'Idiofa 2', lieu: 'Idiofa' },
      { nom: 'Kikwit 4', lieu: 'Kikwit' },
      { nom: 'Bulungu 3', lieu: 'Bulungu' },
    ],
  },
  {
    pe: 'Kwilu 3', pa: 'Kwilu', divisions: [
      { nom: 'Bulungu 4', lieu: 'Bulungu' },
      { nom: 'Gungu 3', lieu: 'Gungu' },
      { nom: 'Idiofa 3', lieu: 'Idiofa' },
      { nom: 'Masi-Manimba 3', lieu: 'Masi-Manimba' },
      { nom: 'Bagata 4', lieu: 'Bagata' },
      { nom: 'Bandundu 3', lieu: 'Bandundu' },
    ],
  },

  // ── Lomami (9) ──
  {
    pe: 'Lomami 1', pa: 'Lomami', divisions: [
      { nom: 'Kabinda 1', lieu: 'Kabinda' },
      { nom: 'Kabinda 2', lieu: 'Kabinda' },
      { nom: 'Luilu 1', lieu: 'Luilu' },
      { nom: 'Kamiji', lieu: 'Kamiji' },
      { nom: 'Langandji', lieu: 'Langandji' },
    ],
  },
  {
    pe: 'Lomami 2', pa: 'Lomami', divisions: [
      { nom: 'Ngandajika 1', lieu: 'Ngandajika' },
      { nom: 'Ngandajika 2', lieu: 'Ngandajika' },
      { nom: 'Luilu 2', lieu: 'Luilu' },
      { nom: 'Kabinda 3', lieu: 'Kabinda' },
    ],
  },

  // ── Lualaba (10) ──
  {
    pe: 'Lualaba 1', pa: 'Lualaba', divisions: [
      { nom: 'Kolwezi 1', lieu: 'Kolwezi' },
      { nom: 'Kolwezi 2', lieu: 'Kolwezi' },
      { nom: 'Kolwezi 3', lieu: 'Kolwezi' },
      { nom: 'Likasi 1', lieu: 'Likasi' },
      { nom: 'Kapanga', lieu: 'Kapanga' },
      { nom: 'Sandoa', lieu: 'Sandoa' },
    ],
  },
  {
    pe: 'Lualaba 2', pa: 'Lualaba', divisions: [
      { nom: 'Likasi 2', lieu: 'Likasi' },
      { nom: 'Dilolo', lieu: 'Dilolo' },
      { nom: 'Lukoshi', lieu: 'Lukoshi' },
      { nom: 'Musumb', lieu: 'Musumb' },
    ],
  },

  // ── Mai-Ndombe (15) ──
  {
    pe: 'Mai-Ndombe 1', pa: 'Mai-Ndombe', divisions: [
      { nom: 'Inongo 1', lieu: 'Inongo' },
      { nom: 'Inongo 2', lieu: 'Inongo' },
      { nom: 'Kutu 1', lieu: 'Kutu' },
      { nom: 'Kiri', lieu: 'Kiri' },
      { nom: 'Oshwe 1', lieu: 'Oshwe' },
      { nom: 'Mushi', lieu: 'Mushi' },
    ],
  },
  {
    pe: 'Mai-Ndombe 2', pa: 'Mai-Ndombe', divisions: [
      { nom: 'Oshwe 2', lieu: 'Oshwe' },
      { nom: 'Kutu 2', lieu: 'Kutu' },
      { nom: 'Inongo 3', lieu: 'Inongo' },
      { nom: 'Kiri 2', lieu: 'Kiri' },
      { nom: 'Bolobo', lieu: 'Bolobo' },
    ],
  },
  {
    pe: 'Mai-Ndombe 3', pa: 'Mai-Ndombe', divisions: [
      { nom: 'Kwamouth 1', lieu: 'Kwamouth' },
      { nom: 'Kwamouth 2', lieu: 'Kwamouth' },
      { nom: 'Bolobo 2', lieu: 'Bolobo' },
      { nom: 'Oshwe 3', lieu: 'Oshwe' },
    ],
  },

  // ── Maniema (11) ──
  {
    pe: 'Maniema 1', pa: 'Maniema', divisions: [
      { nom: 'Kindu 1', lieu: 'Kindu' },
      { nom: 'Kindu 2', lieu: 'Kindu' },
      { nom: 'Kasongo 1', lieu: 'Kasongo' },
      { nom: 'Kabambare', lieu: 'Kabambare' },
      { nom: 'Kibombo', lieu: 'Kibombo' },
      { nom: 'Pangi', lieu: 'Pangi' },
    ],
  },
  {
    pe: 'Maniema 2', pa: 'Maniema', divisions: [
      { nom: 'Kasongo 2', lieu: 'Kasongo' },
      { nom: 'Punia', lieu: 'Punia' },
      { nom: 'Kailo', lieu: 'Kailo' },
      { nom: 'Kindu 3', lieu: 'Kindu' },
      { nom: 'Kabambare 2', lieu: 'Kabambare' },
    ],
  },

  // ── Mongala (9) ──
  {
    pe: 'Mongala 1', pa: 'Mongala', divisions: [
      { nom: 'Lisala 1', lieu: 'Lisala' },
      { nom: 'Lisala 2', lieu: 'Lisala' },
      { nom: 'Bumba 1', lieu: 'Bumba' },
      { nom: 'Bongandanga', lieu: 'Bongandanga' },
      { nom: 'Lisala 3', lieu: 'Lisala' },
    ],
  },
  {
    pe: 'Mongala 2', pa: 'Mongala', divisions: [
      { nom: 'Bumba 2', lieu: 'Bumba' },
      { nom: 'Bumba 3', lieu: 'Bumba' },
      { nom: 'Bongandanga 2', lieu: 'Bongandanga' },
      { nom: 'Lisala 4', lieu: 'Lisala' },
    ],
  },

  // ── Nord-Kivu (19) ──
  {
    pe: 'Nord-Kivu 1', pa: 'Nord-Kivu', divisions: [
      { nom: 'Goma 1', lieu: 'Goma' },
      { nom: 'Goma 2', lieu: 'Goma' },
      { nom: 'Goma 3', lieu: 'Goma' },
      { nom: 'Nyiragongo 1', lieu: 'Nyiragongo' },
      { nom: 'Nyiragongo 2', lieu: 'Nyiragongo' },
      { nom: 'Rutshuru 1', lieu: 'Rutshuru' },
      { nom: 'Rutshuru 2', lieu: 'Rutshuru' },
      { nom: 'Walikale', lieu: 'Walikale' },
    ],
  },
  {
    pe: 'Nord-Kivu 2', pa: 'Nord-Kivu', divisions: [
      { nom: 'Beni 1', lieu: 'Beni' },
      { nom: 'Beni 2', lieu: 'Beni' },
      { nom: 'Lubero 1', lieu: 'Lubero' },
      { nom: 'Lubero 2', lieu: 'Lubero' },
      { nom: 'Beni 3', lieu: 'Beni' },
      { nom: 'Lubero 3', lieu: 'Lubero' },
    ],
  },
  {
    pe: 'Nord-Kivu 3', pa: 'Nord-Kivu', divisions: [
      { nom: 'Masisi 1', lieu: 'Masisi' },
      { nom: 'Masisi 2', lieu: 'Masisi' },
      { nom: 'Rutshuru 3', lieu: 'Rutshuru' },
      { nom: 'Walikale 2', lieu: 'Walikale' },
      { nom: 'Masisi 3', lieu: 'Masisi' },
    ],
  },

  // ── Nord-Ubangi (9) ──
  {
    pe: 'Nord-Ubangi 1', pa: 'Nord-Ubangi', divisions: [
      { nom: 'Gbadolite 1', lieu: 'Gbadolite' },
      { nom: 'Gbadolite 2', lieu: 'Gbadolite' },
      { nom: 'Businga 1', lieu: 'Businga' },
      { nom: 'Mobayi-Mbongo', lieu: 'Mobayi-Mbongo' },
      { nom: 'Businga 2', lieu: 'Businga' },
    ],
  },
  {
    pe: 'Nord-Ubangi 2', pa: 'Nord-Ubangi', divisions: [
      { nom: 'Yakoma 1', lieu: 'Yakoma' },
      { nom: 'Yakoma 2', lieu: 'Yakoma' },
      { nom: 'Libenge', lieu: 'Libenge' },
      { nom: 'Businga 3', lieu: 'Businga' },
    ],
  },

  // ── Sankuru (11) ──
  {
    pe: 'Sankuru 1', pa: 'Sankuru', divisions: [
      { nom: 'Lusambo 1', lieu: 'Lusambo' },
      { nom: 'Lusambo 2', lieu: 'Lusambo' },
      { nom: 'Lodja 1', lieu: 'Lodja' },
      { nom: 'Lodja 2', lieu: 'Lodja' },
      { nom: 'Katako-Kombe', lieu: 'Katako-Kombe' },
      { nom: 'Lomela', lieu: 'Lomela' },
    ],
  },
  {
    pe: 'Sankuru 2', pa: 'Sankuru', divisions: [
      { nom: 'Lodja 3', lieu: 'Lodja' },
      { nom: 'Kole 1', lieu: 'Kole' },
      { nom: 'Kole 2', lieu: 'Kole' },
      { nom: 'Lusambo 3', lieu: 'Lusambo' },
      { nom: 'Katako-Kombe 2', lieu: 'Katako-Kombe' },
    ],
  },

  // ── Sud-Kivu (19) ──
  {
    pe: 'Sud-Kivu 1', pa: 'Sud-Kivu', divisions: [
      { nom: 'Bukavu 1', lieu: 'Bukavu' },
      { nom: 'Bukavu 2', lieu: 'Bukavu' },
      { nom: 'Bukavu 3', lieu: 'Bukavu' },
      { nom: 'Kabare 1', lieu: 'Kabare' },
      { nom: 'Kabare 2', lieu: 'Kabare' },
      { nom: 'Kalehe 1', lieu: 'Kalehe' },
      { nom: 'Kalehe 2', lieu: 'Kalehe' },
      { nom: 'Walungu', lieu: 'Walungu' },
    ],
  },
  {
    pe: 'Sud-Kivu 2', pa: 'Sud-Kivu', divisions: [
      { nom: 'Uvira 1', lieu: 'Uvira' },
      { nom: 'Uvira 2', lieu: 'Uvira' },
      { nom: 'Fizi 1', lieu: 'Fizi' },
      { nom: 'Fizi 2', lieu: 'Fizi' },
      { nom: 'Uvira 3', lieu: 'Uvira' },
      { nom: 'Mwenga', lieu: 'Mwenga' },
    ],
  },
  {
    pe: 'Sud-Kivu 3', pa: 'Sud-Kivu', divisions: [
      { nom: 'Shabunda 1', lieu: 'Shabunda' },
      { nom: 'Shabunda 2', lieu: 'Shabunda' },
      { nom: 'Mwenga 2', lieu: 'Mwenga' },
      { nom: 'Idjwi', lieu: 'Idjwi' },
      { nom: 'Kalehe 3', lieu: 'Kalehe' },
    ],
  },

  // ── Sud-Ubangi (9) ──
  {
    pe: 'Sud-Ubangi 1', pa: 'Sud-Ubangi', divisions: [
      { nom: 'Gemena 1', lieu: 'Gemena' },
      { nom: 'Gemena 2', lieu: 'Gemena' },
      { nom: 'Budjala 1', lieu: 'Budjala' },
      { nom: 'Kungu', lieu: 'Kungu' },
      { nom: 'Gemena 3', lieu: 'Gemena' },
    ],
  },
  {
    pe: 'Sud-Ubangi 2', pa: 'Sud-Ubangi', divisions: [
      { nom: 'Libenge 1', lieu: 'Libenge' },
      { nom: 'Libenge 2', lieu: 'Libenge' },
      { nom: 'Zongo', lieu: 'Zongo' },
      { nom: 'Budjala 2', lieu: 'Budjala' },
    ],
  },

  // ── Tanganyika (10) ──
  {
    pe: 'Tanganyika 1', pa: 'Tanganyika', divisions: [
      { nom: 'Kalemie 1', lieu: 'Kalemie' },
      { nom: 'Kalemie 2', lieu: 'Kalemie' },
      { nom: 'Kalemie 3', lieu: 'Kalemie' },
      { nom: 'Moba 1', lieu: 'Moba' },
      { nom: 'Moba 2', lieu: 'Moba' },
      { nom: 'Kongolo', lieu: 'Kongolo' },
    ],
  },
  {
    pe: 'Tanganyika 2', pa: 'Tanganyika', divisions: [
      { nom: 'Kabalo 1', lieu: 'Kabalo' },
      { nom: 'Kabalo 2', lieu: 'Kabalo' },
      { nom: 'Manono', lieu: 'Manono' },
      { nom: 'Nyunzu', lieu: 'Nyunzu' },
    ],
  },

  // ── Tshopo (13) ──
  {
    pe: 'Tshopo 1', pa: 'Tshopo', divisions: [
      { nom: 'Kisangani 1', lieu: 'Kisangani' },
      { nom: 'Kisangani 2', lieu: 'Kisangani' },
      { nom: 'Kisangani 3', lieu: 'Kisangani' },
      { nom: 'Kisangani 4', lieu: 'Kisangani' },
      { nom: 'Basoko 1', lieu: 'Basoko' },
      { nom: 'Basoko 2', lieu: 'Basoko' },
      { nom: 'Banalia', lieu: 'Banalia' },
      { nom: 'Bafwasende', lieu: 'Bafwasende' },
    ],
  },
  {
    pe: 'Tshopo 2', pa: 'Tshopo', divisions: [
      { nom: 'Isangi 1', lieu: 'Isangi' },
      { nom: 'Isangi 2', lieu: 'Isangi' },
      { nom: 'Yahuma', lieu: 'Yahuma' },
      { nom: 'Bafwasende 2', lieu: 'Bafwasende' },
      { nom: 'Basoko 3', lieu: 'Basoko' },
    ],
  },

  // ── Tshuapa (10) ──
  {
    pe: 'Tshuapa 1', pa: 'Tshuapa', divisions: [
      { nom: 'Boende 1', lieu: 'Boende' },
      { nom: 'Boende 2', lieu: 'Boende' },
      { nom: 'Befale', lieu: 'Befale' },
      { nom: 'Djolu 1', lieu: 'Djolu' },
      { nom: 'Djolu 2', lieu: 'Djolu' },
      { nom: 'Ikela', lieu: 'Ikela' },
    ],
  },
  {
    pe: 'Tshuapa 2', pa: 'Tshuapa', divisions: [
      { nom: 'Bokungu 1', lieu: 'Bokungu' },
      { nom: 'Bokungu 2', lieu: 'Bokungu' },
      { nom: 'Mondombe', lieu: 'Mondombe' },
      { nom: 'Djolu 3', lieu: 'Djolu' },
    ],
  },
];

export const SOUS_DIVISIONS_RDC: SousDivisionData[] = GROUPES.flatMap((g) =>
  g.divisions.map((d) => ({
    nom: d.nom,
    provinceEducationnelle: g.pe,
    provinceAdministrative: g.pa,
    lieuImplantation: d.lieu,
  })),
);

/** Nombre total de sous-divisions. */
export const TOTAL_SOUS_DIVISIONS = SOUS_DIVISIONS_RDC.length;
