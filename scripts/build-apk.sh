#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v java >/dev/null || { echo 'Falta Java 17 o 21.'; exit 1; }
if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  echo 'Configurá ANDROID_HOME con el SDK de Android (Android Studio).'; exit 1
fi
npm install
npx expo install --fix
npm run check
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease
mkdir -p ../dist
cp app/build/outputs/apk/release/app-release.apk ../dist/match-roulette.apk
printf '\nAPK: dist/match-roulette.apk\n'
