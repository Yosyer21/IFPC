#!/bin/sh
# Arranque del servicio web en producción (Railway).
#
#  1) Aplica el esquema Prisma (`prisma db push`) para que la base de datos quede
#     siempre alineada con packages/database/prisma/schema.prisma.
#  2) Si SEED_DEMO_DATA=true, carga los datos de demo (usuarios de prueba,
#     contenido, quizzes…). El seed es idempotente (usa upserts).
#  3) Arranca el servidor Next.js (output standalone).
#
# Variables relevantes: DATABASE_URL, SEED_DEMO_DATA.
set -e

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
