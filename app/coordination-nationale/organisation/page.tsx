import { AppShell } from '@/components/AppShell';
import { NationalHeader } from '@/components/national/NationalHeader';
import { NationalNav } from '@/components/national/NationalNav';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

/** Référentiel historique de la coordination nationale par province (CRUD existant, conservé). */
export default function CoordinationNationaleOrganisationPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <NationalHeader
            title="Référentiel national par province"
            description="Coordonnateur, écoles et élèves de référence pour chaque province."
            eyebrow="Coordination nationale · Référentiel"
          />
          <NationalNav />
          <CrudManager config={crudConfigs['coordination-nationale']} />
        </div>
      </div>
    </AppShell>
  );
}
