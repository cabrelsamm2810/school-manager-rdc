/**
 * Graphiques SVG légers — sans dépendance externe.
 * DonutChart : répartition (parts).
 * BarCompare : barres horizontales comparatives.
 */

const PALETTE = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#ec4899', '#14b8a6', '#6366f1', '#eab308'];

type DonutSegment = { label: string; value: number };

export function DonutChart({ data, size = 160, thickness = 28, centerLabel, centerValue }: {
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

export function BarCompare({ items, unit = '', height = 180 }: {
  items: BarItem[];
  unit?: string;
  height?: number;
}) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const barWidth = 100 / Math.max(items.length, 1);

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
        {/* Lignes de repère */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1="0" x2="100" y1={height - p * (height - 30) - 20} y2={height - p * (height - 30) - 20} stroke="#f1f5f9" strokeWidth="0.3" />
        ))}
        {items.map((item, i) => {
          const barH = (item.value / maxVal) * (height - 30);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - barH - 20;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={w} height={barH} rx="1.5" fill={item.color ?? PALETTE[i % PALETTE.length]} opacity="0.85">
                <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={height - 20} to={y} dur="0.6s" fill="freeze" />
              </rect>
              <text x={x + w / 2} y={y - 1.5} textAnchor="middle" className="fill-slate-700 text-[3px] font-semibold">
                {item.value.toLocaleString('fr-FR')}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex">
        {items.map((item, i) => (
          <div key={item.label} className="flex-1 text-center" style={{ width: `${barWidth}%` }}>
            <span className="block truncate text-[11px] text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
