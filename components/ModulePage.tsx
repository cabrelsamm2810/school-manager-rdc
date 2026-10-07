import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

/**
 * Page de module réutilisable. Affiche un en-tête cohérent
 * et un emplacement de contenu dans le AppShell.
 */
export function ModulePage({
  title,
  eyebrow,
  description,
  icon,
  children
}: {
  title: string;
  eyebrow?: string;
  icon: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            action={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon name={icon} className="h-5 w-5" />
              </div>
            }
          />
          {children ?? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Icon name={icon} className="h-7 w-7" />
              </div>
              <p className="text-lg font-semibold text-slate-700">{title}</p>
              <p className="mt-2 text-sm text-slate-500">
                Ce module est en cours de développement. La structure et la navigation sont en place.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
