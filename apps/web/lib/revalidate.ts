import { revalidatePath } from 'next/cache';

/**
 * Revalidación de rutas desde una server action.
 *
 * Vive aislada en su propio módulo a propósito: `revalidatePath` solo funciona
 * dentro de una petición real de Next (fuera lanza un invariante), así que los
 * tests de acciones mockean **este** módulo (`@/lib/revalidate`) en vez de
 * `next/cache`, que la app resuelve desde `apps/web/node_modules`.
 */
export function revalidatePaths(...paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }
}
