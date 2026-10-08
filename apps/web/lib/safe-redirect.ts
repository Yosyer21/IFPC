/**
 * Rutas internas del dashboard. Cualquier valor que no sea una ruta interna
 * `/dashboard/...` (protocolos, `//`, `..`, barras invertidas) cae a `/dashboard`,
 * de modo que un `redirectTo` manipulado no puede sacar al usuario del sitio.
 */
export function dashboardPath(value: unknown): string {
  const target = typeof value === 'string' ? value.trim() : '';
  if (!target.startsWith('/dashboard/')) return '/dashboard';

  // Sin protocolos, rutas absolutas ni escapes de directorio.
  const rest = target.slice('/dashboard'.length);
  if (rest.includes('//') || rest.includes('..') || rest.includes(':') || rest.includes('\\')) {
    return '/dashboard';
  }
  return target;
}
