// =======================================================
// CATÁLOGO GLOBAL DE OBJETOS DEL JUEGO
// =======================================================
//
// Este archivo define TODOS los objetos disponibles
// para el editor y para el motor del juego.
//
// Cada objeto actúa como una "plantilla".
// Cuando el usuario crea un objeto desde el editor,
// éste copia automáticamente estos valores.
//
// -------------------------------------------------------
// PARÁMETROS de los objetos
// -------------------------------------------------------

// Parametros generales, los tienen todos los objetos
//
// id:      Indentificador único.
// name:    Nombre del objeto en el juego
// sprite:  Imagen que utiliza el objeto en el juego

// defaultSpriteWidth:  Tamaño del spite 1 <puede ser el real del png o no>
// defaultSpriteHeight: Tamaño del sprite 2 <puede ser el real del png o no>

// pickup:  Incia si el objeto se puede recoger o no <true / false>

// Parametrso de puerta, los tienen las puertas
// locked:  Indica si esta bloqueando el acceso a un camino <true / false>
// opened:  Indica si esta abierta la puerta y deja pasar <true / false>

// requiredItem:  Indica que necesitas algo para operar, por ejemplo una llave
// teleportTo:    Indica el mapa al que quieres viajar, ejemplo -> map2
// teleportX:     Incida la cordenada X del teleporte <fila>
// teleportY:     Indica la cordandad Y del teleporte <columna>
// teleportDirection: Indica la dirección en la que aparece el spite del pj -> "right",
//
// =======================================================

window.ObjectLibrary = [
  // ---------------------------------------------
  // Item - LLAVE
  // ---------------------------------------------
  {
    id: "key",
    type: "item",
    name: "Llave",

    sprite: "001_key.png",

    defaultSpriteWidth: 16,
    defaultSpriteHeight: 16,

    defaultHitboxWidth: 16,
    defaultHitboxHeight: 16,

    pickup: true,
  },

  // ---------------------------------------------
  // Door 0 - PUERTA PRINCIPAL - map 1
  // Estado Inicial -> CERRADO
  // ---------------------------------------------
  {
    id: "door_main",
    type: "door",
    name: "Puerta principal",

    sprite: "002_door_main.png",
    openSprite: "002_door_main_open.png",

    defaultSpriteWidth: 50,
    defaultSpriteHeight: 60,

    defaultHitboxWidth: 48,
    defaultHitboxHeight: 60,

    pickup: false,

    locked: true,
    opened: false,

    requiredItem: "key",
    interactionMode: "front",

    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 3,
    teleportY: 4,
    teleportDirection: "right",
  },

  // ---------------------------------------------
  // Door 1 - PUERTA PRINCIPAL / Salida - map 2
  // Estado Inicial -> ABIERTO
  // ---------------------------------------------
  {
    id: "door_1_close",
    type: "door",
    name: "Puerta principal - salida",

    sprite: "door_1_open.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map1",
    teleportX: 8,
    teleportY: 3,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Door 2 - Cuarto de estar / Entrada - map 3
  // Estado Inicial -> Cerrado
  // ---------------------------------------------
  {
    id: "door_2_close",
    type: "door",
    name: "Puerta",

    sprite: "door_2_close.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map3",
    teleportX: 3,
    teleportY: 4,
    teleportDirection: "right",
  },

  // ---------------------------------------------
  // Door 3 - Cuarto de estar / Salida - map 2
  // Estado Inicial -> abierto
  // ---------------------------------------------
  {
    id: "door_3_close",
    type: "door",
    name: "Puerta",

    sprite: "door_3_open.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 28,
    teleportY: 4,
    teleportDirection: "left",
  },

  // ---------------------------------------------
  // Door 4 - Trastero / Entrada - map 3
  // Estado Inicial -> cerrado
  // ---------------------------------------------
  {
    id: "door_4_close",
    type: "door",
    name: "Puerta",

    sprite: "door_4_close.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map4",
    teleportX: 7,
    teleportY: 4,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Door 5 - Trastero / Salida - map 4
  // Estado Inicial -> abierto
  // ---------------------------------------------
  {
    id: "door_5_close",
    type: "door",
    name: "Puerta",

    sprite: "door_5_open.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 7,
    teleportY: 4,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Door 6 - Cocina / Entrada - map 2
  // Estado Inicial -> cerrado
  // ---------------------------------------------
  {
    id: "door_6_close",
    type: "door",
    name: "Puerta",

    sprite: "door_6_close.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map5",
    teleportX: 7,
    teleportY: 4,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Door 7 - Cocina / Salida - map 5
  // Estado Inicial -> abierto
  // ---------------------------------------------
  {
    id: "door_7_close",
    type: "door",
    name: "Puerta",

    sprite: "door_7_open.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 19,
    teleportY: 4,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Door 8 - Patio Esterior / Entrada - map 5
  // Estado Inicial -> cerrado
  // ---------------------------------------------
  {
    id: "door_8_close",
    type: "door",
    name: "Puerta",

    sprite: "door_8_close.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map6",
    teleportX: 8,
    teleportY: 3,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Door 9 - Patio Exterior / Salida - map 6
  // Estado Inicial -> abierto
  // ---------------------------------------------
  {
    id: "door_9_close",
    type: "door",
    name: "Puerta",

    sprite: "door_9_open.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map5",
    teleportX: 26,
    teleportY: 4,
    teleportDirection: "down",
  },

  // ---------------------------------------------
  // Objetos de la aventura ejemplo
  // ---------------------------------------------
  {
    id: "flowerpot",
    name: "Maceta",

    sprite: "003_flowerpot.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 28,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 28,
  },
];
