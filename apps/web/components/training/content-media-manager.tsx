'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { Button } from '@ifpc/ui';
import {
  removeTrainingCoverAction,
  removeTrainingVideoAction,
  uploadTrainingCoverAction,
  uploadTrainingVideoAction,
} from '@/app/actions/training';

export interface TrainingMediaManagerProps {
  contentId: string;
  coverUrl: string | null;
  videoUrl: string | null;
}

const FILE_INPUT =
  'w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground';

/**
 * Portada y vídeo del contenido: se **suben** desde aquí (disco o S3) en lugar de
 * pegar URLs. La portada es manual a propósito: la miniatura automática del vídeo
 * usa `ffmpeg`, que no está en la imagen de producción.
 */
export function TrainingMediaManager({
  contentId,
  coverUrl,
  videoUrl,
}: TrainingMediaManagerProps) {
  const [coverState, coverAction, coverPending] = useActionState(uploadTrainingCoverAction, {});
  const [videoState, videoAction, videoPending] = useActionState(uploadTrainingVideoAction, {});

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold">Cover image</h3>
          <p className="text-xs text-muted-foreground">
            The image of the card. JPG, PNG or WebP · max. 4 MB.
          </p>
        </div>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt="Current cover"
            width={800}
            height={450}
            unoptimized
            className="h-32 w-full rounded-lg border border-border/60 object-cover"
          />
        ) : null}
        <form action={coverAction} className="flex flex-col gap-2">
          <input type="hidden" name="contentId" value={contentId} />
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            aria-label="Cover image"
            className={FILE_INPUT}
          />
          {coverState.error ? <p className="text-xs text-destructive">{coverState.error}</p> : null}
          <Button
            type="submit"
            variant="outline"
            disabled={coverPending}
            className="self-start"
          >
            {coverPending ? 'Uploading…' : 'Save cover'}
          </Button>
        </form>
        {coverUrl ? (
          <form action={removeTrainingCoverAction}>
            <input type="hidden" name="contentId" value={contentId} />
            <button type="submit" className="text-xs text-muted-foreground hover:underline">
              Remove cover
            </button>
          </form>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold">Video</h3>
          <p className="text-xs text-muted-foreground">
            Demonstration clip. MP4, WebM or MOV · max. 25 MB.
          </p>
        </div>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="aspect-video w-full rounded-lg border border-border/60 bg-black"
          />
        ) : null}
        <form action={videoAction} className="flex flex-col gap-2">
          <input type="hidden" name="contentId" value={contentId} />
          <input
            name="file"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            required
            aria-label="Video file"
            className={FILE_INPUT}
          />
          {videoState.error ? <p className="text-xs text-destructive">{videoState.error}</p> : null}
          <Button
            type="submit"
            variant="outline"
            disabled={videoPending}
            className="self-start"
          >
            {videoPending ? 'Uploading…' : 'Save video'}
          </Button>
        </form>
        {videoUrl ? (
          <form action={removeTrainingVideoAction}>
            <input type="hidden" name="contentId" value={contentId} />
            <button type="submit" className="text-xs text-muted-foreground hover:underline">
              Remove video
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
