# Web local para celular

El diseño y las funciones del torneo se conservan. La web usa IndexedDB para guardar los datos en cada navegador. Android conserva su SQLite independiente; las copias JSON permiten trasladar datos.

## Abrir localmente

```powershell
npm run build:web
npm run preview:web
```

Abrir http://localhost:4173. Mantener esa dirección y puerto para acceder a los mismos datos. `npm run web` sirve para desarrollo con recarga rápida; la prueba offline se realiza con la exportación y `preview:web`.

## Sin internet

La primera visita necesita acceder al servidor para descargar la app. En Configuración, esperar «Lista para usar sin conexión». Después la caché del service worker permite reabrir rutas y recursos sin red, y los datos permanecen en IndexedDB. Al actualizar, cerrar las pestañas de la app y volver a abrir para activar la nueva copia.

En un celular, el service worker requiere HTTPS o localhost. Esta vista local escucha únicamente en la PC. Para probar en Android por USB, con depuración autorizada, se puede ejecutar `adb reverse tcp:4173 tcp:4173` y abrir `http://localhost:4173` en el navegador del teléfono. Para usarla independientemente de la PC habrá que servir la misma exportación mediante HTTPS y cargarla una vez. No se publicó en Internet en esta preparación.

Los datos pertenecen al navegador y dispositivo usados. Borrar los datos del sitio puede eliminarlos. Exportar copias JSON desde Configuración; evitar navegación privada para guardar el historial.

## Verificación

TypeScript, 103 pruebas de dominio/SQLite y exportación web aprobados. El servidor local y los recursos precargados responden HTTP 200. Falta comprobar visualmente la interfaz, la persistencia y la reapertura offline en el navegador elegido: la herramienta de captura falló por timeout.

## Publicar en GitHub Pages

En el repositorio Alvrir/sss, abrir Settings → Pages y elegir Source: GitHub Actions. El workflow Publicar Match Roulette instala dependencias, ejecuta las pruebas y publica dist-pages. Se ejecuta en cada push a main y también desde Actions → Run workflow.

La URL prevista es https://alvrir.github.io/sss/. Para compilar esa versión localmente: npm run build:pages. La exportación local dist-web permanece independiente.

Los datos de localhost y los del sitio publicado pertenecen a orígenes distintos; se trasladan mediante exportación/importación JSON. El celular y la PC también tienen bases independientes.
