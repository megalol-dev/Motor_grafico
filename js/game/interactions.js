// -------------------------------------------------------
// MANAGER DE INTERACCIONES DEL JUEGO
// Centraliza toda la lógica relacionada con objetos,
// hotspots, mensajes temporales, teletransportes e
// interacciones mediante verbos.
// -------------------------------------------------------

// -------------------------------------------------------
// DEVUELVE EL OBJETO SOBRE EL QUE SE HA HECHO CLICK <refactor>
// -------------------------------------------------------
function getObjectAt(worldX, worldY, mapData) {
  if (!mapData?.objects) return null;

  for (let i = mapData.objects.length - 1; i >= 0; i--) {
    const obj = mapData.objects[i];

    if (!obj.visible) continue;
    if (obj.collected) continue;

    let inside = false;

    // -----------------------------------------
    // PUERTA ABIERTA -> usar PORTAL
    // -----------------------------------------
    if (obj.type === "door" && obj.opened && obj.portal) {
      inside =
        worldX >= obj.portal.x &&
        worldX <= obj.portal.x + obj.portal.width &&
        worldY >= obj.portal.y &&
        worldY <= obj.portal.y + obj.portal.height;
    }

    // -----------------------------------------
    // RESTO -> usar HITBOX
    // -----------------------------------------
    else {
      inside =
        worldX >= obj.x &&
        worldX <= obj.x + obj.hitboxWidth &&
        worldY >= obj.y &&
        worldY <= obj.y + obj.hitboxHeight;
    }

    if (inside) {
      return obj;
    }
  }

  return null;
}

// -------------------------------------------------------
// DEVUELVE EL HOTSPOT SITUADO EN UNA POSICIÓN DEL MAPA <refactor>
// -------------------------------------------------------
function getHotspotAt(worldX, worldY, mapData) {
  if (!mapData?.hotspots) {
    return null;
  }

  // Recorremos desde el último para respetar el orden
  // cuando existan varios hotspots superpuestos.
  for (let i = mapData.hotspots.length - 1; i >= 0; i -= 1) {
    const hotspot = mapData.hotspots[i];

    const inside =
      worldX >= hotspot.x &&
      worldX <= hotspot.x + hotspot.width &&
      worldY >= hotspot.y &&
      worldY <= hotspot.y + hotspot.height;

    if (inside) {
      return hotspot;
    }
  }

  return null;
}

// -------------------------------------------------------
// DEVUELVE EL PORTAL QUE ESTÁ PISANDO EL PERSONAJE <refactor>
// -------------------------------------------------------
function getTeleportUnderPlayer(player, mapData, FOOT_OFFSET_Y) {
  if (!mapData?.objects) {
    return null;
  }

  // pies del personaje
  const footX = player.x;
  const footY = player.y - FOOT_OFFSET_Y;

  for (const obj of mapData.objects) {
    // no es un portal
    if (!obj.teleportTo) {
      continue;
    }

    // puerta cerrada
    if (!obj.opened) {
      continue;
    }

    // -------------------------------------------------
    // NUEVO SISTEMA
    // Zona Portal dibujada desde el editor
    // -------------------------------------------------
    if (obj.portal) {
      const insidePortal =
        footX >= obj.portal.x &&
        footX <= obj.portal.x + obj.portal.width &&
        footY >= obj.portal.y &&
        footY <= obj.portal.y + obj.portal.height;

      if (insidePortal) {
        return obj;
      }

      continue;
    }

    // -------------------------------------------------
    // Compatibilidad con mapas antiguos
    // -------------------------------------------------
    const insideHitbox =
      footX >= obj.x &&
      footX <= obj.x + obj.hitboxWidth &&
      footY >= obj.y &&
      footY <= obj.y + obj.hitboxHeight;

    if (insideHitbox) {
      return obj;
    }
  }

  return null;
}

// -------------------------------------------------------
// DEVUELVE LOS DATOS DEL CATÁLOGO DE UN HOTSPOT <refactor>
// -------------------------------------------------------
function getHotspotLibraryItem(hotspot) {
  if (!hotspot?.typeId || !window.HotspotLibrary) {
    return null;
  }

  return (
    window.HotspotLibrary.find((item) => item.id === hotspot.typeId) ?? null
  );
}

// -------------------------------------------------------
// MUESTRA UN MENSAJE TEMPORAL EN LA ACTION LINE <refactor>
// -------------------------------------------------------
function showTemporaryMessage(text, state, actionLine, duration = 2000) {
  // limpiar timeout anterior
  if (state.messageTimeout) {
    clearTimeout(state.messageTimeout);
  }

  if (actionLine) {
    actionLine.textContent = text;
  }

  state.messageTimeout = setTimeout(() => {
    if (actionLine) {
      actionLine.textContent = `${state.currentVerb} ...`;
    }

    state.messageTimeout = null;
  }, duration);
}

// -------------------------------------------------------
// INTERACCIÓN CON HOTSPOTS
// -------------------------------------------------------
function handleHotspotInteraction(hotspot, state, actionLine) {
  const hotspotItem = InteractionManager.getHotspotLibraryItem(hotspot);

  if (!hotspotItem) return;

  const verb = state.currentVerb.toLowerCase();

  // ---------------------------------------------------
  // WHAT IS
  // ---------------------------------------------------
  if (verb === "what is") {
    InteractionManager.showTemporaryMessage(
      hotspotItem.description,
      state,
      actionLine,
      2000,
    );

    return;
  }

  // ---------------------------------------------------
  // RESTO DE VERBOS
  // ---------------------------------------------------
  if (actionLine) {
    actionLine.textContent = `${state.currentVerb} ${hotspotItem.name}`;
  }
}

// -------------------------------------------------------
// INTERACCIÓN CON OBJETOS / VERBOS
// -------------------------------------------------------
function handleObjectInteraction(
  obj,
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
) {
  const verb = state.currentVerb.toLowerCase();

  // ---------------------------------------------------
  // WHAT IS
  // ---------------------------------------------------
  if (verb === "what is") {
    InteractionManager.showTemporaryMessage(
      obj.description,
      state,
      actionLine,
      2000,
    );

    return;
  }

  // ---------------------------------------------------
  // PICK UP
  // ---------------------------------------------------
  if (verb === "pick up") {
    return InventoryManager.handlePickUp(
      obj,
      state,
      actionLine,
      currentMapName,
    );
  }

  // ---------------------------------------------------
  // USE
  // ---------------------------------------------------
  if (verb === "use") {
    // ¿Se ha seleccionado un objeto del inventario?
    if (!state.selectedInventoryItem) {
      if (actionLine) {
        actionLine.textContent = "¿Usar qué?";
      }

      return;
    }

    // -------------------------------------------------
    // ¿Este objeto necesita una llave?
    // -------------------------------------------------
    if (
      obj.requiredItem &&
      state.selectedInventoryItem.typeId === obj.requiredItem
    ) {
      // Abrir y desbloquear toda la pareja de puertas
      DoorManager.setDoorState(obj.doorPair, true, false, mapData?.objects);

      // Guardar el nuevo estado de esta puerta
      DoorManager.persistObjectState(obj, currentMapName);

      // Dejar de usar la llave
      state.selectedInventoryItem = null;

      InventoryManager.refreshInventoryUI(state, actionLine);

      // Volver al verbo por defecto
      state.currentVerb = "Walk to";

      if (actionLine) {
        actionLine.textContent = `${obj.name} se ha abierto.`;
      }

      RenderManager.render(
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
        state.companions.find((c) => c.id === state.activeCharacter) ??
          state.player,
      );

      return;
    }

    // -------------------------------------------------
    // Objeto incorrecto
    // -------------------------------------------------
    if (actionLine) {
      actionLine.textContent = `No puedo usar ${state.selectedInventoryItem.name} con ${obj.name}.`;
    }

    return;
  }

  // ---------------------------------------------------
  // OPEN
  // ---------------------------------------------------
  if (verb === "open") {
    if (obj.type !== "door") {
      actionLine.textContent = `No puedo abrir ${obj.name}.`;
      return;
    }

    if (obj.opened) {
      actionLine.textContent = `${obj.name} ya está abierta.`;
      return;
    }

    // Solo la puerta con llave
    if (obj.requiredItem) {
      actionLine.textContent = "Parece que está cerrada con llave.";
      return;
    }

    // Puertas normales
    DoorManager.setDoorState(obj.doorPair, true, false, mapData?.objects);

    RenderManager.render(
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
      state.companions.find((c) => c.id === state.activeCharacter) ??
        state.player,
    );

    actionLine.textContent = `${obj.name} se ha abierto.`;

    return;
  }

  // ---------------------------------------------------
  // RESTO DE VERBOS
  // ---------------------------------------------------
  if (actionLine) {
    actionLine.textContent = `${getVerbLabel(state.currentVerb)} ${obj.name}`;
  }
}

// -------------------------------------------------------
// Manager
// -------------------------------------------------------
window.InteractionManager = {
  getHotspotLibraryItem,
  showTemporaryMessage,
  handleHotspotInteraction,
  handleObjectInteraction,
  getObjectAt,
  getHotspotAt,
  getTeleportUnderPlayer,
};
