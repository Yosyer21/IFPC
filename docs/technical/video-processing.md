# Procesamiento de vídeo

## Current phase

1. El jugador sube el vídeo vía Server Action → se guarda en `public/uploads/`.
2. Se crea el registro `Video` con estado `ready` (sin transcodificación).
3. El job `process-video` (worker) marca el vídeo como procesado.

## Objetivo

1. Subida a S3 con URL firmada.
2. Cola `video` → worker:
   - Descarga desde S3.
   - Transcodificación con ffmpeg (HLS/MP4 multi-resolución).
   - Generación de thumbnail y preview.
   - Actualización del estado: `uploading → processing → ready/failed`.
3. CDN para entrega (ej. CloudFront).

## Estados del modelo `Video`

`uploading` · `processing` · `ready` · `failed`
