/**
 * THE "1%" FACTOR — hub de salud.
 *
 * El contenido es **curado en código** (no hay modelo en base de datos): cada
 * factor es un hábito pequeño que, repetido, mueve la aguja más que cualquier
 * gesto grande y aislado. Este fichero es la **única fuente de verdad**: la
 * portada del hub pinta su rejilla desde aquí y la ficha de cada factor se genera
 * a partir de esta lista, así que añadir uno nuevo es añadir una entrada.
 */

/** Tonos disponibles (las familias que ya usa el dashboard). */
export const HEALTH_TONES = ['violet', 'cyan', 'emerald', 'amber', 'sky', 'brand', 'lime'] as const;
export type HealthTone = (typeof HEALTH_TONES)[number];

export interface HealthFactor {
  slug: string;
  title: string;
  /** Clave del icono en el mapa `ICONS` de `components/dashboard/icons`. */
  icon: string;
  tone: HealthTone;
  /** Gancho de una línea para la tarjeta. */
  tagline: string;
  /** La acción única, en una línea: la que cabe en el «cheat sheet» y en «Hoy: el 1 %». */
  quickAction: string;
  /** Slugs de factores que van de la mano (se enlazan en la ficha). */
  related: string[];
  /** Qué es y por qué cuenta, en un par de frases. */
  summary: string;
  /** El mecanismo: qué pasa cuando se hace (o cuando no). */
  why: string;
  /** Acciones concretas y ejecutables, sin material de laboratorio. */
  habits: string[];
  /** Cómo saber que funciona (la señal observable). */
  metric: string;
}

/** Chip del icono de cada factor. */
export const FACTOR_CHIP_CLASSES: Record<HealthTone, string> = {
  violet: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
  cyan: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  sky: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  brand: 'border-brand/40 bg-brand/10 text-brand',
  lime: 'border-lime-300/40 bg-lime-400/10 text-lime-200',
};

/** Punto de color (listas y encabezados). */
export const FACTOR_DOT_CLASSES: Record<HealthTone, string> = {
  violet: 'bg-violet-400',
  cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  sky: 'bg-sky-400',
  brand: 'bg-brand',
  lime: 'bg-lime-300',
};

export const HEALTH_FACTORS: HealthFactor[] = [
  {
    slug: 'sleep',
    title: 'Sleep',
    icon: 'moon',
    tone: 'violet',
    tagline: 'The cheapest performance enhancer you own',
    quickAction: 'Set one bedtime tonight and keep it for a week.',
    related: ['recovery', 'consistency'],
    summary:
      'Sleep is where training becomes adaptation: muscle repair, growth hormone and learning all happen while you are out.',
    why: 'One night under six hours already slows reaction time and cuts sprint capacity, and it raises injury risk. You cannot out-train it and nothing you can buy replaces it.',
    habits: [
      'Same bedtime and wake-up every day, match days included (within 30 minutes).',
      'Screens off an hour before bed; room dark, quiet and on the cool side.',
      'No caffeine after 14:00 — it stays in your system for around six hours.',
      'A 20-minute nap after morning sessions when your schedule allows it.',
    ],
    metric: '7–9 hours, at the same two times, seven days a week.',
  },
  {
    slug: 'hydration',
    title: 'Hydration',
    icon: 'droplet',
    tone: 'cyan',
    tagline: 'A 2% drop in body water costs you speed',
    quickAction: 'Drink 500 ml of water when you wake up.',
    related: ['fuel', 'recovery'],
    summary:
      'Muscles, joints and blood all run on water. Losing 2% of your body weight in fluid measurably cuts power and clear thinking.',
    why: 'Dehydrated blood is thicker, so your heart works harder for the same run and the signals from brain to muscle slow down. The drop starts before you feel thirsty.',
    habits: [
      'Start the day with 400–500 ml of water, before anything else.',
      'Sip 150–250 ml every 15–20 minutes of training instead of drinking it all at once.',
      'Add electrolytes when a session goes past an hour or the weather is hot.',
      'Use the colour check: pale straw is fine, dark yellow is not.',
    ],
    metric: 'Pale straw urine and under 2% body-weight loss across a session.',
  },
  {
    slug: 'fuel',
    title: 'Fuel',
    icon: 'apple',
    tone: 'emerald',
    tagline: 'Eat for the session you are about to have',
    quickAction: 'Eat a carbohydrate meal three hours before training.',
    related: ['hydration', 'recovery'],
    summary:
      'Carbohydrates are the petrol and protein is the repair kit. When you eat matters almost as much as what you eat.',
    why: 'Turning up under-fuelled forces the body to burn its own muscle and blunts exactly the adaptation you trained for. Recovery begins in the first 30 minutes after the whistle.',
    habits: [
      'Carbohydrate 2–3 hours before training, keeping fat and fibre low at that meal.',
      '20–30 g of protein within 30 minutes of finishing.',
      'Real food first: fruit, rice, eggs, yoghurt, fish, beans.',
      'Never train fasted on match day.',
    ],
    metric: 'No two sessions in a row on an empty tank.',
  },
  {
    slug: 'recovery',
    title: 'Recovery',
    icon: 'heart',
    tone: 'amber',
    tagline: 'You get fit while you rest, not while you train',
    quickAction: 'Book one full rest day this week and defend it.',
    related: ['sleep', 'mobility'],
    summary:
      'Training is the stimulus; rest is where the body actually gets stronger. Rest days are part of the plan, not a break from it.',
    why: 'Stacking hard sessions without recovery raises resting heart rate, disturbs sleep and turns a niggle into an injury. Adaptation is blocked when the body never gets the chance to rebuild.',
    habits: [
      'One full rest day a week, and treat it as scheduled work.',
      'Hard days hard, easy days genuinely easy — no grey middle.',
      'Keep a simple check-in: sleep, mood, soreness, resting heart rate.',
      'If two markers are off, swap the session for recovery.',
    ],
    metric: 'You finish the week able to train again, not needing to survive it.',
  },
  {
    slug: 'mobility',
    title: 'Mobility',
    icon: 'stretch',
    tone: 'sky',
    tagline: 'Ten minutes now, or three months in the physio room',
    quickAction: 'Five minutes on ankles and hips before every session.',
    related: ['recovery', 'consistency'],
    summary:
      'Ankles, hips and hamstrings set how much of your strength actually reaches the pitch. Mobility is what keeps the machine moving.',
    why: 'Stiff ankles and hips make the knee and lower back absorb the work that should be spread across the whole chain. Most soft-tissue injuries are the bill for a range of movement you never had.',
    habits: [
      'A 5-minute ankle and hip routine before every session, boots on.',
      'Take one joint through its full range daily: ankles, hips, thoracic spine.',
      'Warm up progressively — from easy to fast, never straight to sprinting.',
      'Add 10 minutes of mobility work to an easy or rest day.',
    ],
    metric: 'You can get into the positions your position demands, on both sides.',
  },
  {
    slug: 'mind',
    title: 'Mind',
    icon: 'bulb',
    tone: 'brand',
    tagline: 'The five minutes before you play',
    quickAction: 'Two minutes of slow breathing before kick-off.',
    related: ['consistency', 'sleep'],
    summary:
      'Focus, self-talk and breathing decide how much of your training shows up in the match. The mental side is trainable like any other.',
    why: 'Under pressure the body tightens and breathing goes shallow, which costs technique first and decisions second. A repeatable pre-match routine keeps the body loose and the attention where the game is.',
    habits: [
      'Same short routine before every session: music, breathing, one clear intention.',
      'Name the mistake, then reset — no replaying it in your head.',
      'Slow breathing in for four, out for six, for two minutes to settle nerves.',
      'Write down one thing you did well and one to fix, right after the match.',
    ],
    metric: 'You can name your intention before kick-off and still follow it at the end.',
  },
  {
    slug: 'consistency',
    title: 'Consistency',
    icon: 'repeat',
    tone: 'lime',
    tagline: 'One percent a day is 37 times a year',
    quickAction: 'Pick one factor and hold it for fourteen days.',
    related: ['sleep', 'mind'],
    summary:
      'The other factors only work if they happen on ordinary days, not just on the good ones. This is the factor that multiplies the rest.',
    why: 'Small habits compound: 1% better every day for a year is about 37 times better, and 1% worse every day leaves you at almost nothing. The gap between players is rarely one big session — it is hundreds of small ones.',
    habits: [
      'Pick one factor and hold it for two weeks before adding the next.',
      'Attach the habit to something you already do (after training, before bed).',
      'Track it visibly — a tick on the wall beats a good intention.',
      'Never miss twice: one skipped day is noise, two is a new pattern.',
    ],
    metric: 'Four weeks in a row where the habit survived a bad day.',
  },
];

/** Un factor por su slug (o `undefined` si no existe). */
export function getHealthFactor(slug: string): HealthFactor | undefined {
  return HEALTH_FACTORS.find((factor) => factor.slug === slug);
}

/** Factor anterior y siguiente de la lista (para la navegación de la ficha). */
export function factorNeighbours(slug: string): {
  previous: HealthFactor | null;
  next: HealthFactor | null;
} {
  const index = HEALTH_FACTORS.findIndex((factor) => factor.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: HEALTH_FACTORS[index - 1] ?? null,
    next: HEALTH_FACTORS[index + 1] ?? null,
  };
}

/**
 * El «1 %» hecho número: `(1 + p/100)^días`. Un 1 % mejor cada día durante un año
 * es ×37.8; un 1 % peor, ×0.03. Es la idea que da nombre al hub.
 */
export function compoundGain(percentPerDay: number, days: number): number {
  return Math.pow(1 + percentPerDay / 100, days);
}

/** Formato compacto del multiplicador: `37.8×`, `0.03×`. */
export function formatGain(value: number): string {
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)}×`;
}

// ---------------------------------------------------------------------------
// Día a día: el factor de hoy, el ritmo semanal y el progreso local
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;

/** Clave de día `YYYY-MM-DD` en UTC (misma convención que el calendario). */
export function healthDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Días completos desde la época: la base de la rotación determinista. */
function dayIndex(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}

function keyFromDayIndex(index: number): string {
  return healthDayKey(new Date(index * DAY_MS));
}

/** Los últimos `count` días como claves, del más antiguo al más reciente. */
export function recentDayKeys(count: number, now: Date = new Date()): string[] {
  const today = dayIndex(now);
  const days = Math.max(0, count);
  return Array.from({ length: days }, (_, index) => keyFromDayIndex(today - (days - 1 - index)));
}

/** Proporción completada (0-1); segura cuando no hay hábitos. */
export function completionRatio(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, done / total));
}

/**
 * Días seguidos completando el hábito, contando hacia atrás desde hoy o desde
 * ayer: si hoy aún no está marcado, la racha de ayer sigue viva.
 */
export function streakDays(dayKeys: readonly string[], now: Date = new Date()): number {
  const days = new Set(dayKeys);
  const today = dayIndex(now);
  const start = days.has(keyFromDayIndex(today)) ? today : today - 1;

  let streak = 0;
  for (let index = start; days.has(keyFromDayIndex(index)); index -= 1) {
    streak += 1;
  }
  return streak;
}

/**
 * El factor de hoy: rotación **determinista** por fecha, así que cambia solo al
 * cambiar el día y no hay nada que guardar (todos ven el mismo).
 */
export function factorOfTheDay(
  factors: readonly HealthFactor[],
  now: Date = new Date()
): HealthFactor | null {
  if (factors.length === 0) return null;
  return factors[dayIndex(now) % factors.length] ?? null;
}

/** Días de la semana del ritmo semanal (0 = lunes, como en el resto de la app). */
export const HEALTH_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Ritmo semanal: reparte los factores por los días de la semana para dar cadencia
 * («lunes toca sueño»). Con más factores que días, se repiten en orden.
 */
export function weekPlan(
  factors: readonly HealthFactor[]
): { weekday: number; label: string; factor: HealthFactor }[] {
  const rows: { weekday: number; label: string; factor: HealthFactor }[] = [];
  HEALTH_WEEKDAY_LABELS.forEach((label, weekday) => {
    const factor = factors.length > 0 ? factors[weekday % factors.length] : undefined;
    if (factor) rows.push({ weekday, label, factor });
  });
  return rows;
}

/** Clave de `localStorage` del progreso de un factor. */
export function healthStorageKey(slug: string): string {
  return `ifpc.health.v1.${slug}`;
}

/** Cuántos días de histórico se guardan en el navegador. */
export const HEALTH_PROGRESS_LIMIT_DAYS = 30;

/** Progreso local de un factor (lo que se guarda en `localStorage`). */
export interface HealthProgress {
  /** Día (`YYYY-MM-DD`) al que corresponden los hábitos marcados. */
  day: string;
  /** Índices de los hábitos marcados hoy. */
  habits: number[];
  /** Días completados (claves `YYYY-MM-DD`), del más reciente al más antiguo. */
  days: string[];
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sanea lo leído de `localStorage` (puede ser basura o de otro día): descarta
 * valores inválidos, vacía los hábitos si el día cambió y recorta el histórico.
 */
export function normalizeProgress(
  raw: unknown,
  today: string,
  limitDays: number = HEALTH_PROGRESS_LIMIT_DAYS
): HealthProgress {
  const value = (raw ?? {}) as Partial<HealthProgress>;

  const habits = Array.isArray(value.habits)
    ? value.habits.filter((item) => Number.isInteger(item) && item >= 0)
    : [];
  const days = Array.isArray(value.days)
    ? value.days.filter((item) => typeof item === 'string' && DAY_KEY_RE.test(item))
    : [];

  const sameDay = value.day === today;
  return {
    day: today,
    habits: sameDay ? [...new Set(habits)].sort((a, b) => a - b) : [],
    days: [...new Set(days)].sort().reverse().slice(0, limitDays),
  };
}

/**
 * Marca o desmarca un hábito del día y devuelve el progreso ya saneado. El día
 * pasa al histórico **solo** cuando están todos los hábitos marcados.
 */
export function toggleHabit(
  progress: HealthProgress,
  index: number,
  total: number,
  today: string
): HealthProgress {
  const habits = progress.habits.includes(index)
    ? progress.habits.filter((item) => item !== index)
    : [...progress.habits, index];

  const complete = total > 0 && habits.length >= total;
  const days = complete
    ? [...new Set([today, ...progress.days])].sort().reverse()
    : progress.days.filter((day) => day !== today);

  return { day: today, habits: habits.sort((a, b) => a - b), days };
}
