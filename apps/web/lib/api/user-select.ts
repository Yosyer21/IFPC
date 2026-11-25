/**
 * Campos de `User` que puede devolver una API sin filtrar datos sensibles.
 *
 * `passwordHash` NUNCA debe salir de una respuesta HTTP (ni siquiera a un admin):
 * no se necesita para pintar ninguna pantalla y un volcado de la API permitiría
 * atacar las contraseñas offline. El email se separa para poder dar solo el
 * directorio público cuando no hace falta contacto.
 */
export const publicUserSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
} as const;

/** Directorio + email (solo contextos donde el contacto es necesario). */
export const contactUserSelect = {
  ...publicUserSelect,
  email: true,
} as const;

/** Vista de administración: sin hash ni secretos, con estado de verificación. */
export const adminUserSelect = {
  ...contactUserSelect,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;
