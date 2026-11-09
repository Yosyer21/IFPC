# Future Baller · app Android

Envoltorio nativo (WebView) de la web desplegada en Railway. No usa Capacitor:
es un proyecto Android mínimo con Gradle, así que el APK pesa muy poco y no
añade dependencias al monorepo.

## Qué incluye

- WebView a pantalla completa sobre `BuildConfig.APP_URL`
  (`https://futureballler.up.railway.app` por defecto).
- Barra de progreso superior, pantalla de «sin conexión» con reintento.
- Subida de archivos (foto, portada, documentos) con el selector del sistema.
- Botón atrás del sistema integrado con el historial de la web.
- Enlaces externos (Google, correo, PDFs, APK) se abren en la app del sistema.

## Requisitos para compilar

- JDK 17 o superior.
- Android SDK con `platforms;android-35` y `build-tools;35.0.0`.
- Gradle 8.9 (o el wrapper incluido).

```bash
cd mobile/android
export ANDROID_HOME="$HOME/android-sdk"
./gradlew :app:assembleRelease
```

El APK queda en `app/build/outputs/apk/release/app-release.apk`. El script
`mobile/scripts/build-apk.sh` lo compila y lo copia a
`apps/web/public/downloads/future-baller.apk` (el archivo que sirve la landing).

## Cambiar el servidor

Edita `APP_URL` en `app/build.gradle` y vuelve a compilar. La app solo abre
dentro del WebView su propio dominio; el resto de dominios van al navegador.

## Firma

La build de release se firma con la clave de debug para que el APK se pueda
instalar directamente (distribución fuera de Play Store). Para publicar en una
tienda, crea un keystore propio y cambia `signingConfig`.
