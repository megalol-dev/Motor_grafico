// =======================================================
// CATÁLOGO DE OBJETOS
// <hay dos tipos -> items y puertas>
// =======================================================
// Tipo 1
// PARÁMETROS GENERALES
// =======================================================
//
// id
// Identificador único del tipo de objeto.
//
// type
// Tipo de objeto.
// Ejemplos: item, door.
//
// name
// Nombre mostrado al jugador.
//
// description
// Texto descriptivo del objeto.
//
// sprite
// Imagen utilizada por el objeto.
//
// defaultSpriteWidth
// defaultSpriteHeight
// Tamaño inicial del sprite.
//
// defaultHitboxWidth
// defaultHitboxHeight
// Tamaño inicial de la zona de colisión.
//
// pickup
// Indica si el objeto puede recogerse.
//
// =======================================================

// =======================================================
// Tipo 1
// PARÁMETROS ESPECÍFICOS DE PUERTAS
// =======================================================
//
// doorPair
// Identificador compartido entre ambas caras
// de una misma puerta.
//
// locked
// Indica si la puerta permanece bloqueada.
//
// opened
// Estado inicial de la puerta.
//
// requiredItem
// Objeto necesario para desbloquearla.
//
// interactionMode
// Forma de interactuar con la puerta.
// front  -> desde delante.
// inside -> desde el interior del portal.
//
// teleportMode
// Forma en la que se activa el teletransporte.
//
// teleportTo
// Mapa de destino.
//
// teleportX
// teleportY
// Casilla donde aparecerá el jugador.
//
// teleportDirection
// Dirección inicial del personaje.
//
// interactionTileX
// interactionTileY
// Casilla exacta a la que debe desplazarse el
// personaje antes de ejecutar la interacción.
// Permite definir manualmente el punto de acceso
// para puertas u objetos especiales.
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

    description: "Una pequeña llave de hierro.",

    sprite: "001_key.png",

    defaultSpriteWidth: 16,
    defaultSpriteHeight: 16,

    defaultHitboxWidth: 16,
    defaultHitboxHeight: 16,

    pickup: true,
  },

  // ---------------------------------------------
  // Door 0 - PUERTA PRINCIPAL - map 1
  // ---------------------------------------------
  {
    id: "door_0",
    doorPair: "door_pair_1",

    type: "door",
    name: "Puerta principal",

    description: "Una pesada puerta de madera.",

    sprite: "door_0.png",

    defaultSpriteWidth: 50,
    defaultSpriteHeight: 60,

    defaultHitboxWidth: 48,
    defaultHitboxHeight: 60,

    pickup: false,

    locked: true,
    opened: false,

    requiredItem: "key",

    teleportTo: "map2",
    teleportX: 3,
    teleportY: 4,
    teleportDirection: "right",

    interactionTileX: 8,
    interactionTileY: 3,
  },

  // ---------------------------------------------
  // Door 1 - PUERTA PRINCIPAL / Salida - map 2
  // ---------------------------------------------
  {
    id: "door_1",
    doorPair: "door_pair_1",

    type: "door",
    name: "Puerta principal",

    description: "Es una puerta.",

    sprite: "door_1.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,

    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map1",
    teleportX: 8,
    teleportY: 3,
    teleportDirection: "down",

    interactionTileX: 3,
    interactionTileY: 4,
  },
  // ---------------------------------------------
  // Door 2 - Cuarto de estar / Entrada - map 3
  // ---------------------------------------------
  {
    id: "door_2",
    doorPair: "door_pair_2",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_2.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,

    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map3",
    teleportX: 3,
    teleportY: 4,
    teleportDirection: "right",

    interactionTileX: 28,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 3 - Cuarto de estar / Salida - map 2
  // ---------------------------------------------
  {
    id: "door_3",
    doorPair: "door_pair_2",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_3.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,

    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 28,
    teleportY: 4,
    teleportDirection: "left",

    interactionTileX: 3,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 4 - Trastero / Entrada - map 3
  // ---------------------------------------------
  {
    id: "door_4",
    doorPair: "door_pair_3",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_4.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,

    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map4",
    teleportX: 7,
    teleportY: 4,
    teleportDirection: "down",

    interactionTileX: 7,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 5 - Trastero / Salida - map 4
  // ---------------------------------------------
  {
    id: "door_5",
    doorPair: "door_pair_3",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_5.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,

    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 7,
    teleportY: 4,
    teleportDirection: "down",

    interactionTileX: 7,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 6 - Cocina / Entrada - map 2
  // ---------------------------------------------
  {
    id: "door_6",
    doorPair: "door_pair_4",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_6.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map5",
    teleportX: 7,
    teleportY: 4,
    teleportDirection: "down",

    interactionTileX: 19,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 7 - Cocina / Salida - map 5
  // ---------------------------------------------
  {
    id: "door_7",
    doorPair: "door_pair_4",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_7.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 19,
    teleportY: 4,
    teleportDirection: "down",

    interactionTileX: 7,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 8 - Patio Esterior / Entrada - map 5
  // ---------------------------------------------
  {
    id: "door_8",
    doorPair: "door_pair_5",

    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_8.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map6",
    teleportX: 8,
    teleportY: 3,
    teleportDirection: "down",

    interactionTileX: 26,
    interactionTileY: 4,
  },

  // ---------------------------------------------
  // Door 9 - Patio Exterior / Salida - map 6
  // Estado Inicial -> abierto
  // ---------------------------------------------
  {
    id: "door_9",
    doorPair: "door_pair_5",
    type: "door",
    name: "Puerta",

    description: "Es una puerta.",

    sprite: "door_9.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: false,
    interactionMode: "inside",
    teleportMode: "inside",

    teleportTo: "map5",
    teleportX: 26,
    teleportY: 4,
    teleportDirection: "down",

    interactionTileX: 8,
    interactionTileY: 3,
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
