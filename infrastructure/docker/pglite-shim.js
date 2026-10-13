/**
 * Sustituto del adaptador PGlite **solo** al empaquetar el seed de demo para
 * producción (`infrastructure/docker/Dockerfile.web`).
 *
 * En producción la base de datos es PostgreSQL (`USE_PGLITE=false`), así que el
 * adaptador embebido nunca se usa: se reemplaza por este shim para no arrastrar
 * el WASM de PGlite a la imagen.
 */
class PGlite {
  constructor() {
    throw new Error('PGlite is not available in this build (USE_PGLITE is not enabled).');
  }
}

class PrismaPGlite {
  constructor() {
    throw new Error('The PGlite adapter is not available in this build.');
  }
}

module.exports = { PGlite, PrismaPGlite };
