/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cabeceras de seguridad globales. La CSP permite inline scripts/estilos porque
 * Next los inyecta en el HTML; aun así bloquea scripts de terceros, objetos,
 * framing y limita conexiones/imágenes a HTTPS.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
    ].join('; '),
  },
  ...(isProduction
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig = {
  // Standalone (Docker/Railway) activado con STANDALONE=true:
  // creates symlinks and Windows blocks that operation without Developer Mode.
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  transpilePackages: [
    '@ifpc/ui',
    '@ifpc/config',
    '@ifpc/types',
    '@ifpc/validation',
    '@ifpc/auth',
    '@ifpc/matching',
    '@ifpc/database',
    '@ifpc/rtc-protocol',
  ],
  // PGlite carga WASM en el runtime Node del servidor.
  serverExternalPackages: ['@electric-sql/pglite', 'pglite-prisma-adapter'],
};

export default nextConfig;
