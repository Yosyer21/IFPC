/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ifpc/ui',
    '@ifpc/config',
    '@ifpc/types',
    '@ifpc/validation',
    '@ifpc/auth',
    '@ifpc/matching',
  ],
  // PGlite carga WASM en el runtime Node del servidor.
  serverExternalPackages: ['@electric-sql/pglite', 'pglite-prisma-adapter'],
};

export default nextConfig;
