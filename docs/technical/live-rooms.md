# Salas de vídeo propias (Football Center)

Videollamadas **dentro de la app** para coach/club ↔ jugadores, máximo 4 personas,
sin APIs externas. Los medios van por nuestro propio servicio (`apps/rtc`) sobre
WebSocket: **no hay STUN/TURN ni UDP**, y por tanto no depende de que las redes de
los participantes se vean entre sí.

## Arquitectura

```
navegador ── HTTPS ──▶ apps/web      (Next.js: permisos, ventana, token firmado)
    │
    └──── WSS ─────────▶ apps/rtc      (WebSocket: roster, presencia, relay de medios)
                              │
                              └── Postgres (privado): salas y presencia
```

- **`packages/rtc-protocol`**: protocolo compartido (mensajes de control, cabecera
  binaria de los frames, cupo y calidades) y firma/verificación del token de sala
  con HMAC (`node:crypto`, sin dependencias). El módulo `token` es solo para Node.
- **Transporte `relay`**: cada cliente captura, **codifica** y manda **un** flujo
  (audio Opus ~32 kbps y vídeo VP8 ~200 kbps a 480×360/15 fps con WebCodecs). El
  servicio reenvía a los demás sin transcodificar: es un *broadcaster* barato.
- **Sin WebCodecs** (navegadores antiguos): respaldo PCM mono + fotogramas JPEG a
  5 fps. Misma rejilla, menos calidad.
- **Presencia**: latido cada 5 s; si alguien desaparece de golpe, el barrido lo
  saca a los 20 s y avisa al resto.

## Qué hace cada cosa

| Pieza | Responsabilidad |
|---|---|
| `apps/web/lib/training-rooms.ts` | Permisos (autor, invitado o audiencia), ventana horaria, código de sala y emisión del token. |
| `apps/web/components/room/room-media.ts` | Captura, códec y reproducción en el navegador. |
| `apps/web/components/room/room-client.tsx` | WebSocket, rejilla 2×2, controles (micro, cámara, mano, salir), chat y presencia. |
| `apps/rtc/src/room.ts` | Estado vivo de la sala: cupo, roster, relay, moderación y barrido. |
| `apps/rtc/src/persistence.ts` | Presencia y estado en Postgres (best-effort: si falla, la llamada sigue). |

## Despliegue en Railway

1. **Servicio `rtc`** (nuevo): mismo repositorio, `Dockerfile` =
   `infrastructure/docker/Dockerfile.rtc`, con dominio público (el WebSocket viaja
   por HTTPS: no hace falta TCP proxy).
   - Variables: `DATABASE_URL` (la misma), `ROOM_TOKEN_SECRET` (el mismo secreto
     que la web) y `PORT` (Railway lo inyecta).
   - Healthcheck: `/healthz`.
2. **Servicio web**: añadir `NEXT_PUBLIC_RTC_URL=wss://<dominio-del-servicio-rtc>`
   (el navegador necesita la URL pública; en local `ws://localhost:4001`).
   - `ROOM_TOKEN_SECRET` con el mismo valor que en `rtc`.
3. Redepliega el servicio web cuando cambie la URL pública.

## Variables

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_RTC_URL` | URL del servicio de salas para el navegador (`ws://` o `wss://`). |
| `ROOM_TOKEN_SECRET` | Secreto compartido web ↔ `rtc` para firmar tokens (si falta usa `AUTH_SECRET`). |
| `PORT` | Puerto del servicio `rtc` (por defecto 4001). |

## Comprobación rápida

```bash
# Servicio en marcha
pnpm --filter @ifpc/rtc dev
curl -s localhost:4001/healthz   # {"ok":true,"rooms":0}
```

Los tests unitarios cubren el protocolo, el token y toda la lógica de sala
(cupo, reconexión, relay, barrido, moderación):

```bash
pnpm exec vitest run apps/rtc packages/rtc-protocol
```

## Límites y siguientes pasos

- **Cupo 4**: es malla/SFU pequeño; con 4 personas cada cliente manda 1 flujo y
  recibe 3. Subir el cupo multiplica el egress de nuestro servicio.
- **Egress**: los medios pasan por Railway (≈1,2 GB/hora con 4 personas y las
  calidades por defecto). No se transcodifica, así que la CPU es baja.
- **Grabación**: al pasar los medios por nuestro servicio, grabar es escribir los
  frames en `resolveStorage()`; pendiente (F4) con aviso y consentimiento.
- **WebRTC P2P (F5)**: cuando la red lo permita, la pareja puede saltar a
  `RTCPeerConnection` (mejor latencia y 0 coste) manteniendo este transporte como
  red de seguridad.
- **Compartir pantalla, expulsar y lobby**: el protocolo ya tiene `kick` y
  `sharingScreen`; falta la UI (F3).
