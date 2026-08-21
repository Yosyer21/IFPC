import type { Metadata } from 'next';
import { ContentCategory } from '@/components/admin/content-category';

export const metadata: Metadata = { title: 'Contenido · Educación' };

export default async function AdminContentParentEducationPage() {
  return (
    <ContentCategory
      category="parent-education"
      title="Educación para familias"
      subtitle="Guías para acompañar la carrera deportiva de los hijos"
      icon="book"
    />
  );
}
