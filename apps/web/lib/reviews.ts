/** Media de valoraciones (1–5) con un decimal; `null` si no hay ninguna válida. */
export function averageRating(values: number[]): number | null {
  const valid = values.filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
  if (valid.length === 0) return null;
  const avg = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}
