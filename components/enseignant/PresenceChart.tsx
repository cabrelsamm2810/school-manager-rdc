'use client';

/**
 * Graphique à barres léger (CSS/Tailwind, sans dépendance) pour les taux de présence.
 * Affiche présents (vert), retards (ambre) et absents (rouge) en barres empilées,
 * avec le taux de présence en étiquette.
 */
type ChartRow = { label: string; present: number; retard: number; absent: number; taux: number };

export function PresenceChart({ rows, maxTotal }: { rows: ChartRow[]; maxTotal: number }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Aucune donnée à afficher.</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px]">
        {rows.map((row, i) => {
          const presentPct = maxTotal > 0 ? (row.present / maxTotal) * 100 : 0;
          const retardPct = maxTotal > 0 ? (row.retard / maxTotal) * 100 : 0;
          const absentPct = maxTotal > 0 ? (row.absent / maxTotal) * 100 : 0;

          return (
            <div key={i} className="mb-2.5 flex items-center gap-3">
              <div className="w-20 shrink-0 truncate text-xs font-medium text-slate-500">
                {row.label}
              </div>
              <div className="relative h-[22px] flex-1 overflow-hidden rounded-lg bg-slate-100">
                <div className="flex h-full w-full">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${presentPct}%` }}
                    title={`Présents: ${row.present}`}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${retardPct}%` }}
                    title={`Retards: ${row.retard}`}
                  />
                  <div
                    className="h-full bg-red-300 transition-all duration-300"
                    style={{ width: `${absentPct}%` }}
                    title={`Absents: ${row.absent}`}
                  />
                </div>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {row.taux}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Légende */}
        <div className="mt-4 flex items-center gap-4 pl-20">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
            <span className="text-xs text-slate-500">Présents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-amber-400" />
            <span className="text-xs text-slate-500">Retards</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-red-300" />
            <span className="text-xs text-slate-500">Absents</span>
          </div>
        </div>
      </div>
    </div>
  );
}
