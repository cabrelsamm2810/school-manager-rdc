'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function ProvincesPage() {
  return (
    <ModulePage icon="globe" eyebrow="Organisation territoriale" title="Gestion des provinces" description="Recensement et suivi des provinces administratives.">
      <CrudManager config={crudConfigs.provinces} />
    </ModulePage>
  );
}
