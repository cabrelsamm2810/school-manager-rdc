import { ErcLogo } from '@/components/ui/ErcLogo';
import { Icon } from '@/components/ui/Icon';

/**
 * En-tête institutionnel de l'espace Coordination nationale EC-ERC.
 * Thème bleu institutionnel et blanc, commun aux pages du niveau national.
 */
export function NationalHeader({
  title,
  description,
  eyebrow = 'Coordination nationale · EC-ERC',
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-950 via-brand-800 to-brand-700 p-5 text-white shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/5" />
      <div className="relative flex items-start gap-4">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
          <ErcLogo size={80} />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-200">{eyebrow}</p>
          <h1 className="mt-1 text-lg font-bold leading-tight md:text-2xl">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-brand-100">{description}</p>
          )}
        </div>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/25 sm:flex">
          <Icon name="lock" className="h-3.5 w-3.5" /> Accès national
        </span>
      </div>
    </div>
  );
}
