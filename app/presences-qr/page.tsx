'use client';

import { ModulePage } from '@/components/ModulePage';

export default function PresencesQrPage() {
  return (
    <ModulePage
      icon="qr"
      eyebrow="Espace enseignant"
      title="Présences / QR"
      description="Marquez les présences par scan QR code et suivez l'assistance en classe."
    />
  );
}
