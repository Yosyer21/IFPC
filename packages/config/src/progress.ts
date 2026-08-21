/** Porcentaje de campos completados (0-100). Los valores falsy cuentan como vacíos. */
export function profileCompletionPercentage(fields: Array<unknown>): number {
  if (fields.length === 0) return 0;
  const completed = fields.filter((field) => Boolean(field)).length;
  return Math.round((completed / fields.length) * 100);
}
