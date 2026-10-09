import { FeedSkeleton } from '@/components/discovery/feed-skeleton';
import { FeedTabs } from '@/components/discovery/feed-tabs';
import { PageHeader } from '@/components/player/page-header';

/**
 * Esqueleto de la ruta: se ve al navegar al feed mientras el servidor prepara la
 * página (la cabecera real llega en cuanto el componente resuelve).
 */
export default function DiscoveryLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Discovery"
        subtitle="Anuncios, vídeos y logros de todos los perfiles"
        icon="compass"
      />
      <FeedSkeleton posts={3} />
    </div>
  );
}
