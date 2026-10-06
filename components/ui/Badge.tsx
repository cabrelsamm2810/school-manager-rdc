import { clsx } from 'clsx';

const colors: Record<string, string> = {
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-50 text-purple-700',
};

export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: keyof typeof colors }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color])}>
      {children}
    </span>
  );
}
