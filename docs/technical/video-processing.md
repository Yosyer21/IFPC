# Procesamiento de vídeo

## Current phase

1. El jugador sube el vídeo vía Server Action → se guarda en `public/uploads/`.
2. Se crea el registro `Video` con estado `ready` (sin transcodificación).
3. El job `process-video` (worker) marca el vídeo como procesado.

## Miniaturas del feed (Discovery)

Los vídeos publicados en Discovery **sí** llevan miniatura: al subirlos,
`createPostAction` pasa el archivo por `apps/web/lib/media/video-poster.ts`,
que extrae el primer fotograma (~1 s, 640 px de ancho) con `ffmpeg` y lo guarda
como JPEG en el mismo almacén (`posts/<id>-poster.jpg` → `Post.posterUrl`).

- Se pinta como `poster` del `<video>` (antes salía un rectángulo negro) y se usa
  como `og:image` en el espejo público.
- Es **opcional y nunca bloquea**: si `ffmpeg` no está instalado, tarda demasiado
  o el archivo no se puede leer, la publicación se crea igual sin `posterUrl`.
  Los tests que dependen de ffmpeg se saltan solos cuando no está disponible.

## Objetivo

1. Subida a S3 con URL firmada.
2. Cola `video` → worker:
   - Descarga desde S3.
   - Transcodificación con ffmpeg (HLS/MP4 multi-resolución).
   - Generación de thumbnail y preview (reutilizar `lib/media/video-poster.ts`).
   - Actualización del estado: `uploading → processing → ready/failed`.
3. CDN para entrega (ej. CloudFront).

## Estados del modelo `Video`

`uploading` · `processing` · `ready` · `failed`
