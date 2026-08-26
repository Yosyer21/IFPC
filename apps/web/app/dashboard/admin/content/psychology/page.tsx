import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Content · Psychology' };

export default async function AdminContentPsychologyPage() {
  return (
    <ContentCategory
      category="psychology"
      title="Sports psychology"
      subtitle="Mental preparation resources to perform at your best"
      icon="play"
    />
  );
}
