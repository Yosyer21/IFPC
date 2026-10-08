import { notFound, redirect } from 'next/navigation';
import { parseFeedFilters } from '@/lib/discovery';

/**
 * Etiqueta del feed. En F1 el feed ya filtra por `?tag=`, así que esta ruta solo
 * valida la etiqueta y redirige (evita duplicar el renderizado del feed).
 */
export default async function DiscoveryTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const filters = parseFeedFilters({ tag });
  if (!filters.tag) notFound();

  redirect(`/dashboard/discovery?tag=${filters.tag}`);
}
