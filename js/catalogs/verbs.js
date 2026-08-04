// =======================================================
// CATÁLOGO GLOBAL DE VERBOS
// =======================================================
//
// id:
// Nombre interno utilizado por la lógica del motor.
//
// label:
// Texto en español que se muestra al jugador.
//
// Los identificadores actuales conservan los nombres
// que ya reconoce game.js para no romper funcionalidades.
//
// "Walk to" no aparece en este catálogo porque será
// una acción interna ejecutada mediante clic sobre el mapa.
//
// =======================================================

window.VerbLibrary = [
  // ---------------------------------------------
  // FILA 1
  // ---------------------------------------------
  {
    id: "use",
    label: "Usar",
  },

  {
    id: "open",
    label: "Abrir",
  },

  {
    id: "close",
    label: "Cerrar",
  },

  // ---------------------------------------------
  // FILA 2
  // ---------------------------------------------
  {
    id: "what is",
    label: "Ver",
  },

  {
    id: "read",
    label: "Leer",
  },

  {
    id: "pick up",
    label: "Recoger",
  },

  // ---------------------------------------------
  // FILA 3
  // ---------------------------------------------
  {
    id: "turn on",
    label: "Encender",
  },

  {
    id: "turn off",
    label: "Apagar",
  },

  {
    id: "combine",
    label: "Combinar",
  },
];
