'use client';

import { AppShell } from '@/components/AppShell';
import { NationalUsersManager } from '@/components/coordination-nationale/NationalUsersManager';

/** Comptes et permissions de la sphère EC-ERC, vus depuis la Coordination nationale. */
export default function NationalUsersPage() {
  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          <NationalUsersManager />
        </div>
      </div>
    </AppShell>
  );
}
