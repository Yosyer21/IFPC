# Almacenamiento

## Current phase

- Uploaded videos se guardan en `apps/web/public/uploads/` (gitignored) y se sirven estáticamente.
- URL generada con `crypto.randomUUID()` para evitar colisiones.
- Documentos de ejemplo apuntan a rutas estáticas.
- Discovery usa `public/uploads/posts/` para las imágenes (≤4 MB) y los vídeos cortos (≤25 MB)
  publicados en el feed; los vídeos largos se recomiendan por URL externa
  (YouTube/Vimeo, lista blanca en `resolveEmbed`).

## Objetivo (S3/MinIO)

- Subida directa con **URLs firmadas** (`lib/storage` → `signed-urls.ts`).
- Buckets: `videos`, `thumbnails`, `documents`, `images`.
- Metadatos en BD (`Video.url`, `Document.url`) apuntando a la clave del objeto.

## Mantenimiento

- `cleanup-files` (worker + `scripts:cleanup`) elimina archivos huérfanos de `uploads/`.
- Variables: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`.
