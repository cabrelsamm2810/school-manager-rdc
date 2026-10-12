'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { DocumentsRecusSummary } from '@/components/coordination/DocumentsRecusSummary';
import { crudConfigs } from '@/lib/crud-configs';

export default function CoordinationProvincialePage() {
  return (
    <ModulePage icon="region" eyebrow="Organisation territoriale" title="Coordination provinciale" description="Bureaux, agents et dossiers par province.">
      <div className="mb-4">
        <DocumentsRecusSummary detailHref="/coordination-provinciale/ecoles-en-attente" />
      </div>
      <CrudManager config={crudConfigs['coordination-provinciale']} />
    </ModulePage>
  );
}
