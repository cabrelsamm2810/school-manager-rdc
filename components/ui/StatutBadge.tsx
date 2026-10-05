import { Badge } from './Badge';

const STATUS_MAP: Record<string, { color: 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'purple'; label: string }> = {
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
  'Annulée': { color: 'red', label: 'Annulée' },
  'Générée': { color: 'green', label: 'Générée' },
  'Validée': { color: 'green', label: 'Validée' },
  'Manquante': { color: 'red', label: 'Manquante' },
  'En pause': { color: 'amber', label: 'En pause' },
  'Payé': { color: 'green', label: 'Payé' },
  'Brouillon': { color: 'slate', label: 'Brouillon' },
  'En attente de vérification': { color: 'amber', label: 'En attente de vérification' },
  'En cours de vérification': { color: 'blue', label: 'En cours de vérification' },
  'Validée': { color: 'green', label: 'Validée' },
  'Rejetée': { color: 'red', label: 'Rejetée' },
  'Suspendue': { color: 'purple', label: 'Suspendue' },
};

export function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUS_MAP[statut] ?? { color: 'slate' as const, label: statut };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}
