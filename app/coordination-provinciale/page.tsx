'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function CoordinationProvincialePage() {
  return (
    <ModulePage icon="region" eyebrow="Organisation territoriale" title="Coordination provinciale" description="Bureaux, agents et dossiers par province.">
      <CrudManager config={crudConfigs['coordination-provinciale']} />
    </ModulePage>
  );
}
