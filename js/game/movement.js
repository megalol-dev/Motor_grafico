// =======================================================
// GESTOR DE MOVIMIENTO Y COLISIONES
// =======================================================
//
// Este módulo centraliza toda la lógica relacionada con:
//
// - Movimiento del personaje.
// - Comprobación de colisiones.
// - Validación de posiciones caminables.
// - Dirección visual del personaje.
// - Animación de movimiento.
//
// El motor principal (game.js) únicamente llama a este
// gestor y le proporciona la información necesaria.
// Este módulo no accede directamente a variables del
// motor; recibe todos los datos mediante parámetros.
//
// =======================================================

// -------------------------------------------------------
// COMPRUEBA SI UNA POSICIÓN ESTÁ BLOQUEADA POR UN OBJETO <refactor>
// -------------------------------------------------------
function isBlockedByObject(worldX, worldY, mapData) {
  if (!mapData?.objects) {
    return false;
  }

  for (const obj of mapData.objects) {
    if (obj.type !== "door") {
      continue;
    }

    // puerta abierta -> no bloquea
    if (obj.opened) {
      continue;
    }

    const inside =
      worldX >= obj.x &&
      worldX <= obj.x + obj.hitboxWidth &&
      worldY >= obj.y &&
      worldY <= obj.y + obj.hitboxHeight;

    if (inside) {
      return true;
    }
  }

  return false;
}

// -------------------------------------------------------
// COMPRUEBA SI EL PERSONAJE PUEDE ESTAR DE PIE EN ESA POSICIÓN <refactor>
// -------------------------------------------------------
function canStandAt(worldX, worldY, mapData, FOOT_OFFSET_Y) {
  if (!mapData?.walkable) return true;

  const tileW = mapData.tileWidth;
  const tileH = mapData.tileHeight;

  const footX = worldX;
  const footY = worldY - FOOT_OFFSET_Y;

  const col = Math.floor(footX / tileW);
  const row = Math.floor(footY / tileH);

  if (row < 0 || col < 0 || row >= mapData.rows || col >= mapData.cols) {
    return false;
  }

  if (mapData.walkable[row]?.[col] !== 1) {
    return false;
  }

  if (MovementManager.isBlockedByObject(worldX, worldY, mapData)) {
    return false;
  }

  return true;
}

// -------------------------------------------------------
// INTENTA MOVER AL JUGADOR USANDO LA MATRIZ WALKABLE <refactor>
// -------------------------------------------------------
function tryMovePlayer(nextX, nextY, player, mapData, FOOT_OFFSET_Y) {
  if (MovementManager.canStandAt(nextX, player.y, mapData, FOOT_OFFSET_Y)) {
    player.x = nextX;
  }

  if (MovementManager.canStandAt(player.x, nextY, mapData, FOOT_OFFSET_Y)) {
    player.y = nextY;
  }
}

// -------------------------------------------------------
// DIRECCIÓN VISUAL SEGÚN VECTOR <refactor>
// -------------------------------------------------------
function updateDirectionFromVector(moveX, moveY, player) {
  if (Math.abs(moveX) > Math.abs(moveY)) {
    player.direction = moveX < 0 ? "left" : "right";
  } else {
    player.direction = moveY < 0 ? "up" : "down";
  }
}

// -------------------------------------------------------
// ANIMACIÓN DEL PERSONAJE
// -------------------------------------------------------
function updatePlayerAnimation(delta, player) {
  if (!player.moving) {
    player.animFrame = 0;
    player.animTimer = 0;

    return;
  }

  player.animTimer += delta;

  if (player.animTimer >= 0.12) {
    player.animTimer = 0;

    player.animFrame = (player.animFrame + 1) % 4;
  }
}

// -------------------------------------------------------
// Manager
// -------------------------------------------------------
window.MovementManager = {
  updateDirectionFromVector,
  updatePlayerAnimation,
  tryMovePlayer,
  canStandAt,
  isBlockedByObject,
};
