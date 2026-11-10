import { NextResponse } from 'next/server';
import { auth } from '@ifpc/auth';
import { resolveStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Prefijos que se sirven sin sesión (se muestran en webs públicas: portadas,
 * fotos de perfil, imágenes de posts…). Los documentos y todo lo demás exigen
 * sesión: el bucket es privado y no queremos exponer certificados médicos.
 */
const PUBLIC_PREFIXES = [
  'banners/',
  'photos/',
  'covers/',
  'avatars/',
  'posts/',
  'training/',
  'club-banners/',
  'club-logos/',
];

/**
 * GET /api/files/[...key] — proxy firmado para Railway Storage Buckets.
 *
 * Los buckets de Railway son privados (no hay URL pública). La app guarda en
 * base de datos URLs estables `/api/files/<key>` y esta ruta firma la lectura
 * contra S3 con SigV4. Las imágenes se cachean un año (las keys llevan UUID);
 * los documentos privados nunca se cachean.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  const key = segments.join('/');

  if (!key || key.includes('..') || key.includes('\\0')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const isPublic = PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
  if (!isPublic) {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const storage = resolveStorage();

  // Con el driver local el archivo ya se sirve como estático (`/uploads/...`).
  if (!storage.readObject) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return NextResponse.redirect(`${base}/uploads/${key}`, 307);
  }

  let upstream: Response;
  try {
    upstream = await storage.readObject(key);
  } catch {
    return new NextResponse('Bad gateway', { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  const contentLength = upstream.headers.get('content-length');
  if (contentType) headers.set('content-type', contentType);
  if (contentLength) headers.set('content-length', contentLength);
  headers.set('x-content-type-options', 'nosniff');
  headers.set(
    'cache-control',
    isPublic ? 'public, max-age=31536000, immutable' : 'private, max-age=0, must-revalidate'
  );

  return new NextResponse(upstream.body, { status: 200, headers });
}
