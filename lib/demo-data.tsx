import { Badge } from '@/components/ui/Badge';

/* ── Gestion scolaire ── */

export const demoEtablissements = [
  { nom: 'Institut Tuendelee', type: 'Secondaire', province: 'Kinshasa', effectif: 1240, statut: 'Actif' },
  { nom: 'École Primaire Bambelo', type: 'Primaire', province: 'Kongo Central', effectif: 450, statut: 'Actif' },
  { nom: 'Collège Boboto', type: 'Secondaire', province: 'Kinshasa', effectif: 980, statut: 'Actif' },
  { nom: 'Lycée Sainte-Germaine', type: 'Secondaire', province: 'Haut-Katanga', effectif: 760, statut: 'En attente' },
  { nom: 'École Maman Mobali', type: 'Primaire', province: 'Nord-Kivu', effectif: 320, statut: 'Actif' },
  { nom: 'Institut Tala Na Sala', type: 'Secondaire', province: 'Kwilu', effectif: 540, statut: 'Suspendu' },
];

export const demoEnseignants = [
  { nom: 'Mukendi Kalonji', matricule: 'ENS-001', grade: 'Chef de travaux', etablissement: 'Institut Tuendelee', statut: 'Actif' },
  { nom: 'Kabeya Tshibangu', matricule: 'ENS-002', grade: 'Professeur', etablissement: 'Collège Boboto', statut: 'Actif' },
  { nom: 'Mwamba Ilunga', matricule: 'ENS-003', grade: 'Instituteur', etablissement: 'École Primaire Bambelo', statut: 'Actif' },
  { nom: 'Tshisekedi Mujinga', matricule: 'ENS-004', grade: 'Professeur', etablissement: 'Lycée Sainte-Germaine', statut: 'Congé' },
  { nom: 'Kasongo Mbuyi', matricule: 'ENS-005', grade: 'Instituteur principal', etablissement: 'École Maman Mobali', statut: 'Actif' },
];

export const demoNotes = [
  { eleve: 'Kabongo Mukendi Jean', devoir1: '14/20', devoir2: '16/20', examen: '15/20', moyenne: '15.0/20', mention: 'Distinction' },
  { eleve: 'Kasongo Mbuyi Sarah', devoir1: '12/20', devoir2: '10/20', examen: '13/20', moyenne: '11.7/20', mention: 'Satisfaction' },
  { eleve: 'Tshibangu Kalonji Paul', devoir1: '8/20', devoir2: '11/20', examen: '9/20', moyenne: '9.3/20', mention: 'Insuffisant' },
  { eleve: 'Mujinga Ilunga Grace', devoir1: '18/20', devoir2: '17/20', examen: '19/20', moyenne: '18.0/20', mention: 'Grande distinction' },
  { eleve: 'Mbuyi Tshisekedi Eric', devoir1: '15/20', devoir2: '13/20', examen: '14/20', moyenne: '14.0/20', mention: 'Distinction' },
];

export const demoElevesRecherche = [
  { matricule: 'ELV-2026-001', nom: 'Kabongo Mukendi Jean', classe: '6ème primaire', etablissement: 'Institut Tuendelee', province: 'Kinshasa' },
  { matricule: 'ELV-2026-002', nom: 'Kasongo Mbuyi Sarah', classe: '4ème secondaire', etablissement: 'Collège Boboto', province: 'Kinshasa' },
  { matricule: 'ELV-2026-003', nom: 'Tshibangu Kalonji Paul', classe: '3ème secondaire', etablissement: 'Lycée Sainte-Germaine', province: 'Haut-Katanga' },
  { matricule: 'ELV-2026-004', nom: 'Mujinga Ilunga Grace', classe: '5ème primaire', etablissement: 'École Primaire Bambelo', province: 'Kongo Central' },
  { matricule: 'ELV-2026-005', nom: 'Mbuyi Tshisekedi Eric', classe: '6ème secondaire', etablissement: 'Institut Tala Na Sala', province: 'Kwilu' },
];

export const demoPhotos = [
  { nom: 'Kabongo Mukendi Jean', matricule: 'ELV-2026-001', statut: 'Validée' },
  { nom: 'Kasongo Mbuyi Sarah', matricule: 'ELV-2026-002', statut: 'Validée' },
  { nom: 'Tshibangu Kalonji Paul', matricule: 'ELV-2026-003', statut: 'En attente' },
  { nom: 'Mujinga Ilunga Grace', matricule: 'ELV-2026-004', statut: 'Validée' },
  { nom: 'Mbuyi Tshisekedi Eric', matricule: 'ELV-2026-005', statut: 'Manquante' },
  { nom: 'Ilunga Mwamba David', matricule: 'ELV-2026-006', statut: 'En attente' },
];

export const demoCartesQR = [
  { nom: 'Kabongo Mukendi Jean', matricule: 'ELV-2026-001', classe: '6ème primaire', carte: 'CRT-001', statut: 'Générée' },
  { nom: 'Kasongo Mbuyi Sarah', matricule: 'ELV-2026-002', classe: '4ème secondaire', carte: 'CRT-002', statut: 'Générée' },
  { nom: 'Tshibangu Kalonji Paul', matricule: 'ELV-2026-003', classe: '3ème secondaire', carte: 'CRT-003', statut: 'En attente' },
];

/* ── Organisation territoriale ── */

export const demoProvinces = [
  { nom: 'Kinshasa', chefLieu: 'Kinshasa', etablissements: 320, eleves: 485000, statut: 'Actif' },
  { nom: 'Kongo Central', chefLieu: 'Matadi', etablissements: 180, eleves: 210000, statut: 'Actif' },
  { nom: 'Haut-Katanga', chefLieu: 'Lubumbashi', etablissements: 240, eleves: 320000, statut: 'Actif' },
  { nom: 'Nord-Kivu', chefLieu: 'Goma', etablissements: 150, eleves: 180000, statut: 'Actif' },
  { nom: 'Kwilu', chefLieu: 'Bandundu', etablissements: 95, eleves: 120000, statut: 'En setup' },
  { nom: 'Tshopo', chefLieu: 'Kisangani', etablissements: 110, eleves: 140000, statut: 'Actif' },
];

export const demoEcErc = [
  { nom: 'EC Kinshasa-Est', type: 'Entité EC', province: 'Kinshasa', ecoles: 160, statut: 'Actif' },
  { nom: 'ERC Kinshasa-Ouest', type: 'Entité ERC', province: 'Kinshasa', ecoles: 160, statut: 'Actif' },
  { nom: 'EC Lubumbashi', type: 'Entité EC', province: 'Haut-Katanga', ecoles: 120, statut: 'Actif' },
  { nom: 'ERC Goma', type: 'Entité ERC', province: 'Nord-Kivu', ecoles: 75, statut: 'Actif' },
  { nom: 'EC Matadi', type: 'Entité EC', province: 'Kongo Central', ecoles: 90, statut: 'En setup' },
];

export const demoCoordNationale = [
  { province: 'Kinshasa', coordonnateur: 'Dr. Mukendi Kalonji', ecoles: 320, eleves: 485000, statut: 'Actif' },
  { province: 'Haut-Katanga', coordonnateur: 'Prof. Kabeya Tshibangu', ecoles: 240, eleves: 320000, statut: 'Actif' },
  { province: 'Nord-Kivu', coordonnateur: 'M. Mwamba Ilunga', ecoles: 150, eleves: 180000, statut: 'Actif' },
  { province: 'Kongo Central', coordonnateur: 'Mme. Mujinga Tshisekedi', ecoles: 180, eleves: 210000, statut: 'Actif' },
  { province: 'Kwilu', coordonnateur: '—', ecoles: 95, eleves: 120000, statut: 'Vacant' },
];

export const demoCoordProvinciale = [
  { province: 'Kinshasa', bureaux: 4, agents: 28, dossiers: 1450, statut: 'Actif' },
  { province: 'Haut-Katanga', bureaux: 3, agents: 18, dossiers: 820, statut: 'Actif' },
  { province: 'Nord-Kivu', bureaux: 2, agents: 12, dossiers: 540, statut: 'Actif' },
  { province: 'Kongo Central', bureaux: 2, agents: 10, dossiers: 430, statut: 'Actif' },
];

export const demoCoordSousProvinciale = [
  { nom: 'Sous-division Lukunga', province: 'Kinshasa', bureaux: 2, agents: 8, statut: 'Actif' },
  { nom: 'Sous-division Tshangu', province: 'Kinshasa', bureaux: 2, agents: 7, statut: 'Actif' },
  { nom: 'Sous-division Likasi', province: 'Haut-Katanga', bureaux: 1, agents: 5, statut: 'Actif' },
  { nom: 'Sous-division Beni', province: 'Nord-Kivu', bureaux: 1, agents: 4, statut: 'En setup' },
];

/* ── Administration ── */

export const demoUsers = [
  { nom: 'Mukendi Kalonji', email: 'mukendi@school.cd', role: 'SUPER_ADMIN', statut: 'Actif' },
  { nom: 'Kabeya Tshibangu', email: 'kabeya@school.cd', role: 'COORDINATION_PROVINCIALE', statut: 'Actif' },
  { nom: 'Mwamba Ilunga', email: 'mwamba@school.cd', role: 'DIRECTION_ECOLE', statut: 'Actif' },
  { nom: 'Tshisekedi Mujinga', email: 'tshisekedi@school.cd', role: 'ENSEIGNANT', statut: 'Actif' },
  { nom: 'Kasongo Mbuyi', email: 'kasongo@school.cd', role: 'PARENT', statut: 'Inactif' },
  { nom: 'Mbuyi Tshisekedi', email: 'mbuyi@school.cd', role: 'ELEVE', statut: 'Actif' },
];

export const demoBureaux = [
  { bureau: 'Bureau provincial Kinshasa', fonction: 'Coordination provinciale', titulaire: 'Dr. Mukendi Kalonji', localisation: 'Kinshasa' },
  { bureau: 'Bureau sous-provincial Lukunga', fonction: 'Coordination sous-provinciale', titulaire: 'M. Kabeya', localisation: 'Kinshasa' },
  { bureau: 'Bureau provincial Haut-Katanga', fonction: 'Coordination provinciale', titulaire: 'Prof. Kabeya Tshibangu', localisation: 'Lubumbashi' },
  { bureau: 'Inspection Nord-Kivu', fonction: 'Inspection éducative', titulaire: 'M. Mwamba Ilunga', localisation: 'Goma' },
  { bureau: 'Secrétariat Kongo Central', fonction: 'Secrétariat', titulaire: 'Mme. Mujinga', localisation: 'Matadi' },
];

export const demoGrades = [
  { grade: 'Chef de travaux', categorie: 'Enseignement secondaire', effectif: 45, statut: 'Actif' },
  { grade: 'Professeur', categorie: 'Enseignement secondaire', effectif: 120, statut: 'Actif' },
  { grade: 'Instituteur principal', categorie: 'Enseignement primaire', effectif: 85, statut: 'Actif' },
  { grade: 'Instituteur', categorie: 'Enseignement primaire', effectif: 210, statut: 'Actif' },
  { grade: 'Directeur', categorie: 'Direction', effectif: 18, statut: 'Actif' },
  { grade: 'Sous-commissaire', categorie: 'Administration', effectif: 12, statut: 'Actif' },
];

export const demoDossiers = [
  { reference: 'DOS-2026-001', objet: 'Demande de transfert', demandeur: 'Kabongo Mukendi', statut: 'En cours', date: '2026-09-28' },
  { reference: 'DOS-2026-002', objet: 'Certificat de scolarité', demandeur: 'Kasongo Mbuyi', statut: 'Traité', date: '2026-09-25' },
  { reference: 'DOS-2026-003', objet: 'Réclamation de notes', demandeur: 'Tshibangu Kalonji', statut: 'En attente', date: '2026-10-01' },
  { reference: 'DOS-2026-004', objet: 'Inscription tardive', demandeur: 'Mujinga Ilunga', statut: 'En cours', date: '2026-10-02' },
  { reference: 'DOS-2026-005', objet: 'Demande de bourse', demandeur: 'Mbuyi Tshisekedi', statut: 'Rejeté', date: '2026-09-20' },
];

export const demoVisites = [
  { date: '2026-10-05', etablissement: 'Institut Tuendelee', visiteur: 'Dr. Mukendi', objet: 'Inspection pédagogique', statut: 'Planifiée' },
  { date: '2026-10-07', etablissement: 'Collège Boboto', visiteur: 'M. Kabeya', objet: 'Suivi administratif', statut: 'Planifiée' },
  { date: '2026-09-30', etablissement: 'École Primaire Bambelo', visiteur: 'Mme. Mujinga', objet: 'Évaluation continue', statut: 'Terminée' },
  { date: '2026-10-10', etablissement: 'Lycée Sainte-Germaine', visiteur: 'M. Mwamba', objet: 'Audit financier', statut: 'Planifiée' },
];

export const demoServices = [
  { service: 'Inscriptions', procedures: 12, dossiers: 340, statut: 'Actif' },
  { service: 'Examens & évaluations', procedures: 8, dossiers: 210, statut: 'Actif' },
  { service: 'Transferts', procedures: 5, dossiers: 85, statut: 'Actif' },
  { service: 'Certifications', procedures: 6, dossiers: 120, statut: 'Actif' },
  { service: 'Bourses & aides', procedures: 4, dossiers: 65, statut: 'En pause' },
];

/* ── Communication & Services ── */

export const demoNotifications = [
  { titre: 'Nouvel élève inscrit', message: 'Kabongo Mukendi Jean a été inscrit en 6ème primaire.', type: 'Inscription', date: '2026-10-04 10:30', lu: false },
  { titre: 'Visite planifiée', message: 'Inspection pédagogique à l\'Institut Tuendelee le 05/10.', type: 'Visite', date: '2026-10-03 16:00', lu: false },
  { titre: 'Notes publiées', message: 'Les notes du 1er trimestre de 4ème secondaire sont disponibles.', type: 'Évaluation', date: '2026-10-03 14:20', lu: true },
  { titre: 'Dossier traité', message: 'Le dossier DOS-2026-002 a été traité.', type: 'Dossier', date: '2026-10-02 09:15', lu: true },
  { titre: 'Nouvel enseignant', message: 'Kasongo Mbuyi a rejoint l\'École Maman Mobali.', type: 'Personnel', date: '2026-10-01 11:00', lu: true },
];

export const demoConversations = [
  { nom: 'Dr. Mukendi Kalonji', role: 'Coord. nationale', dernier: 'Réunion demain à 10h ?', date: '10:32', nonLus: 2 },
  { nom: 'Prof. Kabeya', role: 'Enseignant', dernier: 'Voici les notes du devoir', date: '09:15', nonLus: 0 },
  { nom: 'Mme. Mujinga', role: 'Parent', dernier: 'Merci pour l\'information', date: 'Hier', nonLus: 0 },
  { nom: 'Direction Boboto', role: 'Direction', dernier: 'Planning validé ✓', date: 'Hier', nonLus: 1 },
  { nom: 'M. Mwamba', role: 'Agent provincial', dernier: 'Rapport de visite envoyé', date: '01/10', nonLus: 0 },
];

export const demoMessages = [
  { auteur: 'Dr. Mukendi Kalonji', contenu: 'Bonjour, avez-vous reçu le rapport mensuel ?', date: '10:20', moi: false },
  { auteur: 'Moi', contenu: 'Oui, je l\'ai consulté ce matin. Tout est en ordre.', date: '10:25', moi: true },
  { auteur: 'Dr. Mukendi Kalonji', contenu: 'Parfait. Réunion demain à 10h ?', date: '10:32', moi: false },
];

export const demoPaiements = [
  { reference: 'PAY-2026-001', description: 'Abonnement Premium — École', montant: '25 000 FC', date: '2026-10-01', statut: 'Payé' },
  { reference: 'PAY-2026-002', description: 'Frais de scolarité — 6ème primaire', montant: '45 000 FC', date: '2026-09-28', statut: 'Payé' },
  { reference: 'PAY-2026-003', description: 'Cartes scolaires (lot 50)', montant: '15 000 FC', date: '2026-09-25', statut: 'Payé' },
  { reference: 'PAY-2026-004', description: 'Abonnement Premium — École', montant: '25 000 FC', date: '2026-09-01', statut: 'En attente' },
  { reference: 'PAY-2026-005', description: 'Frais d\'examen — 3ème secondaire', montant: '30 000 FC', date: '2026-08-28', statut: 'Rejeté' },
];

export const demoPlans = [
  { nom: 'Gratuit', prix: '0 FC', fonctionnalites: ['1 établissement', '100 élèves max', 'Recherche d\'élèves'], actuel: false },
  { nom: 'Standard', prix: '15 000 FC/mois', fonctionnalites: ['3 établissements', '1 000 élèves', 'Cahier de notes', 'Notifications'], actuel: false },
  { nom: 'Premium', prix: '25 000 FC/mois', fonctionnalites: ['Établissements illimités', 'Élèves illimités', 'Tous les modules', 'Support prioritaire'], actuel: true },
];

export const demoGeoloc = [
  { nom: 'Institut Tuendelee', province: 'Kinshasa', latitude: '-4.3250', longitude: '15.3222', eleves: 1240 },
  { nom: 'Collège Boboto', province: 'Kinshasa', latitude: '-4.3389', longitude: '15.3131', eleves: 980 },
  { nom: 'Lycée Sainte-Germaine', province: 'Haut-Katanga', latitude: '-11.6644', longitude: '27.4794', eleves: 760 },
  { nom: 'École Primaire Bambelo', province: 'Kongo Central', latitude: '-5.8250', longitude: '13.4622', eleves: 450 },
  { nom: 'École Maman Mobali', province: 'Nord-Kivu', latitude: '-1.6788', longitude: '29.2228', eleves: 320 },
  { nom: 'Institut Tala Na Sala', province: 'Kwilu', latitude: '-3.3167', longitude: '18.8167', eleves: 540 },
];

/* ── Helpers ── */

export function statutBadge(statut: string) {
  const map: Record<string, { color: 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'purple'; label: string }> = {
    'Actif': { color: 'green', label: 'Actif' },
    'Inactif': { color: 'slate', label: 'Inactif' },
    'En attente': { color: 'amber', label: 'En attente' },
    'En cours': { color: 'blue', label: 'En cours' },
    'En setup': { color: 'amber', label: 'En setup' },
    'Suspendu': { color: 'red', label: 'Suspendu' },
    'Vacant': { color: 'slate', label: 'Vacant' },
    'Congé': { color: 'amber', label: 'Congé' },
    'Traité': { color: 'green', label: 'Traité' },
    'Rejeté': { color: 'red', label: 'Rejeté' },
    'Planifiée': { color: 'blue', label: 'Planifiée' },
    'Terminée': { color: 'green', label: 'Terminée' },
    'Générée': { color: 'green', label: 'Générée' },
    'Validée': { color: 'green', label: 'Validée' },
    'Manquante': { color: 'red', label: 'Manquante' },
    'En pause': { color: 'amber', label: 'En pause' },
  };
  const cfg = map[statut] ?? { color: 'slate' as const, label: statut };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}
