import { ModulePage } from '@/components/ModulePage';

export default function AdminUsersPage() {
  return (
    <ModulePage
      icon="people"
      eyebrow="Administration"
      title="Gestion des utilisateurs"
      description="Création, activation, rôles et permissions des comptes utilisateurs."
    />
  );
}
