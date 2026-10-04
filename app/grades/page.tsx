'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function GradesPage() {
  return (
    <ModulePage icon="badge" eyebrow="Administration" title="Gestion des grades" description="Grades administratifs et enseignants, catégories et effectifs.">
      <CrudManager config={crudConfigs.grades} />
    </ModulePage>
  );
}
