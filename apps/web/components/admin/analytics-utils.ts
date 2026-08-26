export interface MonthlyPoint {
  label: string;
  value: number;
}

/** Groups records by month (last N months) for the analytics series. */
export function monthlyCounts(records: { createdAt: Date }[], months = 6): MonthlyPoint[] {
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  const buckets: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: d.toLocaleDateString('es', { month: 'short' }),
      value: 0,
    });
  }
  for (const record of records) {
    const created = new Date(record.createdAt);
    const offset = current - (created.getFullYear() * 12 + created.getMonth());
    const index = months - 1 - offset;
    if (index >= 0 && index < months) buckets[index]!.value += 1;
  }
  return buckets;
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return `${(amount / 100).toLocaleString('en')} ${currency}`;
}
