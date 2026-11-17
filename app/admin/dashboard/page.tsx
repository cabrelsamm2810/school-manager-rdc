import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AppShell } from '@/components/AppShell';
import { AdminDashboardView } from '@/components/dashboards/AdminDashboardView';
import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { resolveFileUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * Espace administrateur — Admin School Manager RDC.
 *
 * La session, le rôle et l'activation du compte sont vérifiés côté serveur
 * avant tout rendu : un compte désactivé est renvoyé vers la connexion.
 */
export default async function AdminDashboardPage() {
  const sessionId = cookies().get(process.env.SESSION_COOKIE_NAME || 'school_manager_session')?.value;
  const user = sessionId
    ? await prisma.user.findFirst({
        where: { id: sessionId, isActive: true },
        select: {
          id: true, nom: true, postNom: true, prenom: true, email: true, telephone: true,
          role: true, userStatus: true, profilePhotoUrl: true, createdAt: true,
        },
      })
    : null;

  if (!user) redirect('/login');
  if (user.role !== 'ADMIN_SCHOOL_MANAGER_RDC' && user.role !== 'SUPER_ADMIN') redirect('/access-denied');

  return (
    <AppShell>
      <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-6xl">
          <AdminDashboardView
            profile={{
              id: user.id,
              nom: user.nom,
              postNom: user.postNom,
              prenom: user.prenom,
              email: user.email,
              telephone: user.telephone,
              role: user.role,
              userStatus: user.userStatus,
              profilePhotoUrl: await resolveFileUrl(user.profilePhotoUrl),
              createdAt: user.createdAt.toISOString(),
            }}
            permissions={ROLE_PERMISSIONS[user.role] ?? []}
          />
        </div>
      </div>
    </AppShell>
  );
}
