'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

/**
 * Coordination nationale par province (tableau historique conservé).
 * Les données restent celles de la table `coord_nationale`.
 */
export default function CoordinationNationaleProvincesPage() {
  return (
    <ModulePage
      icon="flag"
      eyebrow="Organisation territoriale"
      title="Coordination nationale"
      description="Coordination nationale par province."
    >
      <CrudManager config={crudConfigs['coordination-nationale']} />
    </ModulePage>
  );
}
