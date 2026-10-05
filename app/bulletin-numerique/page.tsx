'use client';

import { ModulePage } from '@/components/ModulePage';
import { BulletinNumeriqueManager } from '@/components/bulletin-numerique/BulletinNumeriqueManager';

export default function BulletinNumeriquePage() {
  return (
    <ModulePage
      icon="notebook"
      eyebrow="Gestion scolaire"
      title="Bulletin numérique"
      description="Consultation, aperçu, impression et vérification QR des bulletins générés à partir du Cahier de cote."
    >
      <BulletinNumeriqueManager />
    </ModulePage>
  );
}
