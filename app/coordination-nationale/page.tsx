'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function CoordinationNationalePage() {
  return (
    <ModulePage icon="flag" eyebrow="Organisation territoriale" title="Coordination nationale" description="Coordination nationale par province.">
      <CrudManager config={crudConfigs['coordination-nationale']} />
    </ModulePage>
  );
}
