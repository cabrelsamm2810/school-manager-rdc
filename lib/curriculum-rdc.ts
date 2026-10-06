/**
 * Curriculum officiel de la RDC — Ministère de l'Éducation Nationale et
 * Nouvelle Citoyenneté (MINEDU-NC, anciennement EPST/MEPST).
 *
 * Source : edu-nc.gouv.cd/programmes-nationaux + système éducatif RDC.
 *
 * Structure du système éducatif congolais :
 *   1. Maternel / Préscolaire (3 sections)
 *   2. Primaire / Éducation de Base (8 ans : 1ère à 8ème année)
 *      - 1ère à 6ème année = Primaire (CEP en 6ème)
 *      - 7ème et 8ème année = CTEB (Cycle Terminal de l'Éducation de Base, TENASOSP)
 *   3. Secondaire / Humanités (4 ans)
 *      - Filière Générale (Scientifique, Littéraire, Pédagogique)
 *      - Filière Technique
 *      - Diplôme d'État (EXETAT) en 4ème année
 */

export type CycleRdc =
  | 'Maternel'
  | 'Primaire'
  | 'CTEB'
  | 'Secondaire Général'
  | 'Secondaire Technique';

export interface ClasseRdc {
  nom: string;
  cycle: CycleRdc;
  ordre: number;
  diplome: string;
  statut: string;
}

export interface MatiereRdc {
  nom: string;
  cycle: CycleRdc;
  domaine: string;
  coefficient: number;
  statut: string;
}

/* ── Classes (niveaux) du système éducatif RDC ── */

export const CLASSES_RDC: ClasseRdc[] = [
  // Maternel / Préscolaire
  { nom: 'Petite Section', cycle: 'Maternel', ordre: 1, diplome: '', statut: 'Actif' },
  { nom: 'Moyenne Section', cycle: 'Maternel', ordre: 2, diplome: '', statut: 'Actif' },
  { nom: 'Grande Section', cycle: 'Maternel', ordre: 3, diplome: '', statut: 'Actif' },

  // Primaire / Éducation de Base — 1er degré (1ère à 6ème année)
  { nom: '1ère année', cycle: 'Primaire', ordre: 4, diplome: '', statut: 'Actif' },
  { nom: '2ème année', cycle: 'Primaire', ordre: 5, diplome: '', statut: 'Actif' },
  { nom: '3ème année', cycle: 'Primaire', ordre: 6, diplome: '', statut: 'Actif' },
  { nom: '4ème année', cycle: 'Primaire', ordre: 7, diplome: '', statut: 'Actif' },
  { nom: '5ème année', cycle: 'Primaire', ordre: 8, diplome: '', statut: 'Actif' },
  { nom: '6ème année', cycle: 'Primaire', ordre: 9, diplome: 'CEP (Certificat d\'Études Primaires)', statut: 'Actif' },

  // CTEB — Cycle Terminal de l'Éducation de Base (7ème et 8ème année)
  { nom: '7ème année (1ère secondaire)', cycle: 'CTEB', ordre: 10, diplome: '', statut: 'Actif' },
  { nom: '8ème année (2ème secondaire)', cycle: 'CTEB', ordre: 11, diplome: 'TENASOSP (Certificat de Fin d\'Éducation de Base)', statut: 'Actif' },

  // Secondaire / Humanités — Filière Générale
  { nom: '1ère Humanités (3ème secondaire)', cycle: 'Secondaire Général', ordre: 12, diplome: '', statut: 'Actif' },
  { nom: '2ème Humanités (4ème secondaire)', cycle: 'Secondaire Général', ordre: 13, diplome: '', statut: 'Actif' },
  { nom: '3ème Humanités (5ème secondaire)', cycle: 'Secondaire Général', ordre: 14, diplome: '', statut: 'Actif' },
  { nom: '4ème Humanités (6ème secondaire)', cycle: 'Secondaire Général', ordre: 15, diplome: 'Diplôme d\'État (EXETAT)', statut: 'Actif' },

  // Secondaire / Humanités — Filière Technique
  { nom: '1ère Humanités Tech. (3ème sec.)', cycle: 'Secondaire Technique', ordre: 12, diplome: '', statut: 'Actif' },
  { nom: '2ème Humanités Tech. (4ème sec.)', cycle: 'Secondaire Technique', ordre: 13, diplome: '', statut: 'Actif' },
  { nom: '3ème Humanités Tech. (5ème sec.)', cycle: 'Secondaire Technique', ordre: 14, diplome: '', statut: 'Actif' },
  { nom: '4ème Humanités Tech. (6ème sec.)', cycle: 'Secondaire Technique', ordre: 15, diplome: 'Diplôme d\'État (EXETAT)', statut: 'Actif' },
];

/* ── Matières / Cours du programme national ── */

export const MATIERES_RDC: MatiereRdc[] = [
  // ── Maternel ──
  { nom: 'Éveil langagier (français et langues nationales)', cycle: 'Maternel', domaine: 'Langage', coefficient: 1, statut: 'Actif' },
  { nom: 'Découverte du monde', cycle: 'Maternel', domaine: 'Sciences', coefficient: 1, statut: 'Actif' },
  { nom: 'Activités physiques et motrices', cycle: 'Maternel', domaine: 'Éducation physique', coefficient: 1, statut: 'Actif' },
  { nom: 'Arts et créativité', cycle: 'Maternel', domaine: 'Arts', coefficient: 1, statut: 'Actif' },
  { nom: 'Vie en groupe et socialisation', cycle: 'Maternel', domaine: 'Citoyenneté', coefficient: 1, statut: 'Actif' },

  // ── Primaire ──
  { nom: 'Français (lecture, écriture, communication)', cycle: 'Primaire', domaine: 'Langage', coefficient: 4, statut: 'Actif' },
  { nom: 'Mathématiques', cycle: 'Primaire', domaine: 'Sciences', coefficient: 4, statut: 'Actif' },
  { nom: 'Éveil (sciences, histoire, géographie)', cycle: 'Primaire', domaine: 'Sciences', coefficient: 3, statut: 'Actif' },
  { nom: 'Langues nationales', cycle: 'Primaire', domaine: 'Langage', coefficient: 2, statut: 'Actif' },
  { nom: 'Éducation civique et morale', cycle: 'Primaire', domaine: 'Citoyenneté', coefficient: 2, statut: 'Actif' },
  { nom: 'Éducation physique et sportive', cycle: 'Primaire', domaine: 'Éducation physique', coefficient: 1, statut: 'Actif' },
  { nom: 'Arts plastiques et musique', cycle: 'Primaire', domaine: 'Arts', coefficient: 1, statut: 'Actif' },

  // ── CTEB (7ème et 8ème année) ──
  { nom: 'Français', cycle: 'CTEB', domaine: 'Langage', coefficient: 4, statut: 'Actif' },
  { nom: 'Mathématiques', cycle: 'CTEB', domaine: 'Sciences', coefficient: 4, statut: 'Actif' },
  { nom: 'Sciences (physique, chimie, biologie)', cycle: 'CTEB', domaine: 'Sciences', coefficient: 3, statut: 'Actif' },
  { nom: 'Histoire', cycle: 'CTEB', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Géographie', cycle: 'CTEB', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Éducation civique et morale', cycle: 'CTEB', domaine: 'Citoyenneté', coefficient: 2, statut: 'Actif' },
  { nom: 'Anglais', cycle: 'CTEB', domaine: 'Langage', coefficient: 2, statut: 'Actif' },
  { nom: 'Langues nationales', cycle: 'CTEB', domaine: 'Langage', coefficient: 1, statut: 'Actif' },
  { nom: 'Éducation physique et sportive', cycle: 'CTEB', domaine: 'Éducation physique', coefficient: 1, statut: 'Actif' },
  { nom: 'Arts plastiques et musique', cycle: 'CTEB', domaine: 'Arts', coefficient: 1, statut: 'Actif' },
  { nom: 'Technologie (TIC)', cycle: 'CTEB', domaine: 'Sciences', coefficient: 1, statut: 'Actif' },

  // ── Secondaire Général ──
  { nom: 'Français', cycle: 'Secondaire Général', domaine: 'Langage', coefficient: 4, statut: 'Actif' },
  { nom: 'Mathématiques', cycle: 'Secondaire Général', domaine: 'Sciences', coefficient: 4, statut: 'Actif' },
  { nom: 'Physique', cycle: 'Secondaire Général', domaine: 'Sciences', coefficient: 3, statut: 'Actif' },
  { nom: 'Chimie', cycle: 'Secondaire Général', domaine: 'Sciences', coefficient: 3, statut: 'Actif' },
  { nom: 'Biologie', cycle: 'Secondaire Général', domaine: 'Sciences', coefficient: 2, statut: 'Actif' },
  { nom: 'Histoire', cycle: 'Secondaire Général', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Géographie', cycle: 'Secondaire Général', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Éducation civique', cycle: 'Secondaire Général', domaine: 'Citoyenneté', coefficient: 2, statut: 'Actif' },
  { nom: 'Anglais', cycle: 'Secondaire Général', domaine: 'Langage', coefficient: 3, statut: 'Actif' },
  { nom: 'Langues nationales', cycle: 'Secondaire Général', domaine: 'Langage', coefficient: 1, statut: 'Actif' },
  { nom: 'Philosophie', cycle: 'Secondaire Général', domaine: 'Sciences humaines', coefficient: 3, statut: 'Actif' },
  { nom: 'Économie', cycle: 'Secondaire Général', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Éducation physique et sportive', cycle: 'Secondaire Général', domaine: 'Éducation physique', coefficient: 1, statut: 'Actif' },
  { nom: 'Informatique (TIC)', cycle: 'Secondaire Général', domaine: 'Sciences', coefficient: 2, statut: 'Actif' },

  // ── Secondaire Technique ──
  { nom: 'Français', cycle: 'Secondaire Technique', domaine: 'Langage', coefficient: 3, statut: 'Actif' },
  { nom: 'Mathématiques', cycle: 'Secondaire Technique', domaine: 'Sciences', coefficient: 3, statut: 'Actif' },
  { nom: 'Physique', cycle: 'Secondaire Technique', domaine: 'Sciences', coefficient: 2, statut: 'Actif' },
  { nom: 'Chimie', cycle: 'Secondaire Technique', domaine: 'Sciences', coefficient: 2, statut: 'Actif' },
  { nom: 'Biologie', cycle: 'Secondaire Technique', domaine: 'Sciences', coefficient: 1, statut: 'Actif' },
  { nom: 'Histoire', cycle: 'Secondaire Technique', domaine: 'Sciences humaines', coefficient: 1, statut: 'Actif' },
  { nom: 'Géographie', cycle: 'Secondaire Technique', domaine: 'Sciences humaines', coefficient: 1, statut: 'Actif' },
  { nom: 'Éducation civique', cycle: 'Secondaire Technique', domaine: 'Citoyenneté', coefficient: 2, statut: 'Actif' },
  { nom: 'Anglais', cycle: 'Secondaire Technique', domaine: 'Langage', coefficient: 2, statut: 'Actif' },
  { nom: 'Philosophie', cycle: 'Secondaire Technique', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Économie', cycle: 'Secondaire Technique', domaine: 'Sciences humaines', coefficient: 2, statut: 'Actif' },
  { nom: 'Éducation physique et sportive', cycle: 'Secondaire Technique', domaine: 'Éducation physique', coefficient: 1, statut: 'Actif' },
  { nom: 'Informatique (TIC)', cycle: 'Secondaire Technique', domaine: 'Sciences', coefficient: 3, statut: 'Actif' },
  { nom: 'Comptabilité', cycle: 'Secondaire Technique', domaine: 'Technique', coefficient: 4, statut: 'Actif' },
  { nom: 'Électricité', cycle: 'Secondaire Technique', domaine: 'Technique', coefficient: 4, statut: 'Actif' },
  { nom: 'Mécanique', cycle: 'Secondaire Technique', domaine: 'Technique', coefficient: 4, statut: 'Actif' },
  { nom: 'Sciences commerciales et administratives', cycle: 'Secondaire Technique', domaine: 'Technique', coefficient: 3, statut: 'Actif' },
  { nom: 'Coupe et couture', cycle: 'Secondaire Technique', domaine: 'Technique', coefficient: 4, statut: 'Actif' },
  { nom: 'Construction mécanique', cycle: 'Secondaire Technique', domaine: 'Technique', coefficient: 4, statut: 'Actif' },
];

export interface OptionRdc {
  nom: string;
  cycle: CycleRdc;
  type: string; // 'Section' ou 'Option'
  description: string;
  statut: string;
}

/* ── Sections & Options du secondaire congolais ── */

export const OPTIONS_RDC: OptionRdc[] = [
  // ── Secondaire Général — Sections ──
  { nom: 'Scientifique — Bio-Chimie', cycle: 'Secondaire Général', type: 'Section', description: 'Sciences naturelles : biologie et chimie', statut: 'Actif' },
  { nom: 'Scientifique — Math-Physique', cycle: 'Secondaire Général', type: 'Section', description: 'Sciences exactes : mathématiques et physique', statut: 'Actif' },
  { nom: 'Littéraire — Latin-Philosophie', cycle: 'Secondaire Général', type: 'Section', description: 'Lettres classiques et philosophie', statut: 'Actif' },
  { nom: 'Littéraire — Langues vivantes', cycle: 'Secondaire Général', type: 'Section', description: 'Langues françaises, anglaises et nationales', statut: 'Actif' },
  { nom: 'Pédagogique', cycle: 'Secondaire Général', type: 'Section', description: 'Sciences de l\'éducation et psychologie', statut: 'Actif' },
  { nom: 'Sciences Sociales', cycle: 'Secondaire Général', type: 'Section', description: 'Sciences sociales, économie et sociologie', statut: 'Actif' },

  // ── Secondaire Technique — Options ──
  { nom: 'Commerciale et Gestion', cycle: 'Secondaire Technique', type: 'Option', description: 'Comptabilité, sciences commerciales et administratives', statut: 'Actif' },
  { nom: 'Construction Mécanique', cycle: 'Secondaire Technique', type: 'Option', description: 'Fabrication et maintenance mécanique', statut: 'Actif' },
  { nom: 'Électricité', cycle: 'Secondaire Technique', type: 'Option', description: 'Installations électriques et électroniques', statut: 'Actif' },
  { nom: 'Électronique', cycle: 'Secondaire Technique', type: 'Option', description: 'Systèmes électroniques et télécommunications', statut: 'Actif' },
  { nom: 'Mécanique Auto', cycle: 'Secondaire Technique', type: 'Option', description: 'Maintenance et réparation automobile', statut: 'Actif' },
  { nom: 'Coupe et Couture', cycle: 'Secondaire Technique', type: 'Option', description: 'Arts textiles et modélisme', statut: 'Actif' },
  { nom: 'Arts et Métiers', cycle: 'Secondaire Technique', type: 'Option', description: 'Métiers d\'art et artisanat', statut: 'Actif' },
  { nom: 'Agriculture', cycle: 'Secondaire Technique', type: 'Option', description: 'Sciences agronomiques et élevage', statut: 'Actif' },
  { nom: 'Pédagogique Technique', cycle: 'Secondaire Technique', type: 'Option', description: 'Formation pédagogique appliquée au technique', statut: 'Actif' },
  { nom: 'Informatique de Gestion', cycle: 'Secondaire Technique', type: 'Option', description: 'Informatique appliquée et gestion de données', statut: 'Actif' },
];

export const CYCLES_RDC: CycleRdc[] = [
  'Maternel',
  'Primaire',
  'CTEB',
  'Secondaire Général',
  'Secondaire Technique',
];
