// =======================================================
// ESTADO GLOBAL DE LA PARTIDA
// =======================================================
//
// Este archivo almacena TODOS los cambios que ocurren
// durante la partida.
//
// Nunca modifica los JSON originales.
//
// Los JSON son la plantilla.
// GameState guarda los cambios.
//
// =======================================================
window.GameState = {
  // Estados particulares de los objetos de cada mapa
  maps: {},

  // Estados compartidos por las parejas de puertas
  doors: {},

  // Variables globales reutilizables durante la partida
  variables: {},

  // Almacenamiento mágico compartido por todas las instancias del cofre 000
  chest: {
    items: [],
  },

  // Muertes permanentes por posición dentro del equipo seleccionado.
  deaths: {
    slots: {
      slot1: false,
      slot2: false,
      slot3: false,
    },
    pendingItems: [],
    boundItems: [],
    sequenceActive: false,
    gameOver: false,
  },
};
