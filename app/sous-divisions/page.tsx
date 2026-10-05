'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function SousDivisionsPage() {
  return (
    <ModulePage icon="district" eyebrow="Organisation territoriale" title="Sous-divisions éducationnelles" description="Les sous-divisions de chaque province éducationnelle de l'EPST, avec leur lieu d'implantation.">
      <CrudManager config={crudConfigs['sous-divisions']} />
    </ModulePage>
  );
}
