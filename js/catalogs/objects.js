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
  // LLAVE
  // ---------------------------------------------
  {
    id: "key",
    name: "Llave",

    sprite: "001_key.png",

    defaultSpriteWidth: 16,
    defaultSpriteHeight: 16,

    defaultHitboxWidth: 16,
    defaultHitboxHeight: 16,

    pickup: true,
  },

  // ---------------------------------------------
  // PUERTA PRINCIPAL
  // ---------------------------------------------
  {
    id: "door_main",

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

    teleportTo: "map2",
    teleportX: 5,
    teleportY: 4,
    teleportDirection: "right",
  },

  // ---------------------------------------------
  // PUERTA PRINCIPAL - dentro de la casa
  // ---------------------------------------------
  {
    id: "door_1_close",

    name: "Puerta principal - salida",

    sprite: "door_1_open.png",

    defaultSpriteWidth: 24,
    defaultSpriteHeight: 71,

    defaultHitboxWidth: 24,
    defaultHitboxHeight: 71,

    pickup: false,

    locked: true,
    opened: true,

    teleportTo: "map1",
    teleportX: 8,
    teleportY: 5,
    teleportDirection: "dawn",
  },

  // ---------------------------------------------
  // MACETA
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
