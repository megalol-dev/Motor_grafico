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
};
