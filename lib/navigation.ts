import { ROLE_RANK } from '@/lib/rbac';

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  minRole?: string;
  /** Restriction à un ou plusieurs rôles exacts (prioritaire sur `minRole`). */
  roles?: string[];
  /** Rôles exclus de l'affichage (même si `minRole` le permettrait). */
  excludeRoles?: string[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Configuration centrale de la navigation School Manager RDC.
 * Les modules sont organisés par groupe fonctionnel.
 * `minRole` restreint l'affichage aux rôles suffisants (optionnel).
 * `roles` restreint à des rôles exacts (prioritaire sur `minRole`).
 * `excludeRoles` masque un élément pour les rôles listés.
 */
export const navigationGroups: NavGroup[] = [
  {
    title: 'Accueil',
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: 'home', excludeRoles: ['ENSEIGNANT', 'SUPER_ADMIN', 'ADMIN_SCHOOL_MANAGER_RDC', 'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE', 'COORDINATION_SOUS_PROVINCIALE', 'PROMOTEUR', 'SECRETAIRE', 'COMPTABLE'] },
    ]
  },
  {
    title: 'Espace enseignant',
    items: [
      { label: 'Tableau de bord', href: '/enseignant/dashboard', icon: 'home', roles: ['ENSEIGNANT'] },
      { label: 'Mes cours', href: '/mes-cours', icon: 'notebook', roles: ['ENSEIGNANT'] },
      { label: 'Journal de classe', href: '/journal-de-classe', icon: 'document', roles: ['ENSEIGNANT'] },
      { label: 'Cahier de communication', href: '/cahier-de-communication', icon: 'book', roles: ['ENSEIGNANT'] },
      { label: 'Présences / QR', href: '/presences-qr', icon: 'qr', roles: ['ENSEIGNANT'] },
      { label: 'Cahiers de cotes', href: '/cahier-de-cote', icon: 'notebook', roles: ['ENSEIGNANT'] },
      { label: 'Mes élèves', href: '/mes-eleves', icon: 'users', roles: ['ENSEIGNANT'] },
      { label: 'Scanner un élève', href: '/scanner-eleve', icon: 'scan', roles: ['ENSEIGNANT'] },
      { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', roles: ['ENSEIGNANT'] },
      { label: 'Notifications', href: '/notifications', icon: 'bell', roles: ['ENSEIGNANT'] },
    ]
  },
  {
    title: 'Gestion scolaire',
    items: [
      { label: 'Écoles', href: '/ecoles', icon: 'school', minRole: 'DIRECTION_ECOLE' },
      { label: 'Élèves', href: '/eleves', icon: 'users', minRole: 'DIRECTION_ECOLE' },
      { label: 'Enseignants', href: '/enseignants', icon: 'teacher', minRole: 'DIRECTION_ECOLE' },
      { label: 'Cahier de cote', href: '/cahier-de-cote', icon: 'notebook', minRole: 'ENSEIGNANT', excludeRoles: ['ENSEIGNANT'] },
      { label: 'Rappels de cotes', href: '/rappels-cotes', icon: 'bell', minRole: 'DIRECTION_ECOLE' },
      { label: 'Bulletin numérique', href: '/bulletin-numerique', icon: 'notebook', minRole: 'DIRECTION_ECOLE' },
      { label: 'Carte scolaire', href: '/carte-scolaire', icon: 'map', minRole: 'DIRECTION_ECOLE' },
      { label: 'Recherche d’élèves', href: '/recherche-eleves', icon: 'search', minRole: 'DIRECTION_ECOLE' },
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
    title: 'Espace promoteur',
    items: [
      { label: 'Tableau de bord', href: '/promoteur', icon: 'home', roles: ['PROMOTEUR'] },
      { label: 'Mon école', href: '/ecoles', icon: 'school', roles: ['PROMOTEUR'] },
      { label: 'Élèves', href: '/eleves', icon: 'users', roles: ['PROMOTEUR'] },
      { label: 'Enseignants', href: '/enseignants', icon: 'teacher', roles: ['PROMOTEUR'] },
      { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', roles: ['PROMOTEUR'] },
      { label: 'Notifications', href: '/notifications', icon: 'bell', roles: ['PROMOTEUR'] },
    ]
  },
  {
    title: 'Espace secrétaire',
    items: [
      { label: 'Tableau de bord', href: '/secretaire', icon: 'home', roles: ['SECRETAIRE'] },
      { label: 'Élèves', href: '/eleves', icon: 'users', roles: ['SECRETAIRE'] },
      { label: 'Dossiers des élèves', href: '/dossiers-eleves', icon: 'folder', roles: ['SECRETAIRE'] },
      { label: 'Visites numériques', href: '/visites', icon: 'visit', roles: ['SECRETAIRE'] },
      { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', roles: ['SECRETAIRE'] },
      { label: 'Notifications', href: '/notifications', icon: 'bell', roles: ['SECRETAIRE'] },
    ]
  },
  {
    title: 'Espace comptable',
    items: [
      { label: 'Tableau de bord', href: '/comptable', icon: 'home', roles: ['COMPTABLE'] },
      { label: 'Paiements', href: '/paiements', icon: 'card', roles: ['COMPTABLE'] },
      { label: 'Élèves', href: '/eleves', icon: 'users', roles: ['COMPTABLE'] },
      { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', roles: ['COMPTABLE'] },
      { label: 'Notifications', href: '/notifications', icon: 'bell', roles: ['COMPTABLE'] },
    ]
  },
  {
    title: 'Organisation territoriale',
    items: [
      { label: 'Provinces', href: '/provinces', icon: 'globe', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Provinces éducationnelles', href: '/provinces-educationnelles', icon: 'school', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Sous-divisions éduc.', href: '/sous-divisions', icon: 'district', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'EC-ERC — Écoles Conventionnées des Églises du Réveil du Congo', href: '/ec-erc', icon: 'organization', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Coord. nationale', href: '/coordination-nationale', icon: 'flag', roles: ['COORDINATION_NATIONALE'] },
      { label: 'Coord. provinciale', href: '/coordination-provinciale', icon: 'region', roles: ['COORDINATION_PROVINCIALE'] },
      { label: 'Coord. sous-provinciale', href: '/coordination-sous-provinciale', icon: 'district', roles: ['COORDINATION_SOUS_PROVINCIALE'] },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Administration School Manager RDC', href: '/admin-smd', icon: 'shield', roles: ['ADMIN_SCHOOL_MANAGER_RDC'] },
      { label: 'Utilisateurs', href: '/admin/users', icon: 'people', minRole: 'ADMIN_SCHOOL_MANAGER_RDC' },
      { label: 'Bureaux & fonctions', href: '/bureaux-fonctions', icon: 'office', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Grades', href: '/grades', icon: 'badge', minRole: 'COORDINATION_PROVINCIALE' },
      { label: 'Dossiers', href: '/dossiers', icon: 'folder', minRole: 'AGENT_PROVINCIAL' },
      { label: 'Visites numériques', href: '/visites', icon: 'visit', minRole: 'AGENT_SOUS_PROVINCIAL' },
      { label: 'Services administratifs', href: '/services', icon: 'services', minRole: 'AGENT_SOUS_PROVINCIAL' },
      { label: 'Administration technique', href: '/admin', icon: 'shield', roles: ['SUPER_ADMIN'] },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Notifications', href: '/notifications', icon: 'bell', excludeRoles: ['ENSEIGNANT', 'PROMOTEUR', 'SECRETAIRE', 'COMPTABLE'] },
      { label: 'SchoolChat', href: '/schoolchat', icon: 'chat', excludeRoles: ['ENSEIGNANT', 'PROMOTEUR', 'SECRETAIRE', 'COMPTABLE'] },
    ]
  },
  {
    title: 'Services',
    items: [
      { label: 'Paiements & premium', href: '/paiements', icon: 'card', excludeRoles: ['ENSEIGNANT', 'COMPTABLE'] },
      { label: 'Géolocalisation', href: '/geolocalisation', icon: 'location', excludeRoles: ['ENSEIGNANT'] },
      { label: 'Config. géolocalisation', href: '/config-geolocalisation', icon: 'location', excludeRoles: ['ENSEIGNANT'] },
    ]
  },
  {
    title: 'Support',
    items: [
      { label: 'Paramètres', href: '/parametres', icon: 'settings' },
      { label: 'Profil', href: '/profile', icon: 'user' },
    ]
  },
];

/** Aplatit tous les éléments de navigation en une liste simple. */
export const allNavItems: NavItem[] = navigationGroups.flatMap((g) => g.items);

/**
 * Groupes de navigation visibles pour un rôle donné, vides exclus.
 * Règle unique (rang de rôle) partagée par la barre latérale et l'accueil.
 */
export function visibleNavigationGroups(role?: string | null): NavGroup[] {
  if (!role) return navigationGroups;
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles) return item.roles.includes(role);
        if (item.excludeRoles?.includes(role)) return false;
        return !item.minRole || (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[item.minRole] ?? 0);
      })
    }))
    .filter((group) => group.items.length > 0);
}
