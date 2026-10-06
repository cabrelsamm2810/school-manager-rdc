'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function ClassesRdcPage() {
  return (
    <ModulePage icon="school" eyebrow="Curriculum national" title="Classes & Niveaux" description="Les classes et niveaux officiels du système éducatif congolais (MINEDU-NC) : maternel, primaire, CTEB et humanités.">
      <CrudManager config={crudConfigs['classes-rdc']} />
    </ModulePage>
  );
}
