#!/usr/bin/env bash
# Compila el APK de Future Baller y lo deja listo para la landing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANDROID_DIR="$ROOT/mobile/android"
OUT="$ROOT/apps/web/public/downloads/future-baller.apk"

: "${ANDROID_HOME:=$HOME/android-sdk}"
export ANDROID_HOME
export ANDROID_SDK_ROOT="$ANDROID_HOME"

cd "$ANDROID_DIR"
./gradlew :app:assembleRelease

mkdir -p "$(dirname "$OUT")"
cp app/build/outputs/apk/release/app-release.apk "$OUT"
echo "APK listo: $OUT ($(du -h "$OUT" | cut -f1))"
