/**
 * `redirect()` de next/navigation no retorna: lanza un error NEXT_REDIRECT.
 * Devuelve el destino de la redirección (o `null` si no hubo ninguna).
 */
export async function captureRedirect(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      return digest.split(';')[2] ?? null;
    }
    throw error;
  }
}
