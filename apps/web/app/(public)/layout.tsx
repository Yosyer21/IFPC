/**
 * Public segment layout.
 * `force-dynamic`: public pages query the database (PGlite) and must not be
 * prerendered at build time (PGlite WASM is not compatible with static generation).
 */
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
