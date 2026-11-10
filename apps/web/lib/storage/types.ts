/** Contrato de los drivers de almacenamiento de subidas. */
export interface StorageDriver {
  readonly kind: 'local' | 's3';
  /** Guarda un objeto y devuelve su URL pública. Lanza si no se pudo guardar. */
  save(input: { key: string; body: Buffer; contentType: string }): Promise<{ url: string }>;
  /**
   * Lee un objeto (bucket privado). Solo lo implementan los drivers que no
   * pueden servirse como estáticos; la ruta `/api/files/[...key]` lo usa como
   * proxy firmado.
   */
  readObject?(key: string): Promise<Response>;
  /** Borra un objeto a partir de su URL pública. Nunca lanza (best-effort). */
  remove(url: string | null | undefined): Promise<void>;
}
