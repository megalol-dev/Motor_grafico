# Instrucciones para el runtime del juego

## Responsabilidades por módulo

- `game_state.js`: almacén persistente en memoria de mapas y puertas.
- `doors.js`: sincronización de puertas y copias persistentes de objetos.
- `inventory.js`: recogida y representación del inventario activo.
- `camera.js`: dimensiones del mundo, límites y seguimiento.
- `world.js`: casillas, walkability y obstáculos dinámicos.
- `movement.js`: validación de posiciones, dirección y animación.
- `player_controller.js`: seguimiento de rutas y finalización de acciones pendientes.
- `pathfinding.js`: A* y selección de casillas de interacción.
- `events.js`: eventos de ratón, verbos y selección de personajes.
- `interactions.js`: consecuencias de verbos, objetos, hotspots y puertas.
- `render.js`: dibujo del mapa, objetos y personajes.

`js/game.js`, situado un nivel por encima, es el propietario del estado de ejecución y el orquestador de estos gestores.

## Convenciones espaciales

- Las coordenadas de mapas y objetos son coordenadas lógicas sin aplicar `MAP_SCALE`.
- `player.x` representa el centro horizontal del personaje.
- `player.y` representa la posición inferior o de apoyo usada para dibujarlo y navegar.
- `FOOT_OFFSET_Y` participa en la conversión entre el punto de apoyo y la celda lógica.
- La cuadrícula usa el `tileWidth` y `tileHeight` de cada JSON; actualmente son `24 × 30`.
- La cámara trabaja en coordenadas del mundo; la escala se aplica al convertir a Canvas.

No cambies una de estas convenciones localmente. Cualquier ajuste requiere revisar clics, cámara, renderizado, colisiones, A*, spawn, teletransporte y puntos de interacción.

## Flujo de movimiento e interacción

```text
clic → hit test → casilla objetivo → A* → PlayerController
     → llegada → pendingInteraction/pendingHotspot → consecuencia
```

- A* permite únicamente movimientos ortogonales y usa heurística Manhattan.
- `WorldManager.isWalkableTile` combina la matriz fija con las puertas cerradas.
- Una interacción que exige acercamiento se guarda como pendiente y solo se ejecuta al finalizar la ruta.
- Si el personaje ya está en la casilla objetivo, la ruta puede estar vacía y la acción debe ejecutarse sin introducir un frame de movimiento artificial.
- Al iniciar una acción nueva, limpia rutas, destinos o pendientes incompatibles para evitar ejecutar acciones antiguas.
- Conserva mensajes claros cuando no exista una casilla o una ruta válida.

## Personajes

- `state.player` representa `slot1`; `state.companions` contiene `slot2` y `slot3`.
- Usa `getActiveCharacter()` para operar sobre quien controla el usuario.
- Solo el personaje activo cambia de mapa al atravesar una puerta.
- Dibuja compañeros únicamente cuando están en el mismo mapa que el personaje activo.
- Inventarios, posiciones y `currentMap` deben seguir siendo independientes.

## Puertas y persistencia

- No uses el `id` de instancia para sincronizar caras; usa `doorPair`.
- `DoorManager.setDoorState` actualiza el estado compartido y resincroniza los objetos cargados.
- `persistObjectState` guarda una copia serializable de la instancia modificada bajo el mapa actual.
- `applyPersistentObjectStates` debe ejecutarse después de cargar los datos de un mapa y antes de presentarlo.
- Una puerta abierta no debe bloquear `WorldManager` ni `MovementManager`, y `RenderManager` no debe dibujarla.
- `requiredItem` usa el `typeId` del objeto de inventario, no necesariamente el `id` de su instancia de mapa.

## Verbos y mensajes

- `state.currentVerb` conserva los identificadores internos; normaliza con `toLowerCase()` solo al comparar.
- El valor predeterminado actual es `Walk to`, aunque no exista botón para él.
- `Ver` corresponde al id `what is` y muestra descripciones sin caminar.
- `showTemporaryMessage` mantiene el mensaje hasta la siguiente interacción; pese a su nombre, `messageTimeout` funciona actualmente como indicador y no como temporizador real.
- Después de una acción completa, restaura el verbo predeterminado cuando ese sea el comportamiento existente.

## Renderizado

- Mantén el orden: mapa, objetos, compañeros, personaje activo.
- No dibujes objetos `visible === false`, recogidos ni puertas abiertas.
- Conserva el fallback de jugador cuando falte un sprite.
- No actives suavizado de imagen.

## Validación focalizada

Además de comprobar sintaxis, prueba el recorrido afectado:

- Movimiento: destino válido, destino bloqueado y ruta inexistente.
- Objetos: hover, `Ver`, aproximación y `Recoger`.
- Inventario: selección con `Usar` y cambio de personaje.
- Puertas: cerrada, objeto incorrecto, llave correcta, cruce y regreso.
- Mapas: spawn, dirección, cámara y restauración de estado.
