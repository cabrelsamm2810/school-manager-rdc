import { AppShell } from '@/components/AppShell';
import { NationalHeader } from '@/components/national/NationalHeader';
import { NationalNav } from '@/components/national/NationalNav';
import { CoordinationManager } from '@/components/national/CoordinationManager';

export default function CoordinationNationaleCoordinationPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <NationalHeader
            title="Gestion administrative nationale"
            description="Comptes des coordinateurs provinciaux, supervision des sous-coordinations, consultation des établissements et suivi des activités nationales."
            eyebrow="Coordination nationale · Administration"
          />
          <NationalNav />
          <CoordinationManager />
        </div>
      </div>
    </AppShell>
  );
}
