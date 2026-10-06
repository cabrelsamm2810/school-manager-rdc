import { clsx } from 'clsx';

export type Column<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
};

/** Tableau de données réutilisable avec version desktop (table) et mobile (cartes). */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  mobileCard
}: {
  columns: Column<T>[];
  data: T[];
  mobileCard?: (item: T) => React.ReactNode;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={clsx('px-4 py-3', col.className)}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className={clsx('px-4 py-3', col.className)}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((item, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
            {mobileCard ? mobileCard(item) : (
              <div className="space-y-1">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-500">{col.label}</span>
                    <span className="text-right font-medium text-slate-900">
                      {col.render ? col.render(item) : item[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
