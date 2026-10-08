import { notFound, redirect } from 'next/navigation';
import { parseFeedFilters, publicFeedFilters } from '@/lib/discovery';

/**
 * Etiqueta del feed público. Como en el área privada, valida y redirige al feed
 * filtrado en vez de duplicar el renderizado.
 */
export default async function PublicDiscoveryTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const filters = publicFeedFilters(parseFeedFilters({ tag }));
  if (!filters.tag) notFound();

  redirect(`/discovery?tag=${filters.tag}`);
}
