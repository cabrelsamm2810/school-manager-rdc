/**
 * Graphiques SVG légers — sans dépendance externe.
 * DonutChart : répartition (parts).
 * BarCompare : barres horizontales comparatives.
 */

const PALETTE = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#ec4899', '#14b8a6', '#6366f1', '#eab308'];

type DonutSegment = { label: string; value: number };

export function DonutChart({ data, size = 132, thickness = 24, centerLabel, centerValue }: {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total > 0 ? data.map((seg, i) => {
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return el;
          }) : (
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
          )}
        </g>
        {centerValue !== undefined && (
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-2xl font-bold">
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[10px] uppercase tracking-wide">
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="flex-1 space-y-2">
        {data.length > 0 ? data.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 truncate text-slate-600">{seg.label}</span>
            <span className="font-semibold text-slate-800">{seg.value.toLocaleString('fr-FR')}</span>
          </div>
        )) : (
          <p className="text-sm text-slate-400">Aucune donnée</p>
        )}
      </div>
    </div>
  );
}

type BarItem = { label: string; value: number; color?: string };

export function BarCompare({ items, unit = '', height = 150 }: {
  items: BarItem[];
  unit?: string;
  height?: number;
}) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  // Échelle : la plus grande valeur occupe toute la hauteur, les autres restent
  // proportionnelles mais conservent une hauteur minimale lisible (5 enseignants
  // face à 281 élèves ne doivent pas s'écraser sur quelques pixels).
  const MIN_BAR = 8;
  const maxBar = height - 34;
  const usable = maxBar - MIN_BAR;

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: maxBar }}>
        {items.map((item, i) => {
          const barH = item.value === 0 ? 2 : MIN_BAR + Math.round((item.value / maxVal) * usable);
          return (
            <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-sm font-semibold text-slate-700">
                {item.value.toLocaleString('fr-FR')}{unit}
              </span>
              <div
                className="rounded-t-md transition-all duration-500"
                style={{ height: barH, width: '70%', background: item.color ?? PALETTE[i % PALETTE.length], opacity: 0.85 }}
                title={`${item.label} : ${item.value.toLocaleString('fr-FR')}${unit}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex-1 text-center">
            <span className="block truncate text-[11px] text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
