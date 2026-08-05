// -------------------------------------------------------
// MOVIMIENTO SIGUIENDO UNA RUTA (A*)
// -------------------------------------------------------
function updatePlayerByPath(delta) {
  const player = getActiveCharacter();

  if (state.path.length === 0 || state.pathIndex >= state.path.length) {
    player.moving = false;
    return;
  }

  const node = state.path[state.pathIndex];

  const targetX = node.col * mapData.tileWidth + mapData.tileWidth / 2;

  const targetY = (node.row + 1) * mapData.tileHeight + FOOT_OFFSET_Y;

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
      state.path = [];
      state.pathIndex = 0;

      player.moving = false;

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
  function updatePlayerByMouseTarget(delta) {
    // personaje actualmente controlado
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

      // ---------------------------------------------------
      // TELETRANSPORTE PENDIENTE
      // ---------------------------------------------------
      if (state.pendingTeleport) {
        changeMap(
          state.pendingTeleport.teleportTo,
          state.pendingTeleport.teleportX,
          state.pendingTeleport.teleportY,
          state.pendingTeleport.teleportDirection ?? "down",
        );

        state.pendingTeleport = null;
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
  
 // -------------------------------------------------------
  // COMPRUEBA SI EL PERSONAJE ESTÁ PISANDO UN PORTAL
  // -------------------------------------------------------
  function checkTeleportTrigger() {
    const portal = InteractionManager.getTeleportUnderPlayer(
      getActiveCharacter(),
      mapData,
      FOOT_OFFSET_Y,
    );

    if (!portal) {
      return;
    }

    changeMap(
      portal.teleportTo,
      portal.teleportX,
      portal.teleportY,
      portal.teleportDirection ?? "down",
    );
  }