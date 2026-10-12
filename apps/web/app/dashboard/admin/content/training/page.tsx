import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Content · Training' };

export default async function AdminContentTrainingPage() {
  return (
    <ContentCategory
      category="technical"
      title="Training"
      subtitle="Catalog of technical content for players"
      icon="play"
    />
  );
}
