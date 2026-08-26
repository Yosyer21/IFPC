import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Contenido · Entrenamiento' };

export default async function AdminContentTrainingPage() {
  return (
    <ContentCategory
      category="technical"
      title="Entrenamiento"
      subtitle="Catalog of technical content for players"
      icon="play"
    />
  );
}
