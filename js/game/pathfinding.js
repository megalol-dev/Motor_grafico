// =======================================================
// PATHFINDING MANAGER
// -------------------------------------------------------
// Gestiona todo el cálculo de rutas del juego mediante A*,
// así como la búsqueda de casillas válidas para interactuar
// con objetos y hotspots.
// =======================================================

// -------------------------------------------------------
// CALCULA UNA RUTA MEDIANTE A* <refactorizado>
// -------------------------------------------------------
function findPathAStar(startCol, startRow, targetCol, targetRow, mapData) {
  if (!WorldManager.isWalkableTile(startCol, startRow, mapData)) {
    return [];
  }

  if (!WorldManager.isWalkableTile(targetCol, targetRow, mapData)) {
    return [];
  }

  const startKey = WorldManager.getTileKey(startCol, startRow);
  const targetKey = WorldManager.getTileKey(targetCol, targetRow);

  // Celdas pendientes de revisar
  const openSet = [
    {
      col: startCol,
      row: startRow,
      g: 0,
      h: Math.abs(targetCol - startCol) + Math.abs(targetRow - startRow),
      f: 0,
    },
  ];

  openSet[0].f = openSet[0].g + openSet[0].h;

  // Celdas ya revisadas
  const closedSet = new Set();

  // Guarda desde qué celda llegamos a cada posición
  const cameFrom = new Map();

  // Mejor coste conocido para cada celda
  const gScores = new Map();

  gScores.set(startKey, 0);

  // Movimiento en cuatro direcciones.
  // No usamos diagonales para evitar atravesar esquinas.
  const directions = [
    { col: 0, row: -1 },
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
  ];

  while (openSet.length > 0) {
    // Elegir la celda con menor coste total
    let bestIndex = 0;

    for (let i = 1; i < openSet.length; i += 1) {
      if (openSet[i].f < openSet[bestIndex].f) {
        bestIndex = i;
      }
    }

    const current = openSet.splice(bestIndex, 1)[0];
    const currentKey = WorldManager.getTileKey(current.col, current.row);

    // Hemos llegado al destino
    if (currentKey === targetKey) {
      const path = [];

      let reconstructionKey = targetKey;

      while (reconstructionKey !== startKey) {
        const [col, row] = reconstructionKey.split(",").map(Number);

        path.unshift({
          col,
          row,
        });

        reconstructionKey = cameFrom.get(reconstructionKey);

        if (!reconstructionKey) {
          return [];
        }
      }

      return path;
    }

    closedSet.add(currentKey);

    for (const direction of directions) {
      const nextCol = current.col + direction.col;
      const nextRow = current.row + direction.row;

      if (!WorldManager.isWalkableTile(nextCol, nextRow, mapData)) {
        continue;
      }

      const nextKey = WorldManager.getTileKey(nextCol, nextRow);

      if (closedSet.has(nextKey)) {
        continue;
      }

      // Cada desplazamiento ortogonal cuesta 1
      const tentativeG = current.g + 1;

      const previousG = gScores.get(nextKey);

      if (previousG !== undefined && tentativeG >= previousG) {
        continue;
      }

      cameFrom.set(nextKey, currentKey);
      gScores.set(nextKey, tentativeG);

      const h = Math.abs(targetCol - nextCol) + Math.abs(targetRow - nextRow);

      const existingNode = openSet.find(
        (node) => node.col === nextCol && node.row === nextRow,
      );

      if (existingNode) {
        existingNode.g = tentativeG;
        existingNode.h = h;
        existingNode.f = tentativeG + h;
      } else {
        openSet.push({
          col: nextCol,
          row: nextRow,
          g: tentativeG,
          h,
          f: tentativeG + h,
        });
      }
    }
  }

  // No existe ningún camino posible
  return [];
}

// -------------------------------------------------------
// PREPARA UNA RUTA HACIA UNA CELDA <refactorizado>
// -------------------------------------------------------
function createPathToTile(
  targetCol,
  targetRow,
  player,
  state,
  mapData,
  FOOT_OFFSET_Y,
) {
  const startTile = WorldManager.getCharacterTile(
    player,
    mapData,
    FOOT_OFFSET_Y,
  );

  // ---------------------------------------------------
  // Ya estamos en la casilla destino
  // ---------------------------------------------------
  if (startTile.col === targetCol && startTile.row === targetRow) {
    state.path = [];
    state.pathIndex = 0;
    state.target.active = false;

    return true;
  }

  const path = PathfindingManager.findPathAStar(
    startTile.col,
    startTile.row,
    targetCol,
    targetRow,
    mapData,
  );

  if (path.length === 0) {
    state.path = [];
    state.pathIndex = 0;
    state.target.active = false;

    return false;
  }

  state.path = path;
  state.pathIndex = 0;

  return true;
}

// -------------------------------------------------------
// BUSCA UNA CELDA CAMINABLE CERCA DE UN OBJETO <refactor>
// -------------------------------------------------------
function findInteractionTileForObject(obj, mapData) {
  const tileW = mapData.tileWidth;
  const tileH = mapData.tileHeight;

  // -------------------------------------------------------
  // OBJETOS QUE SE INTERACTÚAN DESDE DENTRO
  // -------------------------------------------------------

  if (obj.interactionMode === "inside") {
    // ---------------------------------------------------
    // Si el objeto define una casilla fija,
    // siempre usamos esa.
    // ---------------------------------------------------
    if (
      Number.isInteger(obj.interactionTileX) &&
      Number.isInteger(obj.interactionTileY)
    ) {
      return {
        col: obj.interactionTileX,
        row: obj.interactionTileY,
      };
    }

    // ---------------------------------------------------
    // Compatibilidad con objetos antiguos
    // ---------------------------------------------------
    const centerX = obj.x + obj.hitboxWidth / 2;

    const centerY = obj.y + obj.hitboxHeight / 2;

    return {
      col: Math.floor(centerX / tileW),

      row: Math.floor(centerY / tileH),
    };
  }

  const objectCenterX = obj.x + obj.hitboxWidth / 2;
  const objectBottomY = obj.y + obj.hitboxHeight;

  const objectCol = Math.floor(objectCenterX / tileW);
  const objectRow = Math.floor(objectBottomY / tileH);

  // Prioridad: debajo, izquierda, derecha, arriba
  const candidates = [
    { col: objectCol, row: objectRow + 1 },
    { col: objectCol - 1, row: objectRow + 1 },
    { col: objectCol + 1, row: objectRow + 1 },
    { col: objectCol - 1, row: objectRow },
    { col: objectCol + 1, row: objectRow },
    { col: objectCol, row: objectRow },
  ];

  for (const tile of candidates) {
    if (WorldManager.isWalkableTile(tile.col, tile.row, mapData)) {
      return tile;
    }
  }

  // Si ninguna cercana vale, buscamos una caminable alrededor
  return WorldManager.findNearestWalkableTile(objectCol, objectRow, mapData, 8);
}

// -------------------------------------------------------
// BUSCA EL PUNTO MÁS CERCANO PARA INTERACTUAR CON UN HOTSPOT <refactor>
// -------------------------------------------------------
function findInteractionTileForHotspot(hotspot, mapData) {
  const tileW = mapData.tileWidth;
  const tileH = mapData.tileHeight;

  const centerX = hotspot.x + hotspot.width / 2;
  const bottomY = hotspot.y + hotspot.height;

  const hotspotCol = Math.floor(centerX / tileW);
  const hotspotRow = Math.floor(bottomY / tileH);

  return WorldManager.findNearestWalkableTile(
    hotspotCol,
    hotspotRow,
    mapData,
    8,
  );
}

// -------------------------------------------------------
// Manager
// -------------------------------------------------------
window.PathfindingManager = {
  findPathAStar,
  createPathToTile,
  findInteractionTileForObject,
  findInteractionTileForHotspot,
};
