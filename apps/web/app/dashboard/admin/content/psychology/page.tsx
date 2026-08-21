import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Contenido · Psicología' };

export default async function AdminContentPsychologyPage() {
  return (
    <ContentCategory
      category="psychology"
      title="Psicología deportiva"
      subtitle="Recursos de preparación mental para rendir al máximo"
      icon="play"
    />
  );
}
