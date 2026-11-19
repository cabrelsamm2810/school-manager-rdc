import { AppShell } from '@/components/AppShell';
import { NationalHeader } from '@/components/national/NationalHeader';
import { NationalNav } from '@/components/national/NationalNav';
import { DocumentsManager } from '@/components/national/DocumentsManager';

export default function CoordinationNationaleDocumentsPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5 lg:py-6">
        <div className="mx-auto max-w-6xl">
          <NationalHeader
            title="Documents institutionnels"
            description="Circulaires, décisions, lettres officielles, rapports provinciaux et documents administratifs du niveau national."
            eyebrow="Coordination nationale · Documents"
          />
          <NationalNav />
          <DocumentsManager />
        </div>
      </div>
    </AppShell>
  );
}
