// Catálogo de personajes no jugables reutilizables.
// Las instancias y sus posiciones pertenecen al JSON de cada mapa.
window.NpcLibrary = [
  {
    id: "NPC_1",
    name: "Planta carnívora",
    description: "Es una planta carnívora bastante peculiar.",
    sprite: "NPC_1.Planta_carnivora.png",

    frameWidth: 24,
    frameHeight: 60,
    defaultSpriteWidth: 24,
    defaultSpriteHeight: 60,

    animated: true,
    animationRow: 0,
    animationFrames: 4,
    frameDuration: 1000,
    loop: true,

    overlayAnimations: {
      love: {
        sprite: "001 Amor.png",
        spriteFolder: "animations",
        frameWidth: 24,
        frameHeight: 60,
        animationRow: 0,
        animationFrames: 4,
        frameDuration: 1000,
        loop: true,
      },
      insecticide: {
        sprite: "002 Isectizida.png",
        spriteFolder: "animations",
        frameWidth: 24,
        frameHeight: 60,
        animationRow: 0,
        animationFrames: 4,
        frameDuration: 2500,
        loop: false,
      },
    },

    stationary: true,
    interactive: true,
    traspasable: false,

    defaultCollision: {
      offsetX: 4,
      offsetY: 48,
      width: 16,
      height: 12,
    },

    inventoryItem: {
      id: "NPC_1_friend",
      generatedInstanceId: "plant_friend:pj6",
      typeId: "NPC_1_friend",
      type: "item",
      name: "Planta carnívora",
      description: "Una planta carnívora que ha decidido acompañar a Robin.",
      sprite: "NPC_1.Planta_carnivora.png",
      spriteFolder: "npcs",
      inventoryFrame: {
        x: 0,
        y: 0,
        width: 24,
        height: 60,
      },
      boundToCharacter: "pj6",
    },
  },
];
