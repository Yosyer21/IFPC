/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@future-buller/ui',
    '@future-buller/config',
    '@future-buller/types',
    '@future-buller/validation',
    '@future-buller/auth',
    '@future-buller/matching',
  ],
  // PGlite carga WASM en el runtime Node del servidor.
  serverExternalPackages: ['@electric-sql/pglite', 'pglite-prisma-adapter'],
};

export default nextConfig;
