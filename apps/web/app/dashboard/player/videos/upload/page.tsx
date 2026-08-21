import type { Metadata } from 'next';
import Link from 'next/link';
import { VideoUploadForm } from '@/components/player/video-upload-form';

export const metadata: Metadata = { title: 'Subir vídeo' };

export default function PlayerVideoUploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subir vídeo</h1>
        <Link
          href="/dashboard/player/videos"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mis vídeos
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Sube tus mejores momentos. El vídeo se almacenará de forma local en esta fase.
      </p>
      <VideoUploadForm />
    </div>
  );
}
