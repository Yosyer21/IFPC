import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Content · Education' };

export default async function AdminContentParentEducationPage() {
  return (
    <ContentCategory
      category="parent-education"
      title="Education for families"
      subtitle="Guides to support children's sporting careers"
      icon="book"
    />
  );
}
