import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Contenido · Fuerza' };

export default async function AdminContentStrengthConditioningPage() {
  return (
    <ContentCategory
      category="strength-conditioning"
      title="Fuerza y acondicionamiento"
      subtitle="Rutinas de fuerza y prevención de lesiones"
      icon="play"
    />
  );
}
