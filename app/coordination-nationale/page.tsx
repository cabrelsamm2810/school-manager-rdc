import { AppShell } from '@/components/AppShell';
import { NationalHeader } from '@/components/national/NationalHeader';
import { NationalNav } from '@/components/national/NationalNav';
import { NationalDashboardView } from '@/components/national/NationalDashboardView';

export default function CoordinationNationalePage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <NationalHeader
            title="Coordination nationale EC-ERC"
            description="Niveau national de supervision des coordinations provinciales et sous-provinciales des Écoles Conventionnées des Églises du Réveil du Congo."
          />
          <NationalNav />
          <NationalDashboardView />
        </div>
      </div>
    </AppShell>
  );
}
