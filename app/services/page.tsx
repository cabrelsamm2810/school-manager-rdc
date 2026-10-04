'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function ServicesPage() {
  return (
    <ModulePage icon="services" eyebrow="Administration" title="Services administratifs" description="Services, procédures et dossiers administratifs.">
      <CrudManager config={crudConfigs.services} />
    </ModulePage>
  );
}
