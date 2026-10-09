# Almacenamiento

## Current phase

- Las subidas pasan por **`apps/web/lib/storage`**, que elige driver según el entorno:
  - `local` (**por defecto**): escribe en `apps/web/public/uploads/` (o `UPLOAD_DIR`) y devuelve
    la URL estática `/uploads/<key>` de siempre. Los objetos subidos viven en `uploads/posts/`.
  - `s3`: sube a un bucket compatible con S3 (AWS, MinIO, R2…) y devuelve la URL pública.
- URL generada con `crypto.randomUUID()` para evitar colisiones (clave `posts/<uuid>.<ext>`).
- Discovery usa `public/uploads/posts/` para las imágenes (≤4 MB) y los vídeos cortos (≤25 MB)
  publicados en el feed (una publicación puede llevar una **galería** de hasta cuatro
  imágenes, todas en `Post.mediaUrls`); los vídeos largos se recomiendan por URL externa
  (YouTube/Vimeo, lista blanca en `resolveEmbed`).

## Drivers (`apps/web/lib/storage`)

```ts
resolveStorage();              // StorageDriver según STORAGE_DRIVER (local por defecto)
await storage.save({ key, body, contentType });   // → { url }
await storage.remove(url);     // best-effort, ignora URLs que no son suyas
```

- `local.ts`: disco. `remove` solo borra rutas `/uploads/…` (nunca un vídeo externo).
- `s3.ts`: `PUT`/`DELETE` con **SigV4 firmado a mano** (`sigv4.ts`, `node:crypto`): solo se usan
  esos dos verbos, así que arrastrar el SDK de AWS no compensa. Soporta `path-style` (MinIO) y
  `virtual-hosted` (AWS), y admite `S3_PUBLIC_BASE_URL` para servir por CDN.
- Cuando no se puede leer la configuración pero el driver activo es el local, las server actions
  siguen funcionando igual: el driver solo cambia **dónde** se escribe, no el flujo.
- Si se pide `s3` sin credenciales, `resolveStorage()` avisa por consola y cae al disco: perder la
  subida del usuario es peor que guardarla donde siempre.

Variables: `STORAGE_DRIVER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_BASE_URL`, `UPLOAD_DIR`.

### Validación del firmador

`signingPieces` (puro) devuelve la petición canónica, el *string to sign* y la firma, así que se
puede contrastar sin bucket:

- `tests/unit/storage/` compara la firma contra un verificador escrito aparte y contra un **S3 de
  mentira** (`node:http` local) que recibe el `PUT`/`DELETE` real.
- Validación con herramienta independiente: `openssl` recalcula el hash canónico, la clave de
  firma (`AWS4` + HMAC en cadena) y la firma, y coinciden con las del módulo.
- Comprobado **dentro de la app** (Playwright + Firefox headless, `STORAGE_DRIVER=s3` apuntando a
  un S3 falso local): un vídeo con su miniatura y dos imágenes de galería se suben con firma
  válida (`scope` con fecha/región/servicio correctos), las URLs guardadas apuntan al bucket y el
  navegador carga los objetos servidos desde él.

## Objetivo (S3/MinIO)

- Subida directa con **URLs firmadas** (`PUT` prefirmado desde el navegador) para no pasar el
  archivo por el servidor de Next.
- Buckets separados: `videos`, `thumbnails`, `documents`, `images`.
- Miniaturas de vídeo en el worker (`Video.thumbnailUrl` ya existe; hoy nadie lo rellena).

## Mantenimiento

- `cleanup-files` (worker + `scripts:cleanup`) elimina archivos huérfanos de `uploads/` y de
  `uploads/posts/`: se consideran referenciados los medios de `Video.url`, `Post.mediaUrl` y la
  galería `Post.mediaUrls` (si no, borraría las imágenes de las galerías).
- `scripts:publish-scheduled` publica las publicaciones **programadas** de Discovery
  (`Post.publishAt <= ahora` y `status = DRAFT`); pensado para cron.
- Con `STORAGE_DRIVER=s3` este limpiador no aplica (el bucket lo gestiona su ciclo de vida).

