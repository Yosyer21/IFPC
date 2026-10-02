export interface ProgressProps {
  value: number; // 0-100
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
