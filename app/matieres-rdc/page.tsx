'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function MatieresRdcPage() {
  return (
    <ModulePage icon="notebook" eyebrow="Curriculum national" title="Matières & Cours" description="Les matières et cours officiels du programme national de la RDC (MINEDU-NC) par cycle d'enseignement.">
      <CrudManager config={crudConfigs['matieres-rdc']} />
    </ModulePage>
  );
}
