import { Icon } from '@/components/ui/Icon';

export type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: string;
  color?: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan';
  delay?: number;
};

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' }
};

/** Carte statistique compacte — les valeurs affichées proviennent toujours de l'API. */
export function StatCard({ label, value, hint, icon, color = 'blue', delay = 0 }: StatCardProps) {
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div
      className="dash-card group rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-3.5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1.5 tabular-nums text-xl font-bold leading-none text-slate-900 sm:text-2xl">
            {value}
          </p>
          {hint && <p className="mt-1 truncate text-[11px] text-slate-400">{hint}</p>}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.text}`}
        >
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  );
}
