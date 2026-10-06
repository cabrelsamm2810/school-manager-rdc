'use client';

import { ModulePage } from '@/components/ModulePage';

export default function ScannerElevePage() {
  return (
    <ModulePage
      icon="scan"
      eyebrow="Espace enseignant"
      title="Scanner un élève"
      description="Scannez le QR code d'un élève pour accéder à son profil et son parcours."
    />
  );
}
