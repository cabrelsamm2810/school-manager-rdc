'use client';

import { AppShell } from '@/components/AppShell';
import { Communications } from '@/components/coordination-nationale/Communications';

/** Communications officielles de la Coordination nationale vers les provinces. */
export default function NationalCommunicationsPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-4xl">
          <Communications />
        </div>
      </div>
    </AppShell>
  );
}
