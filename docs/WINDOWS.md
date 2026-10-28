# Compilar en Windows

El script usa el JDK de Android Studio y el SDK de `%LOCALAPPDATA%\Android\Sdk`, salvo que se indiquen otras rutas. No modifica las variables de entorno permanentes del equipo.

Desde la carpeta del proyecto:

```powershell
npm run apk -- -BuildDirectory D:\CodexBuilds\match-roulette
```

La carpeta de compilación debe tener una ruta sin tildes, espacio suficiente para dependencias y herramientas nativas, y estar dedicada a esta app. El script copia allí el código, instala exactamente el lockfile, ejecuta las comprobaciones y genera un APK release con JavaScript incluido. Conserva el proyecto Android entre ejecuciones.

Para almacenar también SDK, cachés y temporales en D:, la compilación de esta sesión usa:

```powershell
$env:GRADLE_USER_HOME = 'D:\CodexBuilds\gradle'
$env:TEMP = 'D:\CodexBuilds\temp'
$env:TMP = $env:TEMP
npm run apk -- -BuildDirectory D:\CodexBuilds\match-roulette -SdkDirectory D:\CodexBuilds\match-roulette-sdk
```

Estas carpetas deben existir. El SDK de esta sesión es una copia de las herramientas Android ya instaladas en el equipo. Gradle puede descargar componentes adicionales necesarios.

Por falta de espacio en C:, las dependencias del proyecto original se conservaron en `D:\CodexBuilds\match-roulette-source-dependencies`, con una unión de directorio desde `node_modules`. La caché de npm se conservó en `D:\CodexBuilds\npm-cache`, con una unión desde `%LOCALAPPDATA%\npm-cache`. No eliminar estas carpetas de D: sin retirar o reemplazar antes sus enlaces. El proyecto usado para compilar conserva sus propias dependencias en `D:\CodexBuilds\match-roulette`.

Solo si la compilación termina correctamente, el resultado se copia a `dist/match-roulette.apk` en la carpeta original. El paquete JavaScript exportado en `dist` por Metro, por sí solo, no es un APK.

La configuración nativa inicial utiliza la firma de desarrollo de Expo. Antes de distribuir una versión definitiva, configurar una firma propia y conservarla para permitir actualizaciones. Las pruebas de arranque, uso sin conexión y persistencia en teléfono siguen la lista de `ANDROID-QA.md`.

## Dependencias

Se fijó `react-dom` en 19.1.0, igual que React. Aunque la app es Android, Expo Router declara dependencias opcionales web y npm elegía una versión incompatible que impedía ejecutar `npm ci`.

La auditoría npm de esta base Expo SDK 54 informa ocho alertas en dependencias transitivas (seis moderadas, dos altas). No se aplicó `npm audit fix --force`, que propone cambiar de SDK y requiere una migración y validación separadas. Expo Doctor comprueba compatibilidad, no sustituye esta auditoría.
