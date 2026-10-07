import { clsx } from 'clsx';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card', className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>}
        <h1 className="mt-1.5 text-xl font-bold text-slate-900 md:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  color = 'brand'
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
  color?: 'brand' | 'green' | 'amber' | 'red' | 'slate';
}) {
  const colorMap = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-600', iconBg: 'bg-brand-100', iconText: 'text-brand-600' },
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', iconText: 'text-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', iconBg: 'bg-slate-100', iconText: 'text-slate-500' },
  };
  const c = colorMap[color];

  return (
    <div className={clsx('rounded-2xl border border-slate-200/80 p-4 shadow-card', c.bg)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && (
          <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', c.iconBg)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={clsx('h-4 w-4', c.iconText)}>
              <path d={icon} />
            </svg>
          </span>
        )}
      </div>
      <p className={clsx('mt-2 text-2xl font-bold', c.text)}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
