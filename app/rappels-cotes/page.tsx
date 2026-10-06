'use client';

import { ModulePage } from '@/components/ModulePage';
import { RappelsCotesManager } from '@/components/rappels-cotes/RappelsCotesManager';

export default function RappelsCotesPage() {
  return (
    <ModulePage
      icon="bell"
      eyebrow="Gestion scolaire"
      title="Rappels automatiques de cotes"
      description="Suivi et relance des enseignants qui n'ont pas encore saisi leurs cotes pour la période en cours."
    >
      <RappelsCotesManager />
    </ModulePage>
  );
}
