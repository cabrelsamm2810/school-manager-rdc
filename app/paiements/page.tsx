'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function PaiementsPage() {
  return (
    <ModulePage icon="card" eyebrow="Services" title="Paiements & premium" description="Suivi des paiements et abonnements.">
      <CrudManager config={crudConfigs.paiements} />
    </ModulePage>
  );
}
