// =======================================================
// VARIABLES GLOBALES DE PARTIDA
// =======================================================

const DEFAULT_GAME_VARIABLES = Object.freeze({
  plantaViva: true,
  plantaAmiga: false,
  buzonAbierto: false,
  tenemosLlave: false,
});

function initializeGameVariables(reset = false) {
  if (reset || !GameState.variables) {
    GameState.variables = {};
  }

  Object.entries(DEFAULT_GAME_VARIABLES).forEach(([name, value]) => {
    if (!(name in GameState.variables)) {
      GameState.variables[name] = value;
    }
  });

  if (
    GameState.variables.plantaViva !== true &&
    GameState.variables.plantaAmiga === true
  ) {
    GameState.variables.plantaAmiga = false;
  }
}

function getGameVariable(name) {
  initializeGameVariables();
  return GameState.variables[name];
}

function setGameVariable(name, value) {
  initializeGameVariables();

  if (name === "plantaAmiga" && value === true) {
    if (GameState.variables.plantaViva !== true) {
      return false;
    }
  }

  GameState.variables[name] = value;

  if (name === "plantaViva" && value === false) {
    GameState.variables.plantaAmiga = false;
  }

  return value;
}

window.GameVariables = {
  initialize: initializeGameVariables,
  get: getGameVariable,
  set: setGameVariable,
};

initializeGameVariables();
