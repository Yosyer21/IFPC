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
- **Vía directa (WebRTC, opcional)**: cuando las dos redes se ven, los medios
  saltan a un enlace de navegador a navegador por *data channels* (`room-p2p.ts`)
  y dejan de pasar por nuestro servicio. La **señalización viaja por el mismo
  WebSocket** de la sala, así que seguimos sin STUN ni TURN (nada externo) y sin
  abrir puertos: si el enlace no conecta en unos segundos, todo se queda como
  estaba, por el relay. Solo se retira el par del relay cuando los **dos** lados
  dicen que van directos, así una caída nunca deja a nadie sin medios.

## Qué hace cada cosa

| Pieza | Responsabilidad |
|---|---|
| `apps/web/lib/training-rooms.ts` | Permisos (autor, invitado o audiencia), ventana horaria, código de sala y emisión del token. |
| `apps/web/components/room/room-media.ts` | Captura, códec, pantalla compartida y reproducción en el navegador. |
| `apps/web/components/room/room-client.tsx` | WebSocket, rejilla 2×2, controles (micro, cámara, mano, compartir pantalla, expulsar, cerrar, salir), chat y presencia. |
| `apps/web/components/room/room-p2p.ts` | Enlace directo con cada participante: señalización, *perfect negotiation*, canales de audio/vídeo y vuelta al relay si falla. |
| `apps/rtc/src/room.ts` | Estado vivo de la sala: cupo, roster, relay, moderación y barrido. |
| `apps/rtc/src/persistence.ts` | Presencia y estado en Postgres (best-effort: si falla, la llamada sigue). |

El área **`/dashboard/rooms` es compartida por cualquier perfil** (está en
`SHARED_DASHBOARD_PREFIXES`, `packages/auth`): el coach abre la sala y el jugador
entra por el enlace al que le invitan. El resto del dashboard sigue cerrado por rol.

## Despliegue en Railway

Los dos servicios salen de **la misma imagen** (`Dockerfile.web`), porque Railway
aplica el `railway.json` del repo a todos los servicios y no hay config por
servicio sin tocar el panel:

1. **Servicio `rtc`**: mismo repositorio y rama, con la variable
   **`SERVICE_KIND=rtc`**. `start-web.sh` mira esa variable y arranca `rtc.mjs`
   (el servicio de salas empaquetado con esbuild en el build, sin dependencias en
   runtime) en lugar del servidor Next.
   - Variables: `SERVICE_KIND=rtc`, `DATABASE_URL` (la misma), `ROOM_TOKEN_SECRET`
     (el mismo secreto que la web) y `PORT` (Railway lo inyecta).
   - Dominio público (el WebSocket viaja por HTTPS: **no** hace falta TCP proxy).
   - Healthcheck: `/` y `/healthz` responden `{"ok":true,"service":"rtc"}`.
2. **Servicio web**: añadir `NEXT_PUBLIC_RTC_URL=wss://<dominio-del-servicio-rtc>`
   (en local `ws://localhost:4001`) y redesplegar: al ser `NEXT_PUBLIC_*` se
   incrusta en el bundle del navegador.
3. `ROOM_TOKEN_SECRET`: si no se define, ambos servicios caen en `AUTH_SECRET`, así
   que basta con no definirlo en ninguno de los dos (o ponerlo igual en los dos).

En local, dos procesos:

```bash
pnpm --filter @ifpc/rtc dev     # servicio de salas en :4001
pnpm dev                        # web en :3000 (usa ws://localhost:4001)
```

## Variables

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_RTC_URL` | URL del servicio de salas para el navegador (`ws://` o `wss://`). |
| `ROOM_TOKEN_SECRET` | Secreto compartido web ↔ `rtc` para firmar tokens (si falta usa `AUTH_SECRET`). |
| `PORT` | Puerto del servicio `rtc` (por defecto 4001). |

## Comprobación rápida

```bash
# Servicio en marcha (local)
pnpm --filter @ifpc/rtc dev
curl -s localhost:4001/healthz   # {"ok":true,"service":"rtc","rooms":0}

# Dos clientes de verdad contra el servicio (local o producción)
ROOM_TOKEN_SECRET=<secreto> node --import=tsx scripts/development/room-smoke.ts wss://rtc-production-0d92.up.railway.app
```

Los tests cubren el protocolo, el token y toda la lógica de sala (cupo,
reconexión, relay, barrido, moderación) más una integración que arranca el
servicio de verdad:

```bash
pnpm exec vitest run apps/rtc packages/rtc-protocol tests/integration/rtc-room.test.ts
```

Y un **e2e de navegador con cámara y micro falsos** (`tests/e2e/rooms.spec.ts`):
dos personas entran a la misma sala y el test espera a que lleguen fotogramas de
vídeo de verdad (`window.__roomStats.videoIn > 0`), además de comprobar chat,
micro, compartir pantalla, expulsión, cierre y las dos formas de transporte:

- por defecto, la **vía directa** tiene que conectar (`__roomStats.p2p >= 1`) y
  llegar frames por ahí (`__roomStats.p2pIn > 0`); la baldosa lo enseña (`P2P`);
- con **`?p2p=off`** en la URL (los dos lados) nada intenta la vía directa: los
  medios siguen por el relay y la baldosa dice `Relay`.

`__roomStats.mesh` publica el estado de cada enlace (`state`, `connection`, `ice`,
`signal`), que es lo que permite saber por dónde se quedó si algo no conecta.
Arranca el servicio de salas solo (si ya hay uno en `:4001`, lo reutiliza) y usa el
mismo secreto que la web:

```bash
pnpm dev            # web en :3000 (necesaria para el e2e)
pnpm e2e tests/e2e/rooms.spec.ts
```

El mismo test vale contra producción (sin arrancar nada en local: reutiliza el
servicio de Railway y los tokens los firma la web desplegada):

```bash
E2E_BASE_URL=https://ifpc.up.railway.app \
E2E_RTC_URL=https://rtc-production-0d92.up.railway.app \
pnpm e2e tests/e2e/rooms.spec.ts
```

La sala que crea se cierra y se borra al final del propio test.

## Límites y siguientes pasos

- **Cupo 4**: es malla/SFU pequeño; con 4 personas cada cliente manda 1 flujo y
  recibe 3. Subir el cupo multiplica el egress de nuestro servicio.
- **Egress**: los medios pasan por Railway (≈1,2 GB/hora con 4 personas y las
  calidades por defecto). No se transcodifica, así que la CPU es baja.
- **Vía directa (F5)**: hecha y opcional. Los medios van de navegador a navegador
  cuando la red lo permite (mismo edificio, misma WiFi) y el resto del tiempo
  siguen por el relay; el ahorro es el egress de nuestro servicio (con 4 personas
  y todas directas, el servicio no reenvía nada). **Sin STUN ni TURN**, así que no
  atraviesa NAT simétricos: por eso el relay sigue siendo el camino por defecto.
  Se apaga con `?p2p=off` y cada baldosa dice por dónde va cada uno.
- **Grabación (F4)**: al pasar los medios por nuestro servicio, grabar es escribir
  los frames en `resolveStorage()`; pendiente, con aviso y consentimiento.
- **Moderación**: el host expulsa desde la propia baldosa del participante; a quien
  sale se le explica el motivo ("The host removed you."). Cerrar la sala desde
  dentro expulsa a todos y marca la sala como terminada en la base de datos.
