'use client';

import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';

export default function NotificationsPage() {
  return (
    <ModulePage icon="bell" eyebrow="Communication" title="Notifications" description="Notifications système et alertes.">
      <CrudManager config={crudConfigs.notifications} />
    </ModulePage>
  );
}
