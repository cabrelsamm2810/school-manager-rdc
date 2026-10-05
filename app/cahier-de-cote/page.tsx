'use client';

import { ModulePage } from '@/components/ModulePage';
import { CahierDeCoteManager } from '@/components/cahier-de-cote/CahierDeCoteManager';

export default function CahierDeCotePage() {
  return (
    <ModulePage
      icon="notebook"
      eyebrow="Gestion scolaire"
      title="Cahier de cote"
      description="Saisie des cotes, calcul automatique et génération de bulletins numériques avec QR code."
    >
      <CahierDeCoteManager />
    </ModulePage>
  );
}
