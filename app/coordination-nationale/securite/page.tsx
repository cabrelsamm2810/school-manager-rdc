import { AppShell } from '@/components/AppShell';
import { NationalHeader } from '@/components/national/NationalHeader';
import { NationalNav } from '@/components/national/NationalNav';
import { SecurityPanel } from '@/components/national/SecurityPanel';

export default function CoordinationNationaleSecuritePage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <NationalHeader
            title="Sécurité & journal des opérations"
            description="Contrôle des permissions par rôle, accès national réservé et historique complet des opérations."
            eyebrow="Coordination nationale · Sécurité"
          />
          <NationalNav />
          <SecurityPanel />
        </div>
      </div>
    </AppShell>
  );
}
