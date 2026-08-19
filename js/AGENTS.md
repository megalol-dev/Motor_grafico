# Instrucciones para el código JavaScript

## Alcance

Estas reglas se aplican a todo `js/`. Las carpetas `game/` y `catalogs/` añaden instrucciones más específicas.

## Modelo de módulos actual

El proyecto usa scripts clásicos cargados secuencialmente desde `index.html`:

1. `config.js`.
2. Catálogos.
3. `editor.js`.
4. Gestores de `js/game/`.
5. `game.js`.
6. `app.js`.

No hay `import`, `export`, bundler ni resolución automática de dependencias. Las APIs compartidas se publican en `window`, por ejemplo `window.GameModule`, `window.EditorModule`, `window.RenderManager` y las bibliotecas globales.

## Reglas de implementación

- Conserva el patrón del archivo: IIFE para módulos con estado privado y objetos `window.*Manager` para gestores compartidos.
- Expón públicamente solo lo que consuman otros módulos.
- Prefiere gestores sin estado propio: recibe dependencias y contexto mediante parámetros cuando sea razonable.
- Evita crear nuevas variables globales sueltas; agrupa las APIs nuevas bajo un nombre explícito en `window`.
- Si cambias una firma pública, actualiza todas sus llamadas en la misma modificación.
- Si añades un script nuevo, colócalo en `index.html` antes de su primer consumidor y documenta su responsabilidad.
- Conserva los identificadores de DOM existentes o actualiza de forma coordinada HTML, JavaScript y CSS.
- Mantén las cargas de `fetch()` y `Image` tolerantes a errores y no inicies lógica dependiente antes de que los recursos necesarios estén listos.
- No añadas listeners repetidos cuando `start()` pueda ejecutarse más de una vez. Sigue usando marcas como `dataset.bound` donde proceda.
- Mantén el estilo local de indentación, comillas y comentarios; no reformatees archivos completos por un cambio pequeño.

## Fronteras de responsabilidad

- `app.js` decide qué pantalla está activa; no debe absorber lógica de gameplay.
- `game.js` coordina; delega los detalles en los gestores de `js/game/`.
- `editor.js` manipula datos de edición; no debe depender del estado de una partida activa.
- `catalogs/` define contenido reutilizable; no debe ejecutar gameplay.

## Validación

- Ejecuta `node --check` en los JavaScript modificados.
- Busca referencias a funciones, propiedades o IDs renombrados con `rg`.
- Para cambios de interfaz, comprueba en navegador que no aparezcan errores en consola y que cada listener se ejecute una sola vez.
