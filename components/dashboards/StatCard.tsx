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

/** Carte statistique moderne — les valeurs affichées proviennent toujours de l'API. */
export function StatCard({ label, value, hint, icon, color = 'blue', delay = 0 }: StatCardProps) {
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div
      className="dash-card group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-5"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 tabular-nums text-2xl font-bold leading-none text-slate-900 sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text}`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
