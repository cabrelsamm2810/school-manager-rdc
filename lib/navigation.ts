export type NavItem = {
  label: string;
  href: string;
  icon: string;
  minRole?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Configuration centrale de la navigation School Manager RDC.
 * Les 30 modules sont organisés par groupe fonctionnel.
 * `minRole` restreint l'affichage aux rôles suffisants (optionnel).
 */
export const navigationGroups: NavGroup[] = [
  {
    title: 'Tableau de bord',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'home' },
    ]
  },
  {
    title: 'Gestion scolaire',
    items: [
      { label: 'Établissements', href: '/etablissements', icon: 'school', minRole: 'DIRECTION_ECOLE' },
      { label: 'Élèves', href: '/eleves', icon: 'users', minRole: 'DIRECTION_ECOLE' },
      { label: 'Enseignants', href: '/enseignants', icon: 'teacher', minRole: 'DIRECTION_ECOLE' },
      { label: 'Tableau de bord enseignant', href: '/enseignant/dashboard', icon: 'home', minRole: 'ENSEIGNANT' },
      { label: 'Cahier de cote', href: '/cahier-de-cote', icon: 'notebook', minRole: 'ENSEIGNANT' },
      { label: 'Carte scolaire', href: '/carte-scolaire', icon: 'map', minRole: 'DIRECTION_ECOLE' },
      { label: 'Recherche d’élèves', href: '/recherche-eleves', icon: 'search' },
      { label: 'Photo passeport', href: '/photo-passeport', icon: 'photo', minRole: 'DIRECTION_ECOLE' },
      { label: 'QR & Cartes scolaires', href: '/cartes-qr', icon: 'qr', minRole: 'DIRECTION_ECOLE' },
      { label: 'Importer mes données', href: '/import', icon: 'upload', minRole: 'DIRECTION_ECOLE' },
      { label: 'Dossiers des élèves', href: '/dossiers-eleves', icon: 'folder', minRole: 'DIRECTION_ECOLE' },
      { label: 'Classes & Niveaux', href: '/classes-rdc', icon: 'school', minRole: 'DIRECTION_ECOLE' },
      { label: 'Matières & Cours', href: '/matieres-rdc', icon: 'notebook', minRole: 'DIRECTION_ECOLE' },
      { label: 'Options & Sections', href: '/options-rdc', icon: 'organization', minRole: 'DIRECTION_ECOLE' },
    ]
  },
  {
    title: 'Organisation territoriale',
    items: [
      { label: 'Provinces', href: '/provinces', icon: 'globe', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Provinces éducationnelles', href: '/provinces-educationnelles', icon: 'school', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Sous-divisions éduc.', href: '/sous-divisions', icon: 'district', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'EC-ERC', href: '/ec-erc', icon: 'organization', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Coord. nationale', href: '/coordination-nationale', icon: 'flag', minRole: 'COORDINATION_NATIONALE' },
      { label: 'Coord. provinciale', href: '/coordination-provinciale', icon: 'region', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Coord. sous-provinciale', href: '/coordination-sous-provinciale', icon: 'district', minRole: 'COORDINATION_SOUS_PROVINCIALE' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Utilisateurs', href: '/admin/users', icon: 'people', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Bureaux & fonctions', href: '/bureaux-fonctions', icon: 'office', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Grades', href: '/grades', icon: 'badge', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Dossiers', href: '/dossiers', icon: 'folder', minRole: 'AGENT_PROVINCIAL' },
      { label: 'Visites numériques', href: '/visites', icon: 'visit', minRole: 'AGENT_PROVINCIAL' },
      { label: 'Services administratifs', href: '/services', icon: 'services', minRole: 'AGENT_SOUS_PROVINCIAL' },
      { label: 'Administration générale', href: '/admin', icon: 'shield', minRole: 'SUPER_ADMIN' },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Notifications', href: '/notifications', icon: 'bell' },
      { label: 'SchoolChat', href: '/schoolchat', icon: 'chat' },
    ]
  },
  {
    title: 'Services',
    items: [
      { label: 'Paiements & premium', href: '/paiements', icon: 'card' },
      { label: 'Géolocalisation', href: '/geolocalisation', icon: 'location' },
      { label: 'Paramètres', href: '/parametres', icon: 'settings' },
    ]
  },
];

/** Aplatit tous les éléments de navigation en une liste simple. */
export const allNavItems: NavItem[] = navigationGroups.flatMap((g) => g.items);
