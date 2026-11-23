import { AppShell } from '@/components/AppShell';
import { NationalHeader } from '@/components/national/NationalHeader';
import { NationalNav } from '@/components/national/NationalNav';
import { NetworkDirectory } from '@/components/national/NetworkDirectory';

/** Réseau scolaire national : toutes les écoles, tous les élèves, tous les enseignants. */
export default function ReseauNationalPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <NationalHeader
            title="Réseau scolaire national"
            description="Toutes les écoles, tous les élèves et tous les enseignants des Écoles Conventionnées des Églises du Réveil du Congo."
            eyebrow="Coordination nationale · Réseau"
          />
          <NationalNav />
          <NetworkDirectory />
        </div>
      </div>
    </AppShell>
  );
}
