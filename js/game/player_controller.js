// =======================================================
// PLAYER CONTROLLER
// =======================================================
//
// Gestiona todo el movimiento del personaje:
//
// - Seguimiento de rutas calculadas por A*.
// - Movimiento directo hacia destinos.
// - Finalización de interacciones pendientes.
// - Activación de teletransportes.
//
// Este módulo no mantiene estado propio.
// Toda la información necesaria se recibe desde
// GameModule mediante un objeto de contexto,
// evitando depender de variables globales.
//
// =======================================================

// -------------------------------------------------------
// MOVIMIENTO SIGUIENDO UNA RUTA (A*)
// -------------------------------------------------------
function updatePlayerByPath(delta, context) {
  const {
    state,
    mapData,
    actionLine,
    currentMapName,
    ctx,
    canvas,
    mapImageLoaded,
    mapImage,
    objectSprites,
    playerSprites,
    MAP_SCALE,
    PLAYER_SCALE,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    FOOT_OFFSET_Y,
    TARGET_REACHED_DIST,
    getVerbLabel,
    getActiveCharacter,
    changeMap,
  } = context;

  const player = getActiveCharacter();

  if (state.path.length === 0 || state.pathIndex >= state.path.length) {
    player.moving = false;
    return;
  }

  const node = state.path[state.pathIndex];

  const targetX = node.col * mapData.tileWidth + mapData.tileWidth / 2;
  const FOOT_POSITION_IN_TILE = 0.55;

  const targetY =
    node.row * mapData.tileHeight +
    mapData.tileHeight * FOOT_POSITION_IN_TILE +
    FOOT_OFFSET_Y;

  const dx = targetX - player.x;
  const dy = targetY - player.y;

  const distance = Math.hypot(dx, dy);

  // -----------------------------------------
  // ¿HEMOS LLEGADO A ESTA CASILLA?
  // -----------------------------------------
  if (distance <= TARGET_REACHED_DIST) {
    state.pathIndex++;

    // -----------------------------------------
    // ¿HEMOS TERMINADO LA RUTA?
    // -----------------------------------------
    if (state.pathIndex >= state.path.length) {
      // Centrar exactamente al personaje en la última casilla de la ruta BETA
      //player.x = targetX;
      //player.y = targetY;
      state.path = [];
      state.pathIndex = 0;

      player.moving = false;

      // ---------------------------------------------------------
      // Ajustar la posición final al centro exacto de la casilla
      // solo al abrir una puerta.
      // ---------------------------------------------------------
      if (
        state.currentVerb.toLowerCase() === "open" &&
        state.pendingInteraction?.type === "door" &&
        Number.isInteger(state.pendingInteraction.interactionTileX) &&
        Number.isInteger(state.pendingInteraction.interactionTileY)
      ) {
        player.x =
          state.pendingInteraction.interactionTileX * mapData.tileWidth +
          mapData.tileWidth / 2;

        const FOOT_POSITION_IN_TILE = 0.55;

        player.y =
          state.pendingInteraction.interactionTileY * mapData.tileHeight +
          mapData.tileHeight * FOOT_POSITION_IN_TILE +
          FOOT_OFFSET_Y;
      }

      if (state.pendingInteraction) {
        InteractionManager.handleObjectInteraction(
          state.pendingInteraction,
          state,
          actionLine,
          currentMapName,
          mapData,
          ctx,
          canvas,
          mapImageLoaded,
          mapImage,
          objectSprites,
          playerSprites,
          MAP_SCALE,
          PLAYER_SCALE,
          FRAME_WIDTH,
          FRAME_HEIGHT,
          getVerbLabel,
          changeMap,
        );

        state.pendingInteraction = null;
      }

      if (state.pendingHotspot) {
        InteractionManager.handleHotspotInteraction(
          state.pendingHotspot,
          state,
          actionLine,
        );

        state.pendingHotspot = null;
      }

      if (state.pendingTeleport) {
        const teleport = state.pendingTeleport;

        state.pendingTeleport = null;

        changeMap(
          teleport.teleportTo,
          teleport.teleportX,
          teleport.teleportY,
          teleport.teleportDirection ?? "down",
        );

        return;
      }

      return;
    }

    return;
  }

  const moveX = dx / distance;
  const moveY = dy / distance;

  MovementManager.updateDirectionFromVector(moveX, moveY, player);

  const step = player.speed * delta;
  const actualStep = Math.min(step, distance);

  player.x += moveX * actualStep;
  player.y += moveY * actualStep;

  player.moving = true;
}

// -------------------------------------------------------
// MOVIMIENTO POR DESTINO DE RATÓN
// -------------------------------------------------------
function updatePlayerByMouseTarget(delta, context) {
  const {
    state,
    mapData,
    actionLine,
    currentMapName,
    ctx,
    canvas,
    mapImageLoaded,
    mapImage,
    objectSprites,
    playerSprites,
    MAP_SCALE,
    PLAYER_SCALE,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    FOOT_OFFSET_Y,
    TARGET_REACHED_DIST,
    getVerbLabel,
    getActiveCharacter,
    changeMap,
  } = context;

  const player = getActiveCharacter();

  if (!state.target.active) {
    player.moving = false;
    return;
  }

  const dx = state.target.x - player.x;
  const dy = state.target.y - player.y;

  const distance = Math.hypot(dx, dy);

  // ---------------------------------------------------
  // HA LLEGADO AL DESTINO
  // ---------------------------------------------------
  if (distance <= TARGET_REACHED_DIST) {
    state.target.active = false;
    player.moving = false;

    // ejecutar interacción pendiente
    if (state.pendingInteraction) {
      InteractionManager.handleObjectInteraction(
        state.pendingInteraction,
        state,
        actionLine,
        currentMapName,
        mapData,
        ctx,
        canvas,
        mapImageLoaded,
        mapImage,
        objectSprites,
        playerSprites,
        MAP_SCALE,
        PLAYER_SCALE,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        getVerbLabel,
        changeMap,
      );

      state.pendingInteraction = null;
    }

    // ---------------------------------------------------
    // HOTSPOT
    // ---------------------------------------------------
    if (state.pendingHotspot) {
      InteractionManager.handleHotspotInteraction(
        state.pendingHotspot,
        state,
        actionLine,
      );

      state.pendingHotspot = null;
    }

    return;
  }

  // ---------------------------------------------------
  // SEGURIDAD EXTRA
  // ---------------------------------------------------
  if (distance < 0.001) {
    state.target.active = false;
    player.moving = false;

    return;
  }

  const moveX = dx / distance;
  const moveY = dy / distance;

  MovementManager.updateDirectionFromVector(moveX, moveY, player);

  // dirección visual del personaje activo

  const step = player.speed * delta;
  const actualStep = Math.min(step, distance);

  const nextX = player.x + moveX * actualStep;
  const nextY = player.y + moveY * actualStep;

  const oldX = player.x;
  const oldY = player.y;

  // ---------------------------------------------------
  // MOVIMIENTO
  // ---------------------------------------------------

  MovementManager.tryMovePlayer(nextX, nextY, player, mapData, FOOT_OFFSET_Y);

  const movedDistance = Math.hypot(player.x - oldX, player.y - oldY);

  /*
        if (movedDistance < BLOCKED_EPSILON) {
    
            state.target.active = false;
            player.moving = false;
    
            return;
        }
        */

  player.moving = true;
}



window.PlayerController = {
  updatePlayerByPath,
  updatePlayerByMouseTarget,
};
