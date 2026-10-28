# APK con EAS Build

El perfil `preview` de `eas.json` solicita un APK instalable. EAS compila Android en sus servidores; no hace falta SDK Android local. La aplicación no utiliza EAS ni una conexión de red durante su uso normal.

Requisitos pendientes: conexión operativa desde este entorno a npm y Expo, y autenticación de la cuenta de Expo. Crear la cuenta no vincula automáticamente el entorno.

Para un entorno sin terminal interactiva, crear un token personal en https://expo.dev/accounts/[tu-usuario]/settings/access-tokens y configurarlo mediante el gestor de secretos del entorno como `EXPO_TOKEN`. No escribir el valor en archivos del proyecto, comandos guardados, mensajes ni commits. El token debe estar disponible al proceso de compilación. La alternativa es `npx eas-cli login` en una terminal interactiva privada.

Una vez resuelta la conexión:

```bash
npm install
npx expo install --fix
npx expo-doctor
npm run check
npx expo export --platform android
npx eas-cli whoami
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

`eas init` registra/vincula el proyecto y escribe su ID en la configuración. No inventar el ID. En la primera compilación, EAS puede solicitar generar una clave de firma Android; conservarla para las futuras actualizaciones. La cuota gratuita, las colas y los límites dependen del plan de Expo. No activar servicios de pago para este proyecto.

Si se trabaja en un directorio sin Git, EAS admite el modo `EAS_NO_VCS=1`; establecerlo solo para los comandos de EAS que lo necesiten. La exclusión de archivos se define en `.easignore`.

Una compilación exitosa devuelve una página con descarga del APK. Abrirla desde Android e instalar el archivo. Esta preparación no significa que se haya enviado una compilación: todavía no se han instalado las dependencias ni vinculado una cuenta desde el entorno actual.
