'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function VisitesPage() {
  return (
    <ModulePage icon="visit" eyebrow="Administration" title="Visites numériques" description="Planification et suivi des visites et inspections.">
      <CrudManager config={crudConfigs.visites} />
    </ModulePage>
  );
}
