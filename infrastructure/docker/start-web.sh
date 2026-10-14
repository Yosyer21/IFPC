#!/bin/sh
# Arranque del servicio en Railway. Hay **un** Dockerfile para los dos servicios
# del proyecto, así que aquí se decide a quién arranca cada uno:
#
#   SERVICE_KIND=rtc  → servicio de salas de vídeo (WebSocket, apps/rtc)
#   (cualquier otro)  → web Next.js (esquema Prisma, seed opcional y servidor)
#
# Variables relevantes: DATABASE_URL, SERVICE_KIND, ROOM_TOKEN_SECRET,
# SEED_DEMO_DATA, PORT.
set -e

if [ "$SERVICE_KIND" = 'rtc' ]; then
  echo '[start] arrancando servicio de salas (rtc)…'
  exec node rtc.mjs
fi

echo '[start] aplicando esquema Prisma…'
prisma db push --schema packages/database/prisma/schema.prisma --skip-generate

if [ "$SEED_DEMO_DATA" = 'true' ]; then
  echo '[start] cargando datos de demo (SEED_DEMO_DATA=true)…'
  if node seed.mjs; then
    echo '[start] datos de demo listos.'
  else
    echo '[start] AVISO: el seed falló; se continúa sin datos de demo.'
  fi
else
  echo '[start] seed omitido (SEED_DEMO_DATA != true).'
fi

echo '[start] arrancando servidor web…'
exec node apps/web/server.js
