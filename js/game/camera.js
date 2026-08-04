// =======================================================
// GESTOR DE LA CÁMARA
// =======================================================
//
// Este módulo centraliza toda la lógica relacionada con:
//
// - Posicionamiento de la cámara.
// - Seguimiento del personaje activo.
// - Cálculo de los límites del mundo.
// - Centrado de la cámara.
//
// El motor principal (game.js) únicamente llama a este
// gestor y le proporciona la información necesaria.
// Este módulo no accede directamente a variables del
// motor; recibe todos los datos mediante parámetros.
//
// =======================================================

// -------------------------------------------------------
// LIMITA UN VALOR ENTRE MIN Y MAX <refactor>
// -------------------------------------------------------
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// -------------------------------------------------------
// ANCHO TOTAL DEL MUNDO <refactor>
// -------------------------------------------------------
function getWorldWidth(mapData, canvas) {
  if (!mapData) return canvas.width;
  return mapData.cols * mapData.tileWidth;
}

// -------------------------------------------------------
// ALTO TOTAL DEL MUNDO <refactor>
// -------------------------------------------------------
function getWorldHeight(mapData, canvas) {
  if (!mapData) {
    return canvas.height;
  }

  return mapData.rows * mapData.tileHeight;
}

// -------------------------------------------------------
// CENTRA LA CÁMARA EN EL JUGADOR AL INICIO <refactor>
// -------------------------------------------------------
function centerCameraOnPlayer(player, state, canvas, mapData, MAP_SCALE) {
  const viewportWidth = canvas.width / MAP_SCALE;
  const viewportHeight = canvas.height / MAP_SCALE;

  state.camera.x = CameraManager.clamp(
    player.x - viewportWidth / 2,
    0,
    Math.max(0, CameraManager.getWorldWidth(mapData, canvas) - viewportWidth),
  );

  state.camera.y = CameraManager.clamp(
    player.y - viewportHeight / 2,
    0,
    Math.max(0, CameraManager.getWorldHeight(mapData, canvas) - viewportHeight),
  );
}

// -------------------------------------------------------
// ACTUALIZA LA CÁMARA PARA SEGUIR AL PERSONAJE ACTIVO
// -------------------------------------------------------
function updateCamera(player, state, canvas, mapData, MAP_SCALE) {
  const viewportWidth = canvas.width / MAP_SCALE;
  const viewportHeight = canvas.height / MAP_SCALE;

  const targetCameraX = player.x - viewportWidth / 2;
  const targetCameraY = player.y - viewportHeight / 2;

  state.camera.x = CameraManager.clamp(
    targetCameraX,
    0,
    Math.max(0, CameraManager.getWorldWidth(mapData, canvas) - viewportWidth),
  );

  state.camera.y = CameraManager.clamp(
    targetCameraY,
    0,
    Math.max(0, CameraManager.getWorldHeight(mapData, canvas) - viewportHeight),
  );
}

// -------------------------------------------------------
// MANAGER
// -------------------------------------------------------
window.CameraManager = {
  clamp,
  getWorldWidth,
  getWorldHeight,
  centerCameraOnPlayer,
  updateCamera,
};
