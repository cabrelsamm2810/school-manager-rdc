'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function OptionsRdcPage() {
  return (
    <ModulePage icon="organization" eyebrow="Curriculum national" title="Options & Sections" description="Les sections et options officielles du secondaire congolais (MINEDU-NC) : sections générales et options techniques.">
      <CrudManager config={crudConfigs['options-rdc']} />
    </ModulePage>
  );
}
