import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    // El área privada exige sesión: no tiene sentido indexarla.
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard'] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
