import type { Metadata } from 'next';
import { isGoogleEnabled } from '@ifpc/auth';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

/** Mensajes para los errores que devuelve el flujo de Google. */
const OAUTH_ERRORS: Record<string, string> = {
  EmailNotVerified:
    'That email is already registered but not verified. Sign in with your password to verify it, and then you can use Google.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const oauthMessage = error ? OAUTH_ERRORS[error] : undefined;
  // Sin credenciales de Google el botón no se muestra (y el login por email
  // funciona igual): se configura con AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.
  const googleEnabled = isGoogleEnabled();

  return (
    <div>
      <h1 className="font-display text-3xl uppercase tracking-tight text-ink">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Welcome back — sign in to your Future Baller account.
      </p>
      {oauthMessage ? (
        <p className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {oauthMessage}
        </p>
      ) : null}
      <LoginForm callbackUrl={callbackUrl ?? '/dashboard'} googleEnabled={googleEnabled} />
    </div>
  );
}
