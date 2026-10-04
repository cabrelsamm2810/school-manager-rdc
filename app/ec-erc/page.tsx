'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function EcErcPage() {
  return (
    <ModulePage icon="organization" eyebrow="Organisation territoriale" title="Gestion EC-ERC" description="Entités EC et ERC de l'organisation scolaire.">
      <CrudManager config={crudConfigs['ec-erc']} />
    </ModulePage>
  );
}
