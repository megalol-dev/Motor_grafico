# Instrucciones para los mapas JSON

## Papel de estos archivos

Cada `mapN.json` describe una escena concreta. Estos archivos contienen geometría e instancias; las definiciones compartidas pertenecen a `js/catalogs/`.

## Esquema del mapa

Campos principales:

- `image`: PNG registrado para la escena.
- `tileWidth`, `tileHeight`: tamaño lógico de celda.
- `cols`, `rows`: dimensiones de la cuadrícula.
- `walkable`: matriz binaria de navegación.
- `objects`: instancias colocadas en esta escena.
- `hotspots`: rectángulos interactivos de esta escena.

## Invariantes de la cuadrícula

- `walkable` debe contener exactamente `rows` filas.
- Cada fila debe contener exactamente `cols` valores.
- Usa únicamente `0` y `1`: `1` significa caminable y `0` bloqueado.
- `cols × tileWidth` y `rows × tileHeight` deben ser coherentes con las dimensiones lógicas de la imagen.
- Las casillas de spawn, teletransporte e interacción deben quedar dentro de la cuadrícula y ser alcanzables según el comportamiento deseado.

## Instancias de objetos

- `id` debe ser único dentro del mapa.
- `typeId` debe referenciar una entrada existente de `ObjectLibrary`.
- `x` e `y`, tamaños, hitboxes y portales usan coordenadas lógicas sin escala de renderizado.
- Conserva `visible` y `collected` con valores iniciales apropiados.
- Para puertas, conserva `doorPair`, destino, dirección, punto de interacción y modos definidos por el catálogo.
- No redefinas aquí una propiedad compartida solo para una instancia si la corrección corresponde al catálogo.

## Hotspots

- `id` debe ser único dentro del mapa.
- `typeId` debe existir en `HotspotLibrary`.
- `x`, `y`, `width` y `height` describen el rectángulo interactivo en coordenadas lógicas.
- El nombre y la descripción pertenecen al catálogo, no deben duplicarse en cada hotspot.

## Edición segura

- Prefiere editar mediante `EditorModule` y revisar después el JSON exportado.
- La descarga del editor no reemplaza automáticamente el archivo del repositorio.
- Si editas a mano, no añadas comentarios ni comas finales: el archivo debe seguir siendo JSON válido.
- No reformatees matrices completas si el cambio afecta solo a un objeto; evita diffs difíciles de revisar.
- No modifiques `../gameData.json` como sustituto de estos mapas: es un formato legado que el runtime actual no carga.

## Validación

Después de modificar un mapa:

1. Analiza el JSON sin errores.
2. Verifica filas, columnas y valores de `walkable`.
3. Comprueba que `image`, sprites, `typeId` y destinos existen.
4. Carga el mapa desde el editor.
5. Entra en él desde el juego y prueba puertas, cámara, colisiones y regreso al mapa anterior.
