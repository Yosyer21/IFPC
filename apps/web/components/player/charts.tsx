import type { CSSProperties } from 'react';

/* ─── Lightweight SVG charts (no dependencies), dark theme ─── */

export interface ChartDatum {
  label: string;
  value: number;
}

/**
 * Radar: categories with values 0-10. Uses pathLength to animate the stroke.
 */
export function RadarChart({
  categories,
  values,
  size = 300,
}: {
  categories: string[];
  values: number[];
  size?: number;
}) {
  const center = size / 2;
  const radius = size / 2 - 34;
  const n = categories.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(10, value)) / 10) * radius;
    return [center + r * Math.cos(angle(i)), center + r * Math.sin(angle(i))] as const;
  };

  const gridPolygons = [2.5, 5, 7.5, 10].map((level) =>
    categories.map((_, i) => point(i, level).join(',')).join(' ')
  );
  const dataPoints = values.map((v, i) => point(i, v).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {/* grid */}
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity={0.7}
        />
      ))}
      {/* radios */}
      {categories.map((_, i) => {
        const [x, y] = point(i, 10);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
        );
      })}
      {/* datos */}
      <polygon
        points={dataPoints}
        fill="hsl(var(--primary))"
        fillOpacity={0.16}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        strokeLinejoin="round"
        pathLength={100}
        className="fb-poly animate-scale-in"
      />
      {values.map((v, i) => {
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r={3} fill="hsl(var(--primary))" />;
      })}
      {/* etiquetas */}
      {categories.map((label, i) => {
        const [x, y] = point(i, 11.2);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="500"
            fill="hsl(var(--muted-foreground))"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Progress ring (donut) with stroke animation.
 */
export function DonutChart({
  value,
  size = 140,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fb-ring"
          style={
            {
              '--ring-max': `${circumference}`,
              '--ring-target': `${target}`,
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{label}</span>
        {sublabel ? (
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Evolution line with gradient area and stroke animation.
 */
export function LineChart({
  points,
  width = 340,
  height = 180,
  gradientId = 'fb-area-gradient',
}: {
  points: ChartDatum[];
  width?: number;
  height?: number;
  gradientId?: string;
}) {
  if (points.length === 0) return null;

  const padX = 20;
  const padY = 22;
  const max = 10;
  const min = 0;
  const x = (i: number) =>
    padX + (i * (width - padX * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) =>
    height - padY - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (height - padY * 2);
  const pts = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const area = `${padX},${height - padY} ${pts} ${x(points.length - 1)},${height - padY}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 5, 10].map((level) => (
        <line
          key={level}
          x1={padX}
          y1={y(level)}
          x2={width - padX}
          y2={y(level)}
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={pts}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={100}
        className="fb-line"
      />
      {points.map((p, i) => (
        <g key={`${p.label}-${i}`}>
          <circle cx={x(i)} cy={y(p.value)} r="3.5" fill="hsl(var(--primary))" />
          <text
            x={x(i)}
            y={height - 4}
            textAnchor="middle"
            fontSize="9"
            fill="hsl(var(--muted-foreground))"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Barras horizontales con crecimiento animado (valores 0-10).
 */
export function CategoryBars({ items }: { items: ChartDatum[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}/10</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="fb-bar h-full rounded-full bg-gradient-to-r from-emerald-700 to-primary"
              style={{ '--bar-target': `${item.value * 10}%` } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Horizontal bars with automatic scale over the maximum (analytics counts).
 */
export function CountsBars({ items }: { items: ChartDatum[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="fb-bar h-full rounded-full bg-gradient-to-r from-emerald-700 to-primary"
              style={{ '--bar-target': `${(item.value / max) * 100}%` } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
