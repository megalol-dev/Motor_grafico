// =======================================================
// GESTOR DE RENDERIZADO
// =======================================================
//
// Este módulo centraliza toda la lógica relacionada con:
//
// - Dibujado del mapa.
// - Dibujado de objetos.
// - Dibujado del personaje activo.
// - Dibujado de los compañeros.
// - Selección de frames de animación.
// - Renderizado general del juego.
//
// El motor principal (game.js) únicamente llama a este
// gestor y le proporciona la información necesaria.
// Este módulo no accede directamente a variables del
// motor; recibe todos los datos mediante parámetros.
//
// =======================================================

// -------------------------------------------------------
// FALLBACK SI EL SPRITE NO CARGA <refactor>
// -------------------------------------------------------
function drawFallbackPlayer(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#1f4fff";
  ctx.fillRect(4, 18, 16, 20);

  ctx.fillStyle = "#1635c9";
  ctx.fillRect(5, 38, 5, 18);
  ctx.fillRect(14, 38, 5, 18);

  ctx.fillStyle = "#f08b6b";
  ctx.fillRect(5, 2, 14, 14);

  ctx.fillStyle = "#7a2f00";
  ctx.fillRect(4, 0, 16, 5);

  ctx.fillStyle = "#f08b6b";
  ctx.fillRect(1, 20, 3, 14);
  ctx.fillRect(20, 20, 3, 14);

  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(8, 20, 8, 12);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(4, 56, 7, 3);
  ctx.fillRect(13, 56, 7, 3);

  ctx.restore();
}

// -------------------------------------------------------
// FRAME PARA CUALQUIER PERSONAJE <refactor>
// -------------------------------------------------------
function getFrameForCharacter(character, FRAME_WIDTH, FRAME_HEIGHT) {
  const directionMap = {
    down: { idleCol: 0, animRow: 1 },
    up: { idleCol: 1, animRow: 4 },
    left: { idleCol: 2, animRow: 2 },
    right: { idleCol: 3, animRow: 3 },
  };

  const config = directionMap[character.direction] || directionMap.down;

  if (!character.moving) {
    return {
      sx: config.idleCol * FRAME_WIDTH,
      sy: 0,
    };
  }

  return {
    sx: character.animFrame * FRAME_WIDTH,
    sy: config.animRow * FRAME_HEIGHT,
  };
}

// -------------------------------------------------------
// SELECCIONA EL FRAME CORRECTO DEL SPRITE <refactor>
// -------------------------------------------------------
function getPlayerFrame(player, FRAME_WIDTH, FRAME_HEIGHT) {
  const directionMap = {
    down: { idleCol: 0, animRow: 1 },
    up: { idleCol: 1, animRow: 4 },
    left: { idleCol: 2, animRow: 2 },
    right: { idleCol: 3, animRow: 3 },
  };

  const config = directionMap[player.direction] || directionMap.down;

  if (!player.moving) {
    return {
      sx: config.idleCol * FRAME_WIDTH,
      sy: 0,
    };
  }

  return {
    sx: player.animFrame * FRAME_WIDTH,
    sy: config.animRow * FRAME_HEIGHT,
  };
}

// -------------------------------------------------------
// DIBUJA EL PERSONAJE AJUSTADO A LA CÁMARA
// -------------------------------------------------------
function drawPlayer(
  ctx,
  player,
  state,
  playerSprites,
  MAP_SCALE,
  PLAYER_SCALE,
  FRAME_WIDTH,
  FRAME_HEIGHT,
) {
  const drawWidth = player.width * PLAYER_SCALE;
  const drawHeight = player.height * PLAYER_SCALE;

  const screenX = Math.round(
    (player.x - state.camera.x) * MAP_SCALE - drawWidth / 2,
  );

  const screenY = Math.round(
    (player.y - state.camera.y) * MAP_SCALE - drawHeight,
  );

  // -------------------------------------------------------
  // OBTENER EL SPRITE DEL PERSONAJE ACTUAL <refactor>
  // -------------------------------------------------------
  const sprite = playerSprites[player.sprite];

  if (!sprite) {
    RenderManager.drawFallbackPlayer(ctx, screenX, screenY, PLAYER_SCALE);
    return;
  }

  const frame = RenderManager.getPlayerFrame(player, FRAME_WIDTH, FRAME_HEIGHT);

  ctx.drawImage(
    sprite,
    frame.sx,
    frame.sy,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    screenX,
    screenY,
    drawWidth,
    drawHeight,
  );
}

// -------------------------------------------------------
// DIBUJA LOS PERSONAJES SECUNDARIOS <render>
// -------------------------------------------------------
function drawCompanions(
  ctx,
  activePlayer,
  state,
  playerSprites,
  MAP_SCALE,
  PLAYER_SCALE,
  FRAME_WIDTH,
  FRAME_HEIGHT,
) {
  state.companions.forEach((companion) => {
    if (companion.currentMap !== activePlayer.currentMap) {
      return;
    }
    // -------------------------------------------------------
    // NO DIBUJAR EL PERSONAJE ACTIVO
    // -------------------------------------------------------
    if (companion.id === state.activeCharacter) {
      return;
    }

    // -------------------------------------------------------
    // USAR LOS SPRITES YA CARGADOS
    // -------------------------------------------------------
    const sprite = playerSprites[companion.sprite];

    if (!sprite) {
      return;
    }

    const drawWidth = companion.width * PLAYER_SCALE;

    const drawHeight = companion.height * PLAYER_SCALE;

    const screenX = Math.round(
      (companion.x - state.camera.x) * MAP_SCALE - drawWidth / 2,
    );

    const screenY = Math.round(
      (companion.y - state.camera.y) * MAP_SCALE - drawHeight,
    );

    const frame = RenderManager.getFrameForCharacter(
      companion,
      FRAME_WIDTH,
      FRAME_HEIGHT,
    );

    ctx.drawImage(
      sprite,
      frame.sx,
      frame.sy,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      screenX,
      screenY,
      drawWidth,
      drawHeight,
    );
  });

  // -------------------------------------------------------
  // DIBUJAR P1 SI NO ES EL ACTIVO
  // -------------------------------------------------------
  if (state.activeCharacter !== "slot1") {
    const p1 = state.player;

    if (p1.currentMap !== activePlayer.currentMap) {
      return;
    }

    const sprite = playerSprites[p1.sprite];

    if (!sprite) return;

    const drawWidth = p1.width * PLAYER_SCALE;

    const drawHeight = p1.height * PLAYER_SCALE;

    const screenX = Math.round(
      (p1.x - state.camera.x) * MAP_SCALE - drawWidth / 2,
    );

    const screenY = Math.round(
      (p1.y - state.camera.y) * MAP_SCALE - drawHeight,
    );

    const frame = RenderManager.getFrameForCharacter(
      p1,
      FRAME_WIDTH,
      FRAME_HEIGHT,
    );

    ctx.drawImage(
      sprite,
      frame.sx,
      frame.sy,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      screenX,
      screenY,
      drawWidth,
      drawHeight,
    );
  }
}

// -------------------------------------------------------
// DIBUJA EL MAPA TENIENDO EN CUENTA LA CÁMARA <refactor>
// -------------------------------------------------------
function drawMap(ctx, mapImageLoaded, mapImage, state, canvas, MAP_SCALE) {
  if (mapImageLoaded && mapImage) {
    ctx.drawImage(
      mapImage,
      Math.floor(state.camera.x),
      Math.floor(state.camera.y),
      Math.floor(canvas.width / MAP_SCALE),
      Math.floor(canvas.height / MAP_SCALE),
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return;
  }

  ctx.fillStyle = "#ff0400";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// -------------------------------------------------------
// DIBUJA LOS OBJETOS EN EL MAPA <refactor>
// -------------------------------------------------------
function drawObjects(ctx, mapData, objectSprites, state, MAP_SCALE) {
  if (!mapData?.objects) return;

  mapData.objects.forEach((obj) => {
    if (!obj.visible) return;
    if (obj.collected) return;

    // Una puerta abierta existe, pero su gráfico no se dibuja
    if (obj.type === "door" && obj.opened) {
      return;
    }

    const sprite = objectSprites[obj.sprite];
    if (!sprite) return;

    const screenX = Math.round((obj.x - state.camera.x) * MAP_SCALE);
    const screenY = Math.round((obj.y - state.camera.y) * MAP_SCALE);

    // ---------------------------------------------------
    // TAMAÑO VISUAL DEL SPRITE
    // ---------------------------------------------------
    const drawWidth = (obj.spriteWidth ?? obj.hitboxWidth) * MAP_SCALE;
    const drawHeight = (obj.spriteHeight ?? obj.hitboxHeight) * MAP_SCALE;

    // ---------------------------------------------------
    // DIBUJAR SPRITE
    // ---------------------------------------------------
    ctx.drawImage(sprite, screenX, screenY, drawWidth, drawHeight);
  });
}

// -------------------------------------------------------
// RENDER GENERAL
// -------------------------------------------------------
function render(
  ctx,
  canvas,
  mapImageLoaded,
  mapImage,
  state,
  mapData,
  objectSprites,
  playerSprites,
  MAP_SCALE,
  PLAYER_SCALE,
  FRAME_WIDTH,
  FRAME_HEIGHT,
  activePlayer,
) {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  RenderManager.drawMap(
    ctx,
    mapImageLoaded,
    mapImage,
    state,
    canvas,
    MAP_SCALE,
  );

  RenderManager.drawObjects(ctx, mapData, objectSprites, state, MAP_SCALE);

  RenderManager.drawCompanions(
    ctx,
    activePlayer,
    state,
    playerSprites,
    MAP_SCALE,
    PLAYER_SCALE,
    FRAME_WIDTH,
    FRAME_HEIGHT,
  );

  RenderManager.drawPlayer(
    ctx,
    activePlayer,
    state,
    playerSprites,
    MAP_SCALE,
    PLAYER_SCALE,
    FRAME_WIDTH,
    FRAME_HEIGHT,
  );
}

// -------------------------------------------------------
// Manager
// -------------------------------------------------------
window.RenderManager = {
  drawFallbackPlayer,
  getFrameForCharacter,
  getPlayerFrame,
  drawPlayer,
  drawCompanions,
  drawMap,
  drawObjects,
  render,
};
