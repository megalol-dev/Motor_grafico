// =======================================================
// GESTOR DEL MUNDO Y UTILIDADES DEL MAPA
// =======================================================
//
// Este módulo centraliza toda la lógica relacionada con:
//
// - Comprobación de casillas caminables.
// - Detección de obstáculos dinámicos.
// - Búsqueda de casillas válidas.
// - Utilidades de coordenadas y celdas del mapa.
//
// El motor principal (game.js) únicamente llama a este
// gestor y le proporciona la información necesaria.
// Este módulo no accede directamente a variables del
// motor; recibe todos los datos mediante parámetros.
//
// =======================================================

// -------------------------------------------------------
// CREA UNA CLAVE ÚNICA PARA UNA CELDA <refactor>
// -------------------------------------------------------
function getTileKey(col, row) {
  return `${col},${row}`;
}

// -------------------------------------------------------
// COMPRUEBA SI UNA CASILLA ESTÁ BLOQUEADA POR UN OBJETO <refactor>
// -------------------------------------------------------
function isTileBlockedByObject(col, row, mapData) {
  if (!mapData?.objects) {
    return false;
  }

  const tileW = mapData.tileWidth;
  const tileH = mapData.tileHeight;

  // Centro de la casilla que A* quiere utilizar
  const tileCenterX = col * tileW + tileW / 2;
  const tileFootY = (row + 1) * tileH;

  for (const obj of mapData.objects) {
    if (obj.type !== "door") {
      continue;
    }

    // Una puerta abierta deja de bloquear el camino
    if (obj.opened) {
      continue;
    }

    const inside =
      tileCenterX >= obj.x &&
      tileCenterX <= obj.x + obj.hitboxWidth &&
      tileFootY >= obj.y &&
      tileFootY <= obj.y + obj.hitboxHeight;

    if (inside) {
      return true;
    }
  }

  return false;
}

// -------------------------------------------------------
// COMPRUEBA SI UNA CELDA ES CAMINABLE <refactor>
// -------------------------------------------------------
function isWalkableTile(col, row, mapData) {
  if (!mapData?.walkable) {
    return false;
  }

  if (row < 0 || col < 0 || row >= mapData.rows || col >= mapData.cols) {
    return false;
  }

  // La física fija del mapa bloquea la casilla
  if (mapData.walkable[row]?.[col] !== 1) {
    return false;
  }

  // Una puerta cerrada bloquea dinámicamente la casilla
  if (WorldManager.isTileBlockedByObject(col, row, mapData)) {
    return false;
  }

  return true;
}

// -------------------------------------------------------
// BUSCA LA CELDA CAMINABLE MÁS CERCANA <refactor>
// -------------------------------------------------------
function findNearestWalkableTile(startCol, startRow, mapData, maxRadius = 6) {
  if (WorldManager.isWalkableTile(startCol, startRow, mapData)) {
    return { col: startCol, row: startRow };
  }

  let best = null;
  let bestDist = Infinity;

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let row = startRow - radius; row <= startRow + radius; row += 1) {
      for (let col = startCol - radius; col <= startCol + radius; col += 1) {
        if (!WorldManager.isWalkableTile(col, row, mapData)) {
          continue;
        }

        const dx = col - startCol;
        const dy = row - startRow;
        const dist = Math.hypot(dx, dy);

        if (dist < bestDist) {
          bestDist = dist;
          best = { col, row };
        }
      }
    }

    if (best) {
      return best;
    }
  }

  return null;
}

// -------------------------------------------------------
// DEVUELVE LA CELDA EN LA QUE ESTÁ EL PERSONAJE
// -------------------------------------------------------
function getCharacterTile(character, mapData, FOOT_OFFSET_Y) {
  const col = Math.floor(character.x / mapData.tileWidth);

  const row = Math.floor((character.y - FOOT_OFFSET_Y) / mapData.tileHeight);

  return {
    col,
    row,
  };
}

window.WorldManager = {
  isTileBlockedByObject,
  isWalkableTile,
  findNearestWalkableTile,
  getCharacterTile,
  getTileKey,
};
