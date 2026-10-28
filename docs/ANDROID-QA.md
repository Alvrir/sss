# Validación en Android pendiente

Estas verificaciones aún no se ejecutaron. Hacerlas tras resolver dependencias y compilar, antes de usar datos importantes.

1. Ejecutar `npx expo-doctor`, `npm run typecheck`, `npm test` y `npx expo export --platform android`; corregir cualquier incompatibilidad del SDK antes de generar APK.
2. Instalar el APK release, desconectar Wi-Fi/datos y arrancar sin Metro. Crear un amistoso 0-0; cerrar forzosamente y reabrir. Debe conservarse.
3. Crear liga de seis jugadores: verificar 15 partidos. Cargar resultados, editar uno y comprobar la tabla. Repetir ida/vuelta (30) y cinco participantes con descansos.
4. Completar liga + copa de seis participantes: clasificación de cuatro, semifinales 1-4 / 2-3, final y campeón. Verificar desempates pendientes y resolución manual.
5. Probar copas de 3, 5 y 6 participantes, ida/vuelta con global empatado, prórroga, penales y tercer puesto. Cambiar un resultado anterior a una final jugada: debe bloquearse.
6. Probar las dos ruletas con 1, 2, 6 y 20 segmentos, animación activada/desactivada y «Sortear todo». El segmento bajo la flecha debe coincidir con el resultado y permanecer estable al terminar. No permitir jugadores iguales.
7. Probar grupos guardados, modo ronda, modo equilibrado, equipos sin repetición y selección manual. Cambiar equipo no debe modificar los jugadores.
8. Registrar equipos del mismo nombre en dos juegos y filtrar estadísticas para comprobar que no se mezclan. Probar filtros combinados desde ambos lados local/visitante.
9. Importar CSV y texto con vista previa; repetir la importación; comprobar omisión de duplicados. Probar nombres desconocidos, tildes, empates y fechas históricas.
10. Exportar una copia usando el selector nativo; restaurarla después de modificar datos. Probar JSON corrupto, referencias inválidas y una versión futura; no deben alterar datos existentes.
11. Editar y archivar un jugador; revisar sus partidos históricos. Eliminar una lista y verificar que todos los equipos de partidos se conservan.
12. Usar pantalla pequeña, tamaño de texto grande, teclado numérico, botón Atrás y TalkBack. Verificar diálogos, tablas horizontales y que «Guardar resultado» quede accesible.
13. Medir arranque y carga del explorador con al menos 5.000 partidos en un teléfono de gama de entrada. Esta versión conserva el estado completo en memoria; documentar límites antes de ampliar el historial.
14. Confirmar que el APK release incluye JS y abre tras reiniciar el teléfono sin Internet. Conservar la misma clave de firma al instalar una actualización sobre datos existentes.
