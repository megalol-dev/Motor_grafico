// =======================================================
// EVENTS MANAGER
// =======================================================
// Gestiona toda la entrada del usuario:
//
// - Eventos del ratón sobre el canvas.
// - Botones de verbos.
// - Botones de personajes.
// - Hover sobre objetos y hotspots.
// - Gestión de clics sobre objetos, hotspots y suelo.
// - Preparación de interacciones.
//
// Este módulo actúa como intermediario entre la interfaz
// del jugador y el resto del motor del juego, delegando
// la lógica específica en los managers correspondientes.
// =======================================================

// -------------------------------------------------------
// EVENTOS DE LOS BOTONES DE PERSONAJES
// -------------------------------------------------------
function bindCharacterButtons(
  state,
  getMapData,
  actionLine,
  getActiveCharacter,
  changeMap,
) {
  const playerButtons = document.querySelectorAll(".player-btn");

  playerButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const selected = button.dataset.character;

      if (!selected) return;

      const mapData = getMapData();

      if (!mapData) return;

      // cancelar movimiento anterior
      state.target.active = false;
      state.pendingInteraction = null;

      // parar todos los personajes
      state.player.moving = false;

      state.companions.forEach((companion) => {
        companion.moving = false;
      });

      state.activeCharacter = selected;

      const player = getActiveCharacter();

      changeMap(
        player.currentMap,
        Math.floor(player.x / mapData.tileWidth),
        Math.floor(player.y / mapData.tileHeight) - 1,
        player.direction,
      );

      state.target.active = false;

      InventoryManager.refreshInventoryUI(state, actionLine);
    });
  });
}

// -------------------------------------------------------
// EVENTOS DE LOS BOTONES DE VERBOS
// -------------------------------------------------------
function bindVerbButtons(verbButtons, state, actionLine) {
  verbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const verb = window.VerbLibrary.find((v) => v.id === button.dataset.verb);

      if (!verb) {
        return;
      }

      state.currentVerb = verb.id;

      if (state.currentVerb !== "use") {
        state.selectedInventoryItem = null;

        InventoryManager.refreshInventoryUI(state, actionLine);
      }

      if (actionLine) {
        actionLine.textContent = `${verb.label} ...`;
      }
    });
  });
}

// -------------------------------------------------------
// EVENTOS DE HOVER SOBRE EL CANVAS
// -------------------------------------------------------
function bindCanvasHover(
  canvas,
  state,
  actionLine,
  getMapData,
  getWorldPointFromClick,
  getVerbLabel,
) {
  canvas.addEventListener("mousemove", (event) => {
    const isGameVisible = document
      .getElementById("game-screen")
      ?.classList.contains("active");

    const mapData = getMapData();

    if (!isGameVisible || !mapData) {
      return;
    }

    const worldPoint = getWorldPointFromClick(event);

    if (!worldPoint) {
      return;
    }

    const hoveredObject = InteractionManager.getObjectAt(
      worldPoint.x,
      worldPoint.y,
      mapData,
    );

    const hoveredHotspot = InteractionManager.getHotspotAt(
      worldPoint.x,
      worldPoint.y,
      mapData,
    );

    // ---------------------------------------------------
    // OBJETO BAJO EL RATÓN
    // ---------------------------------------------------
    if (hoveredObject) {
      if (actionLine) {
        if (
          state.currentVerb.toLowerCase() === "use" &&
          state.selectedInventoryItem
        ) {
          actionLine.textContent = `Use ${state.selectedInventoryItem.name} with ${hoveredObject.name}`;
        } else {
          actionLine.textContent = `${state.currentVerb} ${hoveredObject.name}`;
        }
      }

      return;
    }

    // ---------------------------------------------------
    // HOTSPOT BAJO EL RATÓN
    // ---------------------------------------------------
    if (hoveredHotspot) {
      const hotspotItem =
        InteractionManager.getHotspotLibraryItem(hoveredHotspot);

      if (hotspotItem && actionLine) {
        if (
          state.currentVerb.toLowerCase() === "use" &&
          state.selectedInventoryItem
        ) {
          actionLine.textContent = `Use ${state.selectedInventoryItem.name} with ${hotspotItem.name}`;
        } else {
          actionLine.textContent = `${state.currentVerb} ${hotspotItem.name}`;
        }
      }

      return;
    }

    // ---------------------------------------------------
    // NO HAY ELEMENTO INTERACTIVO
    // ---------------------------------------------------
    if (actionLine) {
      if (
        state.currentVerb.toLowerCase() === "use" &&
        state.selectedInventoryItem
      ) {
        actionLine.textContent = `Use ${state.selectedInventoryItem.name} with...`;
      } else {
        actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
      }
    }
  });
}

// -------------------------------------------------------
// CANCELA UN MENSAJE TEMPORAL SI EXISTE <refactor>
// -------------------------------------------------------
function clearTemporaryMessage(state, actionLine, getVerbLabel) {
  if (state.messageTimeout) {
    clearTimeout(state.messageTimeout);
    state.messageTimeout = null;

    if (actionLine) {
      actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
    }
  }
}

// -------------------------------------------------------
// GESTIONA EL VERBO WHAT IS SOBRE OBJETOS <refactor>
// -------------------------------------------------------
function handleObjectWhatIs(obj, state, actionLine) {
  InteractionManager.showTemporaryMessage(
    obj.description,
    state,
    actionLine,
    2000,
  );
}

// -------------------------------------------------------
// PREPARA LA INTERACCIÓN CON UN OBJETO <refactor>
// -------------------------------------------------------
function prepareObjectInteraction(
  clickedObject,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
) {
  const mapData = getMapData();

  if (!mapData) {
    return false;
  }

  const interactionTile = PathfindingManager.findInteractionTileForObject(
    clickedObject,
    mapData,
  );

  if (!interactionTile) {
    InteractionManager.showTemporaryMessage(
      `No puedo llegar a ${clickedObject.name}`,
      state,
      actionLine,
      2000,
    );

    return false;
  }

  if (
    !PathfindingManager.createPathToTile(
      interactionTile.col,
      interactionTile.row,
      getActiveCharacter(),
      state,
      mapData,
      FOOT_OFFSET_Y,
    )
  ) {
    InteractionManager.showTemporaryMessage(
      "No encuentro un camino.",
      state,
      actionLine,
      2000,
    );

    return false;
  }

  state.pendingInteraction = clickedObject;

  return true;
}

// -------------------------------------------------------
// GESTIONA LOS VERBOS GENÉRICOS SOBRE OBJETOS <refactor>
// -------------------------------------------------------
function handleDefaultObjectVerb(
  clickedObject,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
) {
  prepareObjectInteraction(
    clickedObject,
    state,
    actionLine,
    getMapData,
    getActiveCharacter,
    FOOT_OFFSET_Y,
  );
}

// -------------------------------------------------------
// GESTIONA EL CLICK SOBRE UN OBJETO <refactor>
// -------------------------------------------------------
function handleClickedObject(
  clickedObject,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
) {
  const verb = state.currentVerb.toLowerCase();

  // ---------------------------------------------------
  // WHAT IS
  // ---------------------------------------------------
  if (verb === "what is") {
    handleObjectWhatIs(clickedObject, state, actionLine);

    return;
  }

  // ---------------------------------------------------
  // PICK UP
  // ---------------------------------------------------
  if (verb === "pick up") {
    if (
      !prepareObjectInteraction(
        clickedObject,
        state,
        actionLine,
        getMapData,
        getActiveCharacter,
        FOOT_OFFSET_Y,
      )
    ) {
      return;
    }

    const player = getActiveCharacter();

    const dx = state.target.x - player.x;
    const dy = state.target.y - player.y;

    MovementManager.updateDirectionFromVector(dx, dy, player);

    return;
  }

  // ---------------------------------------------------
  // USE
  // ---------------------------------------------------
  if (verb === "use") {
    if (
      !prepareObjectInteraction(
        clickedObject,
        state,
        actionLine,
        getMapData,
        getActiveCharacter,
        FOOT_OFFSET_Y,
      )
    ) {
      return;
    }

    const player = getActiveCharacter();

    const dx = state.target.x - player.x;
    const dy = state.target.y - player.y;

    MovementManager.updateDirectionFromVector(dx, dy, player);

    return;
  }

  // ---------------------------------------------------
  // WALK TO
  // ---------------------------------------------------
  if (verb === "walk to") {
    prepareObjectInteraction(
      clickedObject,
      state,
      actionLine,
      getMapData,
      getActiveCharacter,
      FOOT_OFFSET_Y,
    );

    return;
  }

  // ---------------------------------------------------
  // RESTO DE VERBOS
  // ---------------------------------------------------
  handleDefaultObjectVerb(
    clickedObject,
    state,
    actionLine,
    getMapData,
    getActiveCharacter,
    FOOT_OFFSET_Y,
  );
}

// -------------------------------------------------------
// GESTIONA EL CLICK SOBRE UN HOTSPOT <refactor>
// -------------------------------------------------------
function handleClickedHotspot(
  clickedHotspot,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
) {
  const verb = state.currentVerb.toLowerCase();
  const mapData = getMapData();

  // ---------------------------------------------------
  // WHAT IS -> NO CAMINAR
  // ---------------------------------------------------
  if (verb === "what is") {
    InteractionManager.handleHotspotInteraction(
      clickedHotspot,
      state,
      actionLine,
    );

    return;
  }

  const targetTile = PathfindingManager.findInteractionTileForHotspot(
    clickedHotspot,
    mapData,
  );

  if (!targetTile) {
    InteractionManager.showTemporaryMessage(
      "No puedo llegar ahí.",
      state,
      actionLine,
      2000,
    );

    return;
  }

  if (
    !PathfindingManager.createPathToTile(
      targetTile.col,
      targetTile.row,
      getActiveCharacter(),
      state,
      mapData,
      FOOT_OFFSET_Y,
    )
  ) {
    InteractionManager.showTemporaryMessage(
      "No encuentro un camino.",
      state,
      actionLine,
      2000,
    );

    return;
  }

  state.pendingHotspot = clickedHotspot;
}

// -------------------------------------------------------
// GESTIONA EL CLICK SOBRE EL SUELO <refactor>
// -------------------------------------------------------
function handleGroundClick(
  worldPoint,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
  getVerbLabel,
) {
  const mapData = getMapData();

  const clickedCol = Math.floor(worldPoint.x / mapData.tileWidth);

  const clickedRow = Math.floor(
    (worldPoint.y - FOOT_OFFSET_Y) / mapData.tileHeight,
  );

  const targetTile = WorldManager.findNearestWalkableTile(
    clickedCol,
    clickedRow,
    mapData,
    6,
  );

  if (!targetTile) {
    state.target.active = false;
    state.path = [];
    state.pathIndex = 0;

    return;
  }

  if (
    !PathfindingManager.createPathToTile(
      targetTile.col,
      targetTile.row,
      getActiveCharacter(),
      state,
      mapData,
      FOOT_OFFSET_Y,
    )
  ) {
    InteractionManager.showTemporaryMessage(
      "No encuentro un camino.",
      state,
      actionLine,
      2000,
    );

    return;
  }

  state.pendingInteraction = null;
  state.pendingHotspot = null;

  // Si estamos usando un objeto del inventario,
  // no cancelar el modo USE.
  if (
    state.currentVerb.toLowerCase() !== "use" ||
    !state.selectedInventoryItem
  ) {
    state.currentVerb = "Walk to";

    if (actionLine) {
      actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
    }
  }
}

// -------------------------------------------------------
// EVENTOS DEL JUEGO
// -------------------------------------------------------
function bindGameEvents(
  canvas,
  state,
  actionLine,
  verbButtons,
  getMapData,
  getWorldPointFromClick,
  getVerbLabel,
  getActiveCharacter,
  changeMap,
  FOOT_OFFSET_Y,
) {
  // CLICK EN EL CANVAS
  canvas.addEventListener("click", (event) => {
    // evitar clicks de UI
    if (event.target.closest(".player-btn")) {
      return;
    }

    clearTemporaryMessage(state, actionLine, getVerbLabel);

    const mapData = getMapData();

    const isGameVisible = document
      .getElementById("game-screen")
      ?.classList.contains("active");

    if (!isGameVisible || !mapData) {
      return;
    }

    clearTemporaryMessage(state, actionLine, getVerbLabel);

    const worldPoint = getWorldPointFromClick(event);

    if (!worldPoint) {
      return;
    }

    const clickedObject = InteractionManager.getObjectAt(
      worldPoint.x,
      worldPoint.y,
      mapData,
    );

    const clickedHotspot = InteractionManager.getHotspotAt(
      worldPoint.x,
      worldPoint.y,
      mapData,
    );

    if (clickedObject) {
      handleClickedObject(
        clickedObject,
        state,
        actionLine,
        getMapData,
        getActiveCharacter,
        FOOT_OFFSET_Y,
      );

      return;
    }

    if (clickedHotspot) {
      handleClickedHotspot(
        clickedHotspot,
        state,
        actionLine,
        getMapData,
        getActiveCharacter,
        FOOT_OFFSET_Y,
      );

      return;
    }

    handleGroundClick(
      worldPoint,
      state,
      actionLine,
      getMapData,
      getActiveCharacter,
      FOOT_OFFSET_Y,
      getVerbLabel,
    );
  });

  bindCanvasHover(
    canvas,
    state,
    actionLine,
    getMapData,
    getWorldPointFromClick,
    getVerbLabel,
  );

  bindVerbButtons(verbButtons, state, actionLine);

  bindCharacterButtons(
    state,
    getMapData,
    actionLine,
    getActiveCharacter,
    changeMap,
  );
}

// ---------------------------------------------------
// Manager
// ---------------------------------------------------
window.EventsManager = {
  bindCharacterButtons,
  bindVerbButtons,
  bindCanvasHover,
  clearTemporaryMessage,
  handleObjectWhatIs,
  prepareObjectInteraction,
  handleDefaultObjectVerb,
  handleClickedObject,
  handleClickedHotspot,
  handleGroundClick,
  bindGameEvents,
};
