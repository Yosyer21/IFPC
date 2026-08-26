/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone (Docker/Railway) activado con STANDALONE=true:
  // creates symlinks and Windows blocks that operation without Developer Mode.
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
  transpilePackages: [
    '@ifpc/ui',
    '@ifpc/config',
    '@ifpc/types',
    '@ifpc/validation',
    '@ifpc/auth',
    '@ifpc/matching',
    '@ifpc/database',
  ],
  // PGlite carga WASM en el runtime Node del servidor.
  serverExternalPackages: ['@electric-sql/pglite', 'pglite-prisma-adapter'],
};

export default nextConfig;
