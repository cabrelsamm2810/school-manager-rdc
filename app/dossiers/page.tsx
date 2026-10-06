'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function DossiersPage() {
  return (
    <ModulePage icon="folder" eyebrow="Administration" title="Gestion des dossiers" description="Suivi des dossiers administratifs et demandes.">
      <CrudManager config={crudConfigs.dossiers} />
    </ModulePage>
  );
}
