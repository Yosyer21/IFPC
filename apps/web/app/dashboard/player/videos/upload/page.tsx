import type { Metadata } from 'next';
import Link from 'next/link';
import { VideoUploadForm } from '@/components/player/video-upload-form';

export const metadata: Metadata = { title: 'Upload video' };

export default function PlayerVideoUploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Upload video</h1>
        <Link
          href="/dashboard/player/videos"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← My videos
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Upload your best moments. The video will be stored locally in this phase.
      </p>
      <VideoUploadForm />
    </div>
  );
}
