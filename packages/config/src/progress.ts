/** Percentage of completed fields (0-100). Falsy values count as empty. */
export function profileCompletionPercentage(fields: Array<unknown>): number {
  if (fields.length === 0) return 0;
  const completed = fields.filter((field) => Boolean(field)).length;
  return Math.round((completed / fields.length) * 100);
}
