'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function BureauxFonctionsPage() {
  return (
    <ModulePage icon="office" eyebrow="Administration" title="Bureaux & fonctions" description="Bureaux administratifs, fonctions et titulaires.">
      <CrudManager config={crudConfigs['bureaux-fonctions']} />
    </ModulePage>
  );
}
