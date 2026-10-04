'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function CahierDeNotesPage() {
  return (
    <ModulePage icon="notebook" eyebrow="Gestion scolaire" title="Cahier de notes" description="Saisie et suivi des notes des élèves.">
      <CrudManager config={crudConfigs.notes} />
    </ModulePage>
  );
}
