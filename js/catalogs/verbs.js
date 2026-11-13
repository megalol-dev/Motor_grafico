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

  {
    id: "talk",
    label: "Hablar",
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

// =======================================================
// PRESENTACIÓN DE VERBOS EN LA INTERFAZ
// =======================================================
// Los identificadores internos pueden seguir en inglés. Toda salida visible
// debe pasar por estas funciones para mostrarla en español de forma uniforme.
function getVisibleVerbLabel(id) {
  const normalizedId = String(id ?? "").toLowerCase();

  if (normalizedId === "walk to") {
    return "Ir a";
  }

  const verb = window.VerbLibrary.find(
    (item) => item.id.toLowerCase() === normalizedId,
  );

  return verb?.label ?? String(id ?? "");
}

function formatVerbPrompt(id) {
  return `${getVisibleVerbLabel(id)}...`;
}

function formatVerbTarget(id, targetName) {
  const label = getVisibleVerbLabel(id);

  if (String(id ?? "").toLowerCase() === "talk") {
    return `${label} con ${targetName}`;
  }

  return `${label} ${targetName}`;
}

function formatUseWith(itemName, targetName = "") {
  return targetName
    ? `Usar ${itemName} con ${targetName}`
    : `Usar ${itemName} con...`;
}

window.VerbManager = {
  getLabel: getVisibleVerbLabel,
  formatPrompt: formatVerbPrompt,
  formatTarget: formatVerbTarget,
  formatUseWith,
};
