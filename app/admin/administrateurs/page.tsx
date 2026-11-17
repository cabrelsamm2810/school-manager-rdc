import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AppShell } from '@/components/AppShell';
import { AdminManagement } from '@/components/admin/administrateurs/AdminManagement';

export const dynamic = 'force-dynamic';

/**
 * Gestion des administrateurs — Super Administrateur uniquement.
 *
 * Le contrôle est double : `middleware.ts` / `lib/route-access.ts` pour la
 * navigation, puis cette vérification serveur (session + rôle lus en base)
 * avant tout rendu. Les API appliquent la même règle.
 */
export default async function AdminManagementPage() {
  const sessionId = cookies().get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  const user = sessionId
    ? await prisma.user.findFirst({
        where: { id: sessionId, isActive: true },
        select: { id: true, role: true },
      })
    : null;

  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect('/access-denied');

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          <AdminManagement />
        </div>
      </div>
    </AppShell>
  );
}
