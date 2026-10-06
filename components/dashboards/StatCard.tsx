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
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
};

export function StatCard({ label, value, hint, icon, color = 'blue', delay = 0 }: StatCardProps) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div
      className="dash-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
