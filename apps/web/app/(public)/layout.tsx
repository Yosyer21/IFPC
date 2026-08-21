/**
 * Layout del segmento público.
 * `force-dynamic`: las páginas públicas consultan la base de datos (PGlite) y no deben
 * prerenderizarse en build time (PGlite WASM no es compatible con la generación estática).
 */
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
