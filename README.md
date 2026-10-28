# Match Roulette

Aplicación para Android y web móvil en React Native, Expo y TypeScript. Interfaz en español, tema oscuro y navegación con Expo Router. Android guarda en SQLite y la web en IndexedDB local. Sin backend ni sincronización entre dispositivos.

**Verificación web:** TypeScript, 103 pruebas y exportación para GitHub Pages aprobados. Ver docs/WEB.md para uso local y publicación.

## Web y GitHub Pages

Ejecutar npm ci, npm run build:web y npm run preview:web para abrir http://localhost:4173. Para publicar, seleccionar **GitHub Actions** en Settings → Pages del repositorio. El workflow publica cada cambio en main en https://alvrir.github.io/sss/.

Los datos se guardan en el navegador de cada dispositivo. GitHub aloja el código y la web; no recibe los torneos. Los datos de localhost no pasan automáticamente al sitio publicado: usar las copias JSON de Configuración si se desea trasladarlos.

## Ejecutar

Requisitos: Node 24 o posterior, npm y acceso al registro npm para instalar dependencias. La verificación local utilizó Node 26.1.0. Se conserva Expo SDK 54, con React 19.1 y React Native 0.81.5; el lockfile fija las versiones verificadas.

```bash
npm ci
npx expo install --fix
npx expo-doctor
npm run typecheck
npm test
npm start
```

`expo install --fix` alinea las versiones con la matriz oficial del SDK instalado. El `package-lock.json` ya está incluido: usar `npm ci` para repetir la instalación; ejecutar `expo install --fix` al modificar las dependencias del SDK.

Para probar los cálculos y el repositorio SQLite **sin instalar dependencias**, basta Node 24:

```bash
npm test
```

Los tests de persistencia usan SQLite real (`node:sqlite`) mediante un adaptador de la API asíncrona. Ejecutan el mismo repositorio, esquema, SQL y transacciones de producción. No sustituyen las pruebas del puente nativo `expo-sqlite` en Android.

## Generar APK sin EAS ni cuentas

1. Instalar Android Studio, Java 17/21 y el Android SDK requerido por Expo SDK 54 (plataforma 36, herramientas de compilación y NDK que solicite el proyecto generado).
2. Configurar `ANDROID_HOME` con la ruta del SDK, aceptar sus licencias y agregar `platform-tools` al PATH.
3. En Windows, ejecutar `npm run apk -- -BuildDirectory D:\CodexBuilds\match-roulette` (ver `docs/WINDOWS.md`). En Linux/macOS, ejecutar `npm run apk:unix`. Los scripts ejecutan TypeScript y tests, generan el proyecto Android y ejecutan Gradle.
4. El resultado esperado es `dist/match-roulette.apk`. Instalar con `adb install -r dist/match-roulette.apk` o abrir el archivo en el teléfono y permitir instalar desde esa fuente.

La plantilla nativa de Expo usa una firma de desarrollo para la compilación local inicial. Para distribuir actualizaciones persistentes a otras personas hay que configurar y conservar una keystore propia. No regenerar la firma entre actualizaciones, porque Android no permitirá actualizar una instalación firmada con otra clave. El APK release incluye el bundle JS y funciona sin Metro ni red.

## Uso

- **Inicio:** crear amistosos, cargar resultados y acceder a jugadores, catálogos e importación.
- **Ruletas:** seleccionar participantes, cargar/guardar grupos, seleccionar una lista o pegar equipos, girar cada ruleta y usar «Sortear todo». Se puede reemplazar solo A/B, cargar un partido amistoso o asignar equipos a un cruce pendiente de torneo.
- **Torneos:** crear una liga, copa o liga + copa. El modo manual deja el calendario vacío. El automático genera las fechas; luego se pueden editar partidos y marcadores.
- **Estadísticas:** combinar jugador, rival, equipo, equipo rival, juego, torneo, formato, fase, intervalo, año, temporada, tipo, resultado, búsqueda y últimos N. La orientación local/visitante no cambia el resultado del filtro.
- **Configuración:** desactivar animaciones y exportar/restaurar JSON con vista previa y confirmación.

Se crean los jugadores Alva, Rusio, Maiky, Lucho, Román y Ken, y los videojuegos PES 6, eFootball 2025 y EA Sports FC 26. Los catálogos de equipos están vacíos intencionalmente: no se inventaron datos oficiales. Agregar equipos manuales o importar listas JSON.

## Reglas y protección del historial

- IDs permanentes: renombrar o archivar jugadores no cambia sus participaciones. No hay borrado de jugadores; las claves foráneas también protegen registros con historial.
- Los equipos se almacenan por partido y videojuego. Las listas mantienen referencias independientes y pueden duplicarse, reordenarse, desactivarse, importarse/exportarse y eliminarse sin borrar equipos usados.
- Cada marcador reemplaza el anterior mediante `UPSERT`. Pendientes y cancelados no cuentan para estadísticas.
- La liga usa calendario circular, incluye descansos con número impar y verifica cruces obligatorios antes de clasificar.
- Los desempates no se resuelven por ID o nombre. Se declaran pendientes; una liga pura permite resolución explícita solo entre posiciones iguales. Los cruces de copa pueden configurarse mediante el orden manual de semillas.
- Las cantidades no potencia de dos usan pases directos por siembra. Las eliminatorias pueden tener ida/vuelta, final única y tercer puesto.
- Prórroga y penales son campos distintos. La tanda determina avance, pero no suma goles ni convierte un empate deportivo en victoria estadística. Los títulos se derivan del campeón del torneo.
- No se permite editar una ronda si tiene rondas dependientes jugadas. Para corregir una ida se debe retirar primero el resultado de vuelta.
- Después de generar eliminatorias, los resultados de liga quedan protegidos. «Revisar / retirar eliminatorias» explica el impacto y requiere confirmación. Los cruces pendientes se retiran; los jugados se conservan como amistosos, con el mismo ID, equipos, fecha y marcador. Luego puede corregirse la liga y generar un nuevo cuadro. Esta política es explícita; no se reescribe silenciosamente un cuadro disputado.
- La copia completa se valida antes de escribir y se restaura en una transacción. Guardar una copia fuera de la aplicación antes de desinstalar.

## Importación rápida

Texto:

```text
Alva 3-1 Rusio
Ken 0-0 Román
Maiky 2-2 Lucho
```

CSV:

```csv
local,visitante,goles_local,goles_visitante,fecha,equipo_local,equipo_visitante
Alva,Rusio,3,1,2026-10-27,,
Ken,Román,0,0,2026-10-27,,
```

Se muestra una vista previa, se señalan jugadores/equipos desconocidos y se omiten posibles duplicados por jugadores, marcador, fecha, torneo y videojuego, incluso invirtiendo local/visitante. Las columnas de equipos pueden omitirse. Las importaciones de torneo completan cruces de liga existentes o añaden cruces manuales sin duplicar. Los resultados de copa se cargan desde el cuadro para conservar prórroga, penales y dependencias.

## Arquitectura

```text
app/                  Rutas y pantallas nativas (cinco pestañas)
src/ui/               Componentes, ruleta SVG animada y formularios
src/domain/types.ts   Entidades e invariantes básicos
src/domain/engine.ts  Liga, tabla, eliminatorias, resultados y sorteo
src/domain/statistics.ts  Filtros, perspectivas y agregaciones
src/domain/imports.ts     Vista previa y parsing CSV/texto
src/domain/validation.ts  Validación de copias y referencias
src/data/repository.ts    Migración SQLite v1, UPSERT y transacciones
src/data/database.ts      Adaptador expo-sqlite
src/data/store.tsx        Contexto, escritura serializada y publicación tras commit
src/data/files.ts         Importación/exportación por APIs nativas
scripts/build-apk.sh      Compilación local
```

El motor no importa React ni Expo. SQLite usa WAL, claves foráneas e índices de fechas, participantes, juego, torneo/fase y equipos. Las entidades conservan sus campos extensibles en JSON; los campos de búsqueda y relaciones de partidos se indexan en columnas SQL. La versión inicial carga el estado en memoria y memoriza los cálculos de estadísticas; no implementa todavía consultas de estadísticas paginadas en SQL. Para historiales grandes, trasladar filtros/agrupaciones al repositorio sin cambiar las reglas del motor.

## Verificación pendiente antes de distribuir

Ver `docs/ANDROID-QA.md` para pruebas en dispositivo y `docs/test-results.txt` para la ejecución original. No se han generado capturas Android ni ejecutado pruebas visuales, de accesibilidad o rendimiento en un teléfono real. El lockfile permite repetir la instalación con `npm ci`; las verificaciones de TypeScript, dominio, SQLite y Metro Android ya se ejecutaron en Windows.
