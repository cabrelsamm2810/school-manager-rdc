'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function ProvincesEducationnellesPage() {
  return (
    <ModulePage icon="school" eyebrow="Organisation territoriale" title="Provinces éducationnelles" description="Les 60 provinces éducationnelles de l'EPST réparties dans les 26 provinces administratives.">
      <CrudManager config={crudConfigs['provinces-educationnelles']} />
    </ModulePage>
  );
}
