'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { DocumentsRecusSummary } from '@/components/coordination/DocumentsRecusSummary';
import { crudConfigs } from '@/lib/crud-configs';

export default function CoordinationSousProvincialePage() {
  return (
    <ModulePage icon="district" eyebrow="Organisation territoriale" title="Coordination sous-provinciale" description="Sous-divisions provinciales et leurs effectifs.">
      <div className="mb-4">
        <DocumentsRecusSummary detailHref="/coordination-sous-provinciale/ecoles-en-attente" />
      </div>
      <CrudManager config={crudConfigs['coordination-sous-provinciale']} />
    </ModulePage>
  );
}
