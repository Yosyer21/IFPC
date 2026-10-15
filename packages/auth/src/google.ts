/**
 * ¿Está configurado el alta/login con Google?
 *
 * Se activa con **`AUTH_GOOGLE_ID`** y **`AUTH_GOOGLE_SECRET`** (las dos). Sin
 * ellas el provider no se registra, el botón no se muestra y la plataforma
 * funciona solo con email: no hay que tocar nada más.
 */
export function isGoogleEnabled(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
