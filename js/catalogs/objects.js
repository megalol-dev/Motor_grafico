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
// PARÁMETROS
// -------------------------------------------------------
//
// id
//      Identificador interno.
//      Debe ser único.
//      Nunca debe repetirse.
//
// name
//      Nombre que verá el diseñador en el editor.
//
// sprite
//      Imagen situada dentro de:
//
//          img/objects/
//
//      Se recomienda utilizar:
//
//          001_key.png
//          002_door_main.png
//          003_flowerpot.png
//
//      Así el catálogo queda siempre ordenado.
//
// defaultSpriteWidth
// defaultSpriteHeight
//
//      Tamaño con el que se dibuja el sprite.
//
//      No tiene por qué coincidir con el tamaño real
//      del PNG. Por ejemplo puertas si es comodo que sean del tamaño real del png (regilla),
//      pero objetos pequeños como una llave se pueden dibujar mas grandes y dibuja en el juego
//      de manera mas pequeña
//
// defaultHitboxWidth
// defaultHitboxHeight
//
//      Zona interactiva del objeto.
//
//      Puede ser igual que el sprite
//      o más pequeña/grande.
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

    pickup: false
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
