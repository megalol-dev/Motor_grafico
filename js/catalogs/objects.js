// =======================================================
// CATÁLOGO GLOBAL DE OBJETOS
// =======================================================
//
// Este archivo define todos los objetos disponibles
// en el motor de la aventura gráfica.
//
// Cada objeto actúa como una plantilla.
// El editor copia estos valores cuando se crea
// un nuevo objeto sobre un mapa.
//
// Los estados del juego (abierto, recogido, etc.)
// se almacenan posteriormente en cada mapa y en
// el GameState durante la partida.
//
// =======================================================

// =======================================================
// PARÁMETROS GENERALES
// =======================================================
//
// id
// Identificador único del tipo de objeto.
//
// type
// Tipo de objeto ->item <recolectable> door <puerta>
//
// name
// Nombre que verá el jugador.
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
// Tamaño de la zona de colisión.
//
// pickup
// Indica si el objeto puede recogerse.
//
// =======================================================

// =======================================================
// PARÁMETROS DE PUERTAS
// =======================================================
//
// doorPair
// Identificador compartido entre las dos caras
// de una misma puerta.
//
// locked
// Indica si la puerta bloquea el paso.
//
// opened
// Estado inicial de la puerta.
//
// requiredItem
// Objeto necesario para abrirla (ej. una llave).
//
// interactionMode
// Desde dónde puede interactuarse con la puerta.
//
// teleportMode
// Desde dónde puede activarse el teletransporte.
//
// teleportTo
// Mapa de destino.
//
// teleportX
// teleportY
// Posición inicial del jugador en el mapa destino.
//
// teleportDirection
// Dirección inicial del personaje tras el teletransporte.
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

    interactionMode: "front",
    teleportMode: "inside",

    teleportTo: "map2",
    teleportX: 3,
    teleportY: 4,
    teleportDirection: "right",
  },

  // ---------------------------------------------
  // Door 1 - PUERTA PRINCIPAL / Salida - map 2
  // ---------------------------------------------
  {
    id: "door_1",
    doorPair: "door_pair_1",

    type: "door",
    name: "Puerta principal",

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
  },

  // ---------------------------------------------
  // Door 2 - Cuarto de estar / Entrada - map 3
  // ---------------------------------------------
  {
    id: "door_2",
    type: "door",
    doorPair: "door_pair_2",
    name: "Puerta",

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
  },

  // ---------------------------------------------
  // Door 3 - Cuarto de estar / Salida - map 2
  // ---------------------------------------------
  {
    id: "door_3",
    doorPair: "door_pair_2",

    type: "door",
    name: "Puerta",

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
  },

  // ---------------------------------------------
  // Door 4 - Trastero / Entrada - map 3
  // Estado Inicial -> cerrado
  // ---------------------------------------------
  {
    id: "door_4",
    doorPair: "door_pair_3",

    type: "door",
    name: "Puerta",

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
  },

  // ---------------------------------------------
  // Door 5 - Trastero / Salida - map 4
  // ---------------------------------------------
  {
    id: "door_5",
    doorPair: "door_pair_3",

    type: "door",
    name: "Puerta",

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
  },

  // ---------------------------------------------
  // Door 6 - Cocina / Entrada - map 2
  // ---------------------------------------------
  {
    id: "door_6",
    doorPair: "door_pair_4",

    type: "door",
    name: "Puerta",

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
  },

  // ---------------------------------------------
  // Door 7 - Cocina / Salida - map 5
  // ---------------------------------------------
  {
    id: "door_7",
    doorPair: "door_pair_4",

    type: "door",
    name: "Puerta",

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
  },

  // ---------------------------------------------
  // Door 8 - Patio Esterior / Entrada - map 5
  // ---------------------------------------------
  {
    id: "door_8",
    doorPair: "door_pair_5",

    type: "door",
    name: "Puerta",

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
