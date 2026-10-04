'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function EnseignantsPage() {
  return (
    <ModulePage icon="teacher" eyebrow="Gestion scolaire" title="Gestion des enseignants" description="Recensement, affectation et suivi des enseignants.">
      <CrudManager config={crudConfigs.enseignants} />
    </ModulePage>
  );
}
