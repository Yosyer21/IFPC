/**
 * Divide un nombre completo en nombre y apellido para el avatar compartido
 * (`PlayerAvatar` usa las iniciales cuando no hay foto).
 */
export function nameParts(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.length > 1 ? (parts[parts.length - 1] ?? '') : '',
  };
}
