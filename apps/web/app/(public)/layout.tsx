/**
 * Public segment layout.
 * `force-dynamic`: public pages query the database (PGlite) and must not be
 * prerendered at build time (PGlite WASM is not compatible with static generation).
 */
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // La web pública mantiene la identidad oscura (ink/lima). El `dark` re-aplica
  // los tokens oscuros a este subárbol mientras el área privada usa el tema claro.
  return <div className="dark min-h-[100dvh] bg-background text-foreground">{children}</div>;
}
