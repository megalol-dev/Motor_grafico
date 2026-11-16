# Adventure Engine JS

> Motor gráfico 2D para crear aventuras gráficas point-and-click de estilo clásico, desarrollado desde cero con JavaScript y HTML5 Canvas e integrado con un editor visual de mapas.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Interfaz-1572B6?logo=css3&logoColor=white)
![Arquitectura](https://img.shields.io/badge/Arquitectura-Data--Driven-7C3AED)
![Estado](https://img.shields.io/badge/Estado-Prototipo_funcional-22C55E)

Adventure Engine JS combina un motor de juego y un editor visual en una única aplicación web. El proyecto permite construir escenas mediante imágenes y archivos JSON, definir zonas caminables, colocar objetos y hotspots, conectar mapas mediante puertas y jugar la aventura con una interfaz de verbos inspirada en clásicos como *Maniac Mansion* y *Monkey Island*.

El motor no utiliza frameworks ni librerías externas. La representación gráfica se realiza con Canvas, la interfaz se construye con HTML y CSS, y toda la lógica se organiza en módulos JavaScript especializados. Los catálogos describen qué elementos existen; el editor decide dónde se colocan; los JSON almacenan cada escena; y el motor interpreta esos datos durante la partida.

## Índice

- [Vista del proyecto](#vista-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Flujo de la aplicación](#flujo-de-la-aplicación)
- [Motor del juego](#motor-del-juego)
- [Sistema de interacción](#sistema-de-interacción)
- [Movimiento y pathfinding](#movimiento-y-pathfinding)
- [Estado, puertas e inventario](#estado-puertas-e-inventario)
- [Editor visual](#editor-visual)
- [Sistema basado en datos](#sistema-basado-en-datos)
- [Mapas disponibles](#mapas-disponibles)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Tecnologías](#tecnologías)
- [Ejecución local](#ejecución-local)
- [Estado actual y evolución prevista](#estado-actual-y-evolución-prevista)
- [Qué demuestra este proyecto](#qué-demuestra-este-proyecto)
- [Autor y contacto](#-autor-y-contacto)
- [Licencia](#-licencia)

## Vista del proyecto

### Editor visual

El editor permite construir el contenido jugable sobre la imagen de cada escenario, mostrando la cuadrícula, las zonas caminables, los objetos, sus hitboxes, los hotspots y las áreas de portal.

![Editor visual de Adventure Engine JS](img/imgREADME/EditorGame.png)

### Juego

La pantalla de juego combina el escenario renderizado en Canvas con una interfaz clásica de acciones, cambio de personaje e inventario.

![Partida en Adventure Engine JS](img/imgREADME/Game.png)

## Funcionalidades

### Experiencia de juego

- Pantalla de inicio y selección de un grupo de tres personajes entre seis disponibles.
- Cambio en tiempo real entre los tres integrantes del grupo.
- Posición, mapa e inventario independientes para cada personaje.
- Cámara centrada en el personaje activo y limitada por las dimensiones del escenario.
- Movimiento point-and-click sobre una cuadrícula navegable.
- Cálculo de rutas A* en cuatro direcciones.
- Animación por sprites según movimiento y dirección.
- Nueve verbos de aventura gráfica: `Usar`, `Abrir`, `Cerrar`, `Ver`, `Leer`, `Recoger`, `Encender`, `Apagar` y `Combinar`.
- Acción interna `Walk to` como comportamiento predeterminado.
- Detección de objetos y hotspots mediante áreas interactivas.
- Inventario visual de 16 espacios para el personaje activo.
- Selección de objetos del inventario para utilizarlos sobre elementos del escenario mediante `Usar`.
- Puertas enlazadas entre mapas, desbloqueo mediante objetos y teletransporte.
- Persistencia en memoria de objetos recogidos y puertas modificadas durante la partida.

### Herramientas del editor

- Carga de imágenes PNG como base de un mapa.
- Carga de los seis mapas registrados en el catálogo.
- Pintado y borrado de casillas caminables.
- Cuadrícula lógica de `24 × 30` píxeles.
- Creación, selección, desplazamiento y eliminación de objetos.
- Asignación de objetos a partir del catálogo global.
- Visualización de sprites e hitboxes.
- Creación, selección, desplazamiento y eliminación de hotspots.
- Asignación de tipos de hotspot desde el inspector.
- Definición visual de áreas de portal para puertas.
- Colocación, selección, arrastre y eliminación de gráficos decorativos de primer plano.
- Creación, edición y eliminación de NPC estáticos con animación, interacción y colisión configurable.
- Exportación del mapa completo a JSON.

## Arquitectura

La aplicación sigue una arquitectura modular y basada en datos. `app.js` administra las pantallas generales; `game.js` coordina la ejecución del juego; los módulos de `js/game/` encapsulan responsabilidades concretas; y `editor.js` mantiene su propio flujo de edición.

```mermaid
flowchart TB
    U[Usuario] --> APP[app.js<br/>navegación y selección del grupo]
    APP --> GAME[game.js<br/>orquestador del juego]
    APP --> EDITOR[editor.js<br/>editor visual]

    CATALOGS[Catálogos globales<br/>mapas · objetos · hotspots · verbos] --> GAME
    CATALOGS --> EDITOR
    JSON[JSON de cada mapa<br/>walkable · objetos · hotspots] --> GAME
    JSON --> EDITOR

    GAME --> EVENTS[EventsManager]
    GAME --> PLAYER[PlayerController]
    GAME --> WORLD[World + Movement + Pathfinding]
    GAME --> ACTIONS[Interactions + Inventory + Doors]
    GAME --> VIEW[Camera + Render]

    ACTIONS --> STATE[GameState<br/>estado de la partida]
    PLAYER --> STATE
    STATE --> VIEW
    VIEW --> CANVAS[Canvas + interfaz HTML]

    EDITOR --> EXPORT[Exportación de map.json]
    EXPORT -. incorporación manual .-> JSON
```

| Capa | Archivos principales | Responsabilidad |
|---|---|---|
| Aplicación | `js/app.js`, `js/config.js` | Cambia entre portada, selección, juego y editor; guarda el grupo elegido y controla el modo de desarrollo. |
| Orquestación | `js/game.js` | Inicializa recursos, conserva el estado de ejecución, carga mapas y sprites, coordina el bucle principal y conecta los gestores. |
| Entrada e interacción | `events.js`, `interactions.js` | Interpreta clics, hover, verbos, objetos, hotspots y acciones pendientes. |
| Navegación | `world.js`, `movement.js`, `pathfinding.js`, `player_controller.js` | Valida posiciones, calcula rutas, desplaza al personaje y ejecuta acciones al alcanzar el destino. |
| Estado de juego | `game_state.js`, `variables.js`, `doors.js`, `object_states.js`, `inventory.js` | Conserva cambios de objetos, estados visuales, variables globales, puertas enlazadas e inventarios. |
| Presentación | `camera.js`, `render.js`, `css/` | Calcula el encuadre y dibuja mapas, objetos y personajes; presenta la interfaz del juego y del editor. |
| Contenido | `js/catalogs/`, `data/maps/`, `img/` | Define recursos reutilizables y almacena la configuración concreta de cada escena. |
| Edición | `js/editor.js` | Permite modificar visualmente colisiones, objetos, hotspots y portales, y exportar el resultado. |

### Principios de diseño

| Principio | Aplicación en el proyecto |
|---|---|
| Separación de responsabilidades | El orquestador delega cámara, renderizado, movimiento, rutas, interacciones, inventario y puertas en módulos independientes. |
| Contenido separado de la lógica | Los mapas y sus instancias se almacenan en JSON; las definiciones reutilizables viven en catálogos. |
| Estado no destructivo | Los JSON actúan como plantilla y `GameState` guarda los cambios de la sesión sin modificar los archivos originales. |
| Reutilización | Una definición de objeto o puerta puede utilizarse desde el editor y desde el juego. |
| Compatibilidad progresiva | El editor completa datos ausentes desde los catálogos y contempla mapas antiguos sin `typeId`. |
| Escalabilidad modular | Los gestores se exponen mediante `window` y reciben por parámetros el contexto que necesitan. |

## Flujo de la aplicación

```mermaid
stateDiagram-v2
    [*] --> Portada
    Portada --> Seleccion: Start, Enter o espacio
    Portada --> Editor: tecla 1 con DEV_MODE activo
    Seleccion --> Seleccion: elegir o retirar personaje
    Seleccion --> Juego: grupo de 3 + Start o Enter
    Juego --> Juego: explorar, interactuar y cambiar personaje
    Editor --> Editor: cargar, editar y exportar mapas
```

`CONFIG.DEV_MODE` controla el acceso directo al editor desde la portada. Cuando está activo, la tecla `1` abre las herramientas de creación; cuando está desactivado, el jugador solo puede seguir el flujo normal hacia la selección de personajes.

La selección se guarda en `localStorage` y el motor asigna los sprites elegidos a `slot1`, `slot2` y `slot3`. Después, cada integrante mantiene su propio mapa, posición, dirección e inventario.

## Motor del juego

### Orquestador y ciclo de actualización

`GameModule`, definido en `js/game.js`, es el punto central del runtime. Su función no es implementar todos los sistemas, sino inicializarlos y proporcionarles el contexto necesario.

```mermaid
sequenceDiagram
    participant App as app.js
    participant Game as GameModule
    participant Data as JSON y sprites
    participant RAF as requestAnimationFrame
    participant Managers as Gestores del motor
    participant Canvas

    App->>Game: init()
    Game->>Data: carga personajes y map1
    Data-->>Game: mapa, objetos e imágenes
    Game->>Managers: enlaza eventos y aplica estado persistente
    App->>Game: start()
    loop Cada frame
        RAF->>Game: update(delta)
        Game->>Managers: movimiento, animación y cámara
        Game->>Managers: render(...)
        Managers->>Canvas: mapa, objetos y personajes
    end
```

| Elemento | Implementación actual |
|---|---|
| Renderizado | Canvas interno de `1248 × 540`, escalado visualmente mediante CSS. |
| Escala | Mapa y personajes se dibujan con escala `3`. |
| Sprites | Se cargan seis hojas de personaje y los sprites utilizados por el mapa actual. |
| Animación | Cuatro frames de movimiento y frames de reposo para las direcciones arriba, abajo, izquierda y derecha. |
| Actualización | `requestAnimationFrame` calcula `delta`, actualiza el jugador activo y vuelve a renderizar. |
| Cambio de mapa | Carga el nuevo JSON y su imagen, restaura estados, coloca al personaje activo y recentra la cámara. |

### Renderizado y cámara

`RenderManager` dibuja, en este orden:

1. La región visible de la imagen del mapa.
2. Los objetos visibles y no recogidos.
3. Los NPC y personajes presentes en el mismo mapa, ordenados por la coordenada de sus pies.
4. Los gráficos traspasables de primer plano definidos por el mapa.

Las puertas abiertas siguen existiendo en los datos, pero su sprite deja de dibujarse y también dejan de bloquear el movimiento. `CameraManager` sigue al personaje activo y limita el desplazamiento para no mostrar espacio exterior al mundo.

## Sistema de interacción

Los verbos visibles se generan dinámicamente desde `VerbLibrary`. Los clics del usuario se convierten desde coordenadas de pantalla a coordenadas del mundo y se comprueba, por orden, si existe un objeto, un hotspot o suelo bajo el cursor.

La botonera utiliza una cuadrícula de cuatro columnas y tres filas horizontales: `Usar/Abrir/Cerrar/Hablar`, `Ver/Leer/Recoger` y `Encender/Apagar/Combinar`. Las posiciones restantes quedan vacías sin añadir botones ficticios.

```mermaid
flowchart TD
    CLICK[Clic en Canvas] --> POINT[Convertir a coordenadas del mundo]
    POINT --> HIT{¿Qué se ha pulsado?}
    HIT -->|Objeto| OBJ[Resolver verbo y punto de interacción]
    HIT -->|Hotspot| HOT[Resolver verbo y casilla cercana]
    HIT -->|Suelo| GROUND[Buscar casilla caminable cercana]
    OBJ --> NOW{¿El personaje ya está allí?}
    HOT --> PATH[A*]
    GROUND --> PATH
    NOW -->|Sí| ACTION[Ejecutar interacción]
    NOW -->|No| PATH
    PATH --> FOUND{¿Existe ruta?}
    FOUND -->|Sí| MOVE[Recorrer la ruta]
    FOUND -->|No| ERROR[Mostrar: No encuentro un camino]
    MOVE --> ACTION
    ACTION --> RESULT[Mensaje, inventario, puerta o cambio de mapa]
```

| Acción | Comportamiento implementado |
|---|---|
| `Walk to` | Camina hasta el suelo, objeto o puerta; atraviesa una puerta que ya esté abierta. |
| `Ver` | Muestra directamente la descripción del objeto o hotspot sin obligar al personaje a caminar. |
| `Recoger` | Se aproxima al objeto, comprueba que sea recogible, lo oculta del mapa y lo añade al inventario activo. |
| `Usar` | Permite seleccionar un objeto del inventario y utilizarlo sobre un elemento del escenario. |
| `Abrir` | Abre puertas normales; si una puerta requiere un objeto, informa de que está cerrada con llave. |
| Otros verbos | Están disponibles en la interfaz y preparados para ampliar sus comportamientos específicos. |

Los mensajes se muestran en la línea de acciones. Tras completar acciones como `Ver`, `Recoger` o abrir una puerta, el sistema vuelve al comportamiento predeterminado de desplazamiento.

## Movimiento y pathfinding

Cada mapa contiene una matriz `walkable`. El valor `1` identifica una casilla transitable y `0` una zona bloqueada. Las puertas cerradas añaden obstáculos dinámicos sin modificar esa matriz.

El módulo `PathfindingManager` implementa A* con estas características:

- Heurística Manhattan.
- Movimiento ortogonal en cuatro direcciones.
- Sin diagonales, para evitar atravesar esquinas.
- Búsqueda de la casilla caminable más cercana cuando el destino exacto no es válido.
- Puntos de interacción explícitos para objetos y puertas.
- Búsqueda automática de una posición cercana para hotspots.

`PlayerController` recorre los nodos devueltos por A*, actualiza la dirección visual y ejecuta la interacción pendiente al alcanzar el último nodo. `MovementManager` se encarga de validar cada posición y de actualizar la animación.

## Estado, puertas e inventario

### Estado de la partida

Los archivos JSON nunca se alteran durante el juego. `GameState` mantiene dos almacenes en memoria:

| Almacén | Contenido |
|---|---|
| `GameState.maps` | Copias del estado modificado de objetos concretos en cada mapa. |
| `GameState.doors` | Estado compartido `opened` y `locked` de cada pareja; los accesos forzados añaden `forcedOpen`. |

Este diseño permite recoger un objeto, cambiar de escena y conservar su desaparición al regresar. También mantiene sincronizadas las dos caras de una puerta durante toda la sesión.

### Objetos con estados visuales

Los objetos de catálogo con `type: "stateful"` conservan una única instancia interactiva. `state` identifica su estado actual y `stateSprites` relaciona cada estado con su PNG. `StatefulObjectManager` selecciona el sprite, persiste la instancia mediante `GameState.maps` y sincroniza un contenido opcional configurado con `containedObjectId`.

El buzón `!buzon` comienza en `cerrado`, usa `!buzon1_Cerrado.png` y cambia a `!buzon2_Abierto.png` al abrirse. Ambos PNG se representan a su tamaño nativo de `28 × 45` píxeles, mientras la hitbox conserva `48 × 60` para no cambiar la colisión existente. La instancia de llave `key` vinculada permanece oculta y no interactuable mientras el buzón está cerrado. `buzonAbierto` refleja el estado visual y `tenemosLlave` solo se activa después de que la llave vinculada entre correctamente en un inventario.

El interruptor `!interruptor` comienza en `apagado` y responde a `Usar`, `Encender` y `Apagar` para alternar o fijar su estado entre `!Interruptor1.png` y `!Interruptor2.png`, ambos de `24 × 30` píxeles. Cuando existe una instancia válida y apagada en `map4`, el canvas completo del escenario recibe una capa negra con opacidad `0.90`, incluido el propio interruptor. Las interacciones normales quedan bloqueadas, pero siguen permitidas las tres acciones del interruptor y las puertas con un destino real fuera de `map4`; estas últimas conservan todas sus reglas de apertura y bloqueo. El estado se guarda en `GameState.maps` como el de cualquier otro objeto `stateful`. Si todavía no se ha colocado el interruptor, `map4` conserva su comportamiento normal.

El cubo mortal `!cuboBasura` reutiliza el mismo sistema `stateful`: comienza cerrado con `!CuboBasura_1.png` y cambia a `!CuboBasura_2.png` al ejecutar `Abrir` tras la aproximación A*. La apertura queda bloqueada contra duplicados mientras se desarrolla el diálogo; al procesarse la muerte, esa instancia concreta vuelve a `cerrado` y puede activarse de nuevo en una visita posterior. Spike es la única excepción: muestra el mensaje normal `Aquí no hay nada.`, no activa el sistema de diálogo ni la muerte y el cubo vuelve a cerrarse. Sus dos estados miden `28 × 45` píxeles. `Ver` muestra un comentario propio del protagonista activo y nunca activa la muerte.

### Muerte permanente y tumbas

`GameState.deaths` registra la muerte por posición del equipo (`slot1`, `slot2` y `slot3`), no por sprite global. Al cerrar el diálogo del olor se bloquea la entrada y la escena permanece visible durante 2000 ms antes del fundido a negro. Únicamente el personaje fallecido se traslada temporalmente a `map1` para enfocar la instancia `tumba_1`, `tumba_2` o `tumba_3` correspondiente, que permanece visible durante 3000 ms completos después del fundido. Tras presentar la tumba, el fondo vuelve a negro, escribe el mensaje de muerte durante 4400 ms y lo conserva completo otros 3000 ms. El siguiente superviviente recupera el control en su mapa, coordenadas y dirección anteriores. Cada tumba mide `54 × 59` píxeles, solo se dibuja cuando ha muerto su slot y se representa después de los objetos ordinarios. Si no está colocada, la secuencia continúa y deja una advertencia en consola.

Los objetos del fallecido conservan sus identificadores de instancia al pasar al Cofre Mágico. Si sus 50 casillas están ocupadas, el excedente permanece en `GameState.deaths.pendingItems` y se incorpora automáticamente cuando queda espacio. Los objetos vinculados se retiran del inventario pero quedan preservados e inaccesibles en `boundItems`, evitando una transferencia ilegal. El siguiente slot vivo se activa automáticamente; al morir los tres, el motor deja de seleccionar protagonistas, bloquea la entrada y muestra `GAME OVER`.

### Puertas enlazadas

Cada acceso utiliza un identificador `doorPair` común en sus dos extremos:

```mermaid
flowchart LR
    A[Puerta del mapa A] --> PAIR[(doorPair)]
    B[Puerta del mapa B] --> PAIR
    PAIR --> STATE[Estado compartido<br/>opened · locked]
    STATE --> A
    STATE --> B
```

Una puerta puede declarar el mapa de destino, la casilla de aparición, la dirección inicial, un objeto requerido y una casilla exacta de interacción. Al desbloquear una de sus caras, `DoorManager` actualiza el estado compartido y lo aplica a las instancias cargadas.

La pareja `door_pair_8` implementa el puzle de la puerta sin pomo. Sus dos caras (`door_14` en `map2` y `door_15` en `map8`) rechazan la apertura normal. Al usar el objeto de catálogo `028` sobre `door_14`, `DoorManager.forceDoorOpen()` registra `forcedOpen`, abre y desbloquea la pareja, y evita que cualquiera de sus caras vuelva a cerrarse durante la sesión. La barra no se consume y sigue perteneciendo al inventario del personaje que la recogió.

### Inventario por personaje

El estado contiene un inventario independiente para cada uno de los tres slots. Al cambiar de personaje, `InventoryManager` limpia la cuadrícula visual y representa únicamente sus objetos. Un elemento seleccionado para `Usar` se resalta y se incorpora al texto contextual al pasar el cursor sobre un objetivo.

Cada inventario mantiene exactamente 16 posiciones fijas: una casilla libre contiene `null` y una ocupada contiene el objeto. `InventoryManager.handlePickUp()` comprueba la capacidad del personaje activo antes de ocultar o persistir el objeto; si está lleno, la instancia permanece intacta en el escenario y puede recogerla otro personaje. Los objetos recogidos guardan además un `worldInstanceId` formado por mapa e id local, porque valores como `object_2` pueden repetirse legítimamente en mapas distintos. `InventoryManager.isSameItemInstance()` centraliza esta identidad para que inventario y Cofre Mágico distingan instancias de mapas diferentes sin dejar de rechazar duplicados reales.

Los objetos con `boundToCharacter` quedan vinculados al sprite de su propietario. Las comprobaciones comunes de `InventoryManager` impiden retirarlos, consumirlos o entregarlos a otro personaje; aun así ocupan una de las 16 casillas. El reemplazo atómico de un objeto permite resolver intercambios incluso con el inventario lleno, sin duplicaciones ni estados parciales.

La selección de `Usar` vive en `state.selectedInventoryItem`. Se conserva mientras el personaje camina hacia una interacción pendiente y se limpia, mediante `InventoryManager.clearSelectedInventoryItem()`, cuando la acción termina, falla o se cancela. Cambiar de verbo, de personaje o pulsar sobre suelo vacío también cancela la selección y elimina el resaltado amarillo sin consumir el objeto.

`InteractionManager` centraliza además las respuestas de uso incompatibles por `typeId`: la llave reconoce cualquier puerta que no acepte `key`, la barra `028` responde de forma uniforme ante objetivos incompatibles y `028 + NPC_1` tiene prioridad como excepción específica. Las combinaciones válidas se evalúan antes que estos mensajes. Al abrir correctamente `door_0`, el personaje activo queda orientado hacia arriba; al forzar `door_14`, queda orientado hacia la derecha. El giro se aplica al ejecutar la interacción tras finalizar la ruta, sin cambiar coordenadas ni movimiento A*.

### Variables de partida y planta carnívora

`GameVariables` proporciona `initialize()`, `get()` y `set()` sobre el almacén único `GameState.variables`. `plantaViva` comienza en `true` y `plantaAmiga` en `false`; ambas persisten al cambiar de mapa o personaje. La planta solo está activa cuando está viva y todavía no es amiga. Tanto al morir como al acompañar a Robin, todas las instancias `NPC_1` dejan de dibujarse, seleccionarse, animarse y bloquear movimiento o A*. El gestor evita el estado contradictorio `plantaViva=false` y `plantaAmiga=true`.

El verbo `Hablar` y los usos de objetos sobre NPC utilizan la aproximación A* y el `pendingNpc` existentes. Los textos de `NPC_1` se eligen mediante el sprite real `pj1`–`pj6` del personaje activo. Usar el insecticida `006` consume una sola vez el ejemplar seleccionado para Ryan, April, Milton, Hank o Spike e inicia la superposición no cíclica `insecticide`. Sus cuatro fotogramas duran 2500 ms cada uno; la planta continúa viva, visible y bloqueando la llave durante los 10 segundos completos. Solo al terminar el cuarto fotograma se asigna `plantaViva=false`. Mientras la secuencia está pendiente, el bucle sigue actualizando la animación pero bloquea movimiento, cambios de personaje y nuevas interacciones. Robin se niega y conserva el objeto.

Robin puede usar la ensalada `007` para hacerse amigo de la planta. Durante el diálogo, la planta continúa activa y muestra sobre su mismo rectángulo la animación `love` declarada en `overlayAnimations`; estas capas visuales usan sprites de `img/animations/` y no añaden colisión ni zonas interactivas. Al avanzar desde la última frase, el intercambio sustituye la ensalada por `NPC_1_friend` en la misma posición del inventario, detiene la animación y activa `plantaAmiga`. Solo entonces desaparece la planta y deja de bloquear la llave `002`. Los demás personajes conservan la ensalada y muestran su negativa específica. El nuevo objeto no pertenece a `ObjectLibrary` ni puede colocarse desde el editor: se crea solo por este evento, usa `generatedInstanceId: "plant_friend:pj6"`, representa de forma estática el primer fotograma del spritesheet de `NPC_1` y queda vinculado permanentemente a Robin mediante `boundToCharacter: "pj6"`. Esta solución y la del insecticida son mutuamente excluyentes.

La llave plateada `002` usa `002_key_patio.png` y se representa a `8 × 10` píxeles exclusivamente en el escenario y el editor. Una instancia puede indicar `blockedByNpcId` con el ID exacto del NPC que impide alcanzarla. Mientras ese NPC esté activo, `Ir a` y `Recoger` llevan al personaje mediante A* hasta una casilla válida junto al NPC y después muestran su mensaje de bloqueo. Cuando `NPC_1` muere o se convierte en amiga de Robin, deja de estar activo y la llave recupera automáticamente la aproximación y recogida normales. La puerta `door_8` resuelve `requiredItem: "002"` desde el catálogo: usar la llave desbloquea y abre `door_pair_5` en la misma interacción sin consumirla. La apertura no ejecuta la transición; esta continúa requiriendo una acción posterior de `Ir a`. El estado compartido de la pareja conserva el desbloqueo al cambiar de mapa o personaje y no vuelve a bloquearse al cerrar.

`DialogueManager` permite iniciar conversaciones reutilizables a partir de una lista de bloques `{ speaker, text }`. Solo muestra el bloque actual en la línea de acciones y avanza mediante clic, sin temporizadores. Durante la conversación, un único listener en fase de captura sobre `#game-screen` consume los clics antes de que alcancen el escenario, los verbos, el inventario o el selector de personajes. El indicador `◆` alterna visualmente entre rojo y amarillo mediante CSS. El evento de Robin utiliza cuatro bloques y confirma el intercambio una sola vez antes de iniciar la secuencia.

Actualmente el inventario vive en memoria: no existe todavía un sistema de guardado y carga de partidas entre sesiones del navegador.

## Editor visual

`EditorModule` funciona como una herramienta integrada dentro de la misma aplicación. Utiliza un Canvas con coordenadas lógicas del mapa y lo muestra ampliado al doble para facilitar la edición de pixel art.

| Modo | Operación |
|---|---|
| Pintar colisión | Marca una casilla como caminable en la matriz `walkable`. |
| Borrar colisión | Devuelve la casilla al estado no caminable. |
| Añadir objeto | Crea una instancia basada inicialmente en el objeto `key` del catálogo. |
| Editar objetos | Permite seleccionar, arrastrar y cambiar el tipo de una instancia. |
| Eliminar objeto | Borra la instancia seleccionada del mapa en edición. |
| Añadir hotspot | Dibuja una zona rectangular y la asocia al primer tipo disponible. |
| Editar hotspots | Permite mover la zona y cambiar su entrada de catálogo. |
| Eliminar hotspot | Retira la zona interactiva del mapa. |
| Añadir traspasable | Muestra un selector visual generado desde el catálogo y permite colocar varias instancias. |
| Editar traspasable | Selecciona y arrastra exclusivamente gráficos de `foregroundGraphics`. |
| Eliminar traspasable | Elimina con un clic únicamente la instancia traspasable situada más al frente. |
| Cr NPC | Abre el catálogo visual y coloca una o varias instancias de NPC. |
| Ed NPC | Selecciona, arrastra y configura la colisión rectangular de un NPC. |
| El NPC | Elimina con un clic únicamente la instancia de NPC seleccionada. |
| Definir zona portal | Dibuja un rectángulo asociado a una puerta. |
| Guardar JSON | Serializa imagen, cuadrícula, dimensiones, objetos, hotspots y `foregroundGraphics`. |

### Flujo de creación de contenido

```mermaid
flowchart LR
    ASSET[Crear imagen PNG] --> CATALOG[Registrar mapa y recursos]
    CATALOG --> LOAD[Cargar mapa en el editor]
    LOAD --> WALK[Pintar zonas caminables]
    WALK --> PLACE[Colocar objetos y hotspots]
    PLACE --> PORTAL[Configurar puertas y portales]
    PORTAL --> SAVE[Exportar JSON]
    SAVE --> DATA[Incorporar a data/maps]
    DATA --> PLAY[El motor construye la escena]
```

El editor genera una descarga JSON en el navegador. Para que el motor utilice la nueva versión, el archivo exportado debe colocarse manualmente en `data/maps/` con el nombre registrado en `MapLibrary`.

Para configurar el puzle del buzón, coloca una instancia de `!buzon` y otra de `key`, selecciona la llave y copia el valor mostrado como `ID ITEM MAP`. Después selecciona el buzón, pega ese valor en `ID DEL OBJETO CONTENIDO` y exporta el mapa. La relación utiliza IDs de instancia, por lo que no afecta a otras llaves ni a otros buzones. El inspector permite sobrescribir `Siempre por encima`; las llaves nuevas lo heredan activado desde el catálogo.

## Sistema basado en datos

La lógica compartida no se duplica en cada escena. El proyecto diferencia entre definición e instancia:

| Tipo de dato | Ubicación | Función |
|---|---|---|
| Catálogo de mapas | `js/catalogs/maps.js` | Relaciona identificador, nombre, imagen PNG y archivo JSON. |
| Catálogo de objetos | `js/catalogs/objects.js` | Define objetos y puertas: nombre, descripción, sprite, dimensiones, recogida, estado y teletransporte. |
| Catálogo de gráficos traspasables | `js/catalogs/graficos_traspasables.js` | Define decoraciones no interactivas que se renderizan por delante de los personajes. |
| Catálogo de NPC | `js/catalogs/npcs.js` | Define spritesheets, animaciones, interacción y colisión predeterminada de NPC reutilizables. |
| Catálogo de hotspots | `js/catalogs/hotspots.js` | Define nombres y descripciones de zonas sin sprite. |
| Catálogo de verbos | `js/catalogs/verbs.js` | Define identificadores internos y etiquetas visibles de las acciones. |
| Instancias de mapa | `data/maps/mapN.json` | Guarda posiciones, hitboxes, cuadrícula, objetos y hotspots de una escena. |
| Recursos gráficos | `img/maps/`, `img/objects/`, `img/personajes/`, `img/traspasables/`, `img/npcs/`, `img/animations/` | Contiene fondos, elementos interactivos, hojas de sprites, decoraciones, NPC y animaciones superpuestas. |

Una instancia de objeto utiliza `typeId` para vincularse con `ObjectLibrary`. El editor completa y sincroniza sus propiedades desde esa definición antes de guardar, mientras que el motor utiliza la instancia resultante para construir la escena.

Los objetos con estados pueden añadir estos campos:

| Campo | Descripción |
|---|---|
| `state` | Estado visual actual, por ejemplo `cerrado` o `abierto`. |
| `stateSprites` | Relación entre nombres de estado y archivos PNG. |
| `containedObjectId` | ID exacto de la instancia cuyo acceso depende del estado del contenedor. |
| `blockedByNpcId` | ID exacto de la instancia de NPC que bloquea temporalmente el acceso. El vínculo solo actúa mientras ese NPC esté activo en el mismo mapa. |
| `alwaysOnTop` | Si vale `true`, dibuja y selecciona la instancia después de los objetos normales visibles. No modifica su visibilidad ni su capa respecto a personajes o NPC. |
| `worldRenderWidth`, `worldRenderHeight` | Dimensiones opcionales usadas únicamente para dibujar y seleccionar el objeto en el escenario y en el editor; no cambian su PNG ni su representación en inventarios. |
| `interactionSide` | Lado estricto (`left`, `right`, `above` o `below`) desde el que A* debe aproximarse; si esa casilla no es válida, la acción no se ejecuta. |
| `interactionFacing` | Dirección final del personaje aplicada justo antes de ejecutar la interacción pendiente. |
| `containedInteractionSide`, `containedInteractionFacing` | Configuración que un contenedor transmite a su objeto vinculado mediante `containedObjectId`. |

Para configurar la llave plateada, coloca `002 - Llave plateada` en el mapa, selecciona la planta y copia su ID de instancia (por ejemplo, `NPC_1_instance_1`). Selecciona después la llave, pega ese valor en `ID DEL NPC BLOQUEADOR` y exporta el mapa. No hace falta configurar coordenadas de aproximación: el motor calcula el destino desde la colisión real del NPC.

### Datos principales de un mapa

| Campo | Descripción |
|---|---|
| `image` | Imagen de fondo de la escena. |
| `tileWidth`, `tileHeight` | Tamaño lógico de cada casilla. |
| `cols`, `rows` | Dimensiones de la cuadrícula. |
| `walkable` | Matriz binaria utilizada por movimiento y A*. |
| `objects` | Instancias visibles o interactivas colocadas en el mapa. |
| `hotspots` | Rectángulos interactivos sin sprite propio. |
| `foregroundGraphics` | Instancias decorativas traspasables dibujadas siempre por delante de los personajes. |
| `npcs` | Instancias de NPC con tipo, posición y rectángulo de colisión relativo. |

### Datos principales de una puerta

| Campo | Descripción |
|---|---|
| `doorPair` | Identificador que sincroniza las dos caras del acceso. |
| `opened`, `locked` | Estado inicial de la puerta. |
| `requiredItem` | `typeId` del objeto necesario para desbloquearla. |
| `requiresForcedOpen` | Impide la apertura normal mientras la pareja no tenga `forcedOpen`. |
| `forceOpenItem` | `typeId` del objeto que puede forzar esa cara concreta de la puerta. |
| `teleportTo` | Identificador del mapa de destino. |
| `teleportX`, `teleportY` | Casilla donde aparecerá el personaje. |
| `teleportDirection` | Orientación del personaje tras cambiar de mapa. |
| `interactionTileX`, `interactionTileY` | Casilla exacta desde la que se ejecuta la acción. |
| `interactionMode`, `teleportMode` | Configuración del modo de acceso para puertas especiales. |
| `portal` | Rectángulo visual definido desde el editor. |

## Mapas disponibles

El prototipo contiene seis escenas y cinco parejas de puertas:

| Mapa | Nombre | Cuadrícula | Contenido interactivo |
|---|---|---:|---|
| `map1` | Jardín | `32 × 6` | Llave y puerta principal hacia `map2`. |
| `map2` | Entrada | `32 × 6` | Puertas hacia `map1`, `map3`, `map4` y `map5`; hotspot de un cuadro. |
| `map3` | Cuarto de estar | `26 × 6` | Puerta de regreso a `map2`. |
| `map4` | Trastero | `18 × 6` | Puerta de regreso a `map2`. |
| `map5` | Cocina | `32 × 6` | Puertas hacia `map2` y `map6`. |
| `map6` | Patio trasero | `32 × 6` | Puerta de regreso a `map5`. |

```mermaid
flowchart LR
    M1[map1<br/>Jardín] <-->|door_pair_1| M2[map2<br/>Entrada]
    M2 <-->|door_pair_2| M3[map3<br/>Cuarto de estar]
    M2 <-->|door_pair_3| M4[map4<br/>Trastero]
    M2 <-->|door_pair_4| M5[map5<br/>Cocina]
    M5 <-->|door_pair_5| M6[map6<br/>Patio trasero]
```

## Estructura del repositorio

```text
.
├── index.html                   # Estructura de las cuatro pantallas y carga de scripts
├── README.md
├── css/
│   ├── ui.css                   # Portada y selección de personajes
│   ├── game.css                 # Canvas, verbos, personajes e inventario
│   └── editor.css               # Herramientas e inspector del editor
├── data/
│   ├── gameData.json            # Datos conservados de una etapa inicial del prototipo
│   └── maps/
│       ├── map1.json
│       └── ... map6.json
├── img/
│   ├── maps/                    # Fondos de las escenas
│   ├── objects/                 # Sprites de objetos y puertas
│   ├── personajes/              # Sprites y retratos de selección
│   └── imgREADME/               # Capturas de esta documentación
└── js/
    ├── app.js                   # Flujo general de pantallas y selección del grupo
    ├── config.js                # Configuración de desarrollo
    ├── editor.js                # Editor visual
    ├── game.js                  # Orquestador del motor
    ├── catalogs/
    │   ├── hotspots.js
    │   ├── maps.js
    │   ├── objects.js
    │   └── verbs.js
    └── game/
        ├── camera.js
        ├── dialogues.js
        ├── doors.js
        ├── events.js
        ├── game_state.js
        ├── variables.js
        ├── interactions.js
        ├── inventory.js
        ├── movement.js
        ├── pathfinding.js
        ├── player_controller.js
        ├── render.js
        └── world.js
```

Los scripts se cargan en un orden explícito desde `index.html`: primero la configuración y los catálogos, después el editor y los gestores del juego, y finalmente los orquestadores `game.js` y `app.js`. Este orden permite compartir los módulos mediante el objeto global `window` sin utilizar un empaquetador.

## Tecnologías

| Área | Tecnología | Uso |
|---|---|---|
| Estructura | HTML5 | Define portada, selección, juego, interfaz y editor. |
| Estilos | CSS3 | Diseño retro, distribución responsive, paneles y estados visuales. |
| Lógica | JavaScript ES6 | Motor, editor, entrada, estado y carga asíncrona de recursos. |
| Gráficos | Canvas API | Renderizado de escenarios, objetos, sprites y superposiciones del editor. |
| Datos | JSON | Persistencia de la configuración de cada mapa. |
| Almacenamiento local | Web Storage | Conserva la selección de personajes mediante `localStorage`. |
| Animación | `requestAnimationFrame` | Ejecuta el ciclo de actualización y renderizado. |
| Carga de recursos | Fetch API e `Image` | Obtiene mapas JSON, fondos y sprites desde el servidor local. |

## Ejecución local

### Requisitos

- Un navegador moderno con soporte para Canvas y JavaScript ES6.
- Un servidor HTTP local.
- Opcionalmente, Visual Studio Code con la extensión Live Server.

El proyecto no necesita instalar dependencias ni ejecutar un proceso de compilación.

### Puesta en marcha

1. Clona el repositorio:

```bash
git clone https://github.com/megalol-dev/Motor_grafico.git
```

2. Abre la carpeta del proyecto en Visual Studio Code.
3. Haz clic derecho sobre `index.html`.
4. Selecciona **Open with Live Server**.
5. Utiliza **Start**, `Enter` o la barra espaciadora para acceder a la selección de personajes.
6. Elige exactamente tres personajes y pulsa **Start Game**.

> No se recomienda abrir `index.html` directamente con el protocolo `file://`. Los mapas se cargan mediante `fetch()`, por lo que el navegador necesita servir el proyecto desde HTTP.

### Acceso al editor

Con `DEV_MODE: true` en `js/config.js`, pulsa la tecla `1` mientras estés en la portada. Desde el editor puedes cargar una escena registrada mediante **Editar**, modificarla y descargar su JSON con **Guardar JSON**.

## Estado actual y evolución prevista

El proyecto es un prototipo funcional del motor y de una pequeña aventura de demostración. La base modular y el flujo basado en datos ya están implementados, pero varios verbos y sistemas narrativos todavía están preparados para futuras ampliaciones.

### Implementado

- [x] Editor visual de mapas.
- [x] Matriz de colisiones y zonas caminables.
- [x] Movimiento point-and-click con A*.
- [x] Cámara y renderizado con sprites animados.
- [x] Selección y cambio entre tres personajes.
- [x] Objetos, hotspots y catálogos reutilizables.
- [x] Inventario independiente por personaje.
- [x] Cofre mágico compartido durante la sesión, con transferencias protegidas.
- [x] Recogida y uso de objetos.
- [x] Puertas enlazadas, desbloqueo y cambio de mapa.
- [x] Persistencia del estado durante la sesión.

### Evolución prevista

- [ ] Completar el comportamiento específico de todos los verbos.
- [ ] Añadir NPC y personajes con comportamiento propio.
- [ ] Incorporar conversaciones y árboles de diálogo.
- [ ] Crear un sistema de scripts y eventos narrativos.
- [ ] Añadir música, efectos de sonido y animaciones de escena.
- [ ] Implementar cinemáticas y transiciones.
- [ ] Incorporar misiones y condiciones de progreso.
- [ ] Guardar y cargar partidas entre sesiones.
- [ ] Ampliar el inspector del editor con propiedades editables, incluida la descripción de los objetos.
- [ ] Continuar reduciendo el acoplamiento a variables globales y evolucionar hacia módulos JavaScript nativos.

## Qué demuestra este proyecto

- Diseño desde cero de un motor especializado en aventuras gráficas 2D.
- Implementación práctica de un algoritmo A* integrado con colisiones dinámicas.
- Separación entre contenido, estado de ejecución y lógica del motor.
- Diseño de herramientas visuales para evitar editar manualmente los datos de cada escena.
- Gestión de múltiples personajes, inventarios y mundos conectados.
- Renderizado de pixel art, animación por sprites y cámara mediante Canvas.
- Refactorización progresiva desde un archivo central hacia gestores con responsabilidades concretas.
- Capacidad para construir una base ampliable sin depender de frameworks externos.

# 📫 Autor y contacto

📧 Email: **escuderopolojoseluis@gmail.com**

🌐 Portfolio: https://megalol-dev.github.io/

💼 LinkedIn: https://linkedin.com/in/jose-luis-escudero-polo

📺 YouTube: https://youtu.be/3K2VQ39qgwA?si=-HmeTHiYCnlPSxOE

---

## 📜 Licencia

Proyecto desarrollado con fines educativos, de investigación y como parte de un portfolio personal.

El código fuente puede utilizarse como referencia para aprendizaje y consulta, respetando siempre la autoría del proyecto. No está permitido utilizar este proyecto, ni partes sustanciales de su código, con fines comerciales o lucrativos sin autorización expresa del autor.

Esta versión utiliza algunos recursos gráficos inspirados o procedentes de videojuegos clásicos —entre ellos sprites de la versión de NES de *Maniac Mansion*— exclusivamente para demostrar técnicamente el funcionamiento del motor. Los derechos de esos recursos pertenecen a sus respectivos propietarios. Cualquier redistribución o explotación de dichos recursos será responsabilidad de quien la realice.
