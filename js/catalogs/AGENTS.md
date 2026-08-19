# Instrucciones para los catálogos

## Papel de esta carpeta

Los catálogos son la fuente canónica de las definiciones reutilizables. Describen qué recursos existen; los JSON de `data/maps/` describen dónde se instancian.

- `maps.js`: escenas disponibles y relación entre identificador, PNG y JSON.
- `objects.js`: items y puertas reutilizables.
- `hotspots.js`: zonas interactivas sin sprite.
- `verbs.js`: acciones visibles e identificadores internos.

## Reglas generales

- Cada `id` debe ser estable y único dentro de su catálogo.
- No reutilices un `id` para un significado diferente: puede estar referenciado por mapas guardados o estado de partida.
- Mantén separados el identificador interno (`id`) y el texto visible (`name` o `label`).
- Conserva valores por defecto explícitos para que el editor pueda crear instancias completas.
- Si retiras o renombras una entrada, busca antes todas sus referencias en mapas, editor, runtime y recursos.
- Asegúrate de que todo nombre de imagen coincida exactamente con un archivo existente, incluida la extensión y las mayúsculas.

## Objetos

Campos comunes esperados:

- `id`, `type`, `name`, `description`, `sprite`.
- `defaultSpriteWidth`, `defaultSpriteHeight`.
- `defaultHitboxWidth`, `defaultHitboxHeight`.
- `pickup` para objetos recogibles.

Para puertas, revisa además:

- `doorPair`, `locked`, `opened`, `requiredItem`.
- `teleportTo`, `teleportX`, `teleportY`, `teleportDirection`.
- `interactionTileX`, `interactionTileY`.
- `interactionMode` y `teleportMode` cuando corresponda.

Las dos caras de un acceso deben compartir `doorPair`, apuntar a mapas opuestos coherentes y usar puntos de aparición transitables. `requiredItem` debe coincidir con el `id` de catálogo del objeto necesario.

## Mapas, hotspots y verbos

- Una entrada de `MapLibrary` necesita `id`, `name`, `image` y `json`; ambos archivos deben existir.
- Un hotspot necesita como mínimo `id`, `name` y `description`.
- Un verbo necesita `id` y `label`. Antes de cambiar un `id`, busca comparaciones literales en `events.js` e `interactions.js`.
- No añadas `Walk to` a `VerbLibrary` sin revisar el diseño de la interfaz: actualmente es una acción interna sin botón.

## Cambios de contenido

Al añadir un elemento nuevo:

1. Registra la definición en el catálogo adecuado.
2. Añade el recurso gráfico cuando corresponda.
3. Coloca una instancia desde el editor o actualiza el mapa de forma controlada.
4. Verifica que el editor carga, cambia y vuelve a guardar la instancia sin perder propiedades.
5. Comprueba el comportamiento en el runtime.
