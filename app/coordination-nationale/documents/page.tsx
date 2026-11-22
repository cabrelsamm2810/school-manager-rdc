'use client';

import { AppShell } from '@/components/AppShell';
import { DocumentSpace } from '@/components/coordination-nationale/DocumentSpace';

/** Espace documentaire de la Coordination nationale EC-ERC. */
export default function NationalDocumentsPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-4xl">
          <DocumentSpace />
        </div>
      </div>
    </AppShell>
  );
}
