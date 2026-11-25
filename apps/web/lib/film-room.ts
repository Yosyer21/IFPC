/** Film Room: categorías, estados y utilidades de marca de tiempo (mm:ss). */

export const FILM_CLIP_CATEGORIES = ['HEAD_GAME', 'BUILD', 'ON_THE_BALL', 'FUEL'] as const;
export type FilmClipCategoryValue = (typeof FILM_CLIP_CATEGORIES)[number];

export const FILM_CLIP_CATEGORY_LABELS: Record<FilmClipCategoryValue, string> = {
  HEAD_GAME: 'Head Game',
  BUILD: 'Build',
  ON_THE_BALL: 'On the Ball',
  FUEL: 'Fuel',
};

export const FILM_CLIP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Waiting for feedback',
  REVIEWED: 'Coach replied',
};

/** `"1:05"` → 65 segundos. Acepta `"ss"`, `"mm:ss"` y `"h:mm:ss"`. */
export function parseTimestamp(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(':');
  if (parts.length === 0 || parts.length > 3) return null;
  const nums = parts.map((part) => Number(part));
  if (nums.some((num) => !Number.isInteger(num) || num < 0)) return null;
  const [a = 0, b = 0, c = 0] = nums;
  if (nums.length === 1) return a;
  if (nums.length === 2) return a * 60 + b;
  return a * 3600 + b * 60 + c;
}

/** 65 → `"1:05"`. */
export function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
