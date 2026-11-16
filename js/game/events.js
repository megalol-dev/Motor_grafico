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

function cancelPendingInteractions(state) {
  state.pendingInteraction = null;
  state.pendingHotspot = null;
  state.pendingNpc = null;
  state.pendingNpcDistance = null;
  state.pendingTeleport = null;
}

function isActiveCharacterUnavailable(state) {
  return (
    window.DeathManager?.isInputBlocked?.() ||
    window.DeathManager?.isSlotDead?.(state?.activeCharacter)
  );
}

// -------------------------------------------------------
// EVENTOS DE LOS BOTONES DE PERSONAJES
// -------------------------------------------------------
// -------------------------------------------------------
// EVENTOS DE LOS BOTONES DE PERSONAJES
// -------------------------------------------------------
function bindCharacterButtons(
  state,
  getCurrentMapName,
  actionLine,
  getActiveCharacter,
  changeMapKeepingPosition,
) {
  const playerButtons = document.querySelectorAll(".player-btn");

  playerButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        window.ChestManager?.isOpen() ||
        window.NpcManager?.isInsecticideEventPending?.() ||
        window.DeathManager?.isInputBlocked?.()
      ) return;

      const selected = button.dataset.character;

      if (!selected) {
        return;
      }

      if (window.DeathManager?.isSlotDead?.(selected)) return;

      // -----------------------------------------
      // Cancelar acciones del personaje anterior
      // -----------------------------------------
      state.target.active = false;
      state.path = [];
      state.pathIndex = 0;
      cancelPendingInteractions(state);
      InventoryManager.clearSelectedInventoryItem(state, actionLine);

      state.player.moving = false;

      state.companions.forEach((companion) => {
        companion.moving = false;
      });

      // -----------------------------------------
      // Cambiar personaje activo
      // -----------------------------------------
      state.activeCharacter = selected;
      state.deathCameraFocus = null;

      const player = getActiveCharacter();

      if (!player) {
        return;
      }

      player.moving = false;

      // -----------------------------------------
      // Si está en otro mapa, cargar SU mapa
      // conservando exactamente X / Y.
      // -----------------------------------------
      if (player.currentMap !== getCurrentMapName()) {
        changeMapKeepingPosition(
          player.currentMap,
          player.x,
          player.y,
          player.direction,
        );
      }

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
      if (
        window.ChestManager?.isOpen() ||
        window.NpcManager?.isInsecticideEventPending?.() ||
        isActiveCharacterUnavailable(state)
      ) return;

      const verb = window.VerbLibrary.find((v) => v.id === button.dataset.verb);

      if (!verb) {
        return;
      }

      const previousVerb = state.currentVerb.toLowerCase();

      // Quitar selección anterior
      verbButtons.forEach((btn) => btn.classList.remove("active-verb"));

      // Activar el nuevo
      button.classList.add("active-verb");

      state.currentVerb = verb.id;

      if (state.currentVerb !== "use") {
        InventoryManager.clearSelectedInventoryItem(state, actionLine);

        if (previousVerb === "use") {
          cancelPendingInteractions(state);
        }
      }

      if (actionLine) {
        actionLine.textContent = window.VerbManager.formatPrompt(verb.id);
      }
    });
  });
}

function selectDefaultVerb(state, actionLine, keepMessage = false) {
  InventoryManager.clearSelectedInventoryItem(state, actionLine);
  state.currentVerb = "Walk to";

  const verbButtons = document.querySelectorAll(".verb-btn");

  verbButtons.forEach((btn) => {
    btn.classList.remove("active-verb");

    if (btn.dataset.verb === "Walk to") {
      btn.classList.add("active-verb");
    }
  });

  if (!keepMessage && actionLine) {
    actionLine.textContent = window.VerbManager.formatPrompt("Walk to");
  }
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
    if (
      window.DialogueManager?.isActive() ||
      window.ChestManager?.isOpen() ||
      window.NpcManager?.isInsecticideEventPending?.() ||
      isActiveCharacterUnavailable(state)
    ) {
      return;
    }

    if (state.messageTimeout) {
      return;
    }

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

    const hoveredNpc = InteractionManager.getNpcAt(
      worldPoint.x,
      worldPoint.y,
      mapData,
    );

    if (hoveredNpc) {
      const libraryItem = NpcManager.getLibraryItem(hoveredNpc);

      if (libraryItem && actionLine) {
        actionLine.textContent = window.VerbManager.formatTarget(
          state.currentVerb,
          libraryItem.name,
        );
      }

      return;
    }

    // ---------------------------------------------------
    // OBJETO BAJO EL RATÓN
    // ---------------------------------------------------
    if (hoveredObject) {
      const hoveredObjectName = InteractionManager.getObjectName(hoveredObject);

      if (actionLine) {
        if (
          state.currentVerb.toLowerCase() === "use" &&
          state.selectedInventoryItem
        ) {
          actionLine.textContent = window.VerbManager.formatUseWith(
            state.selectedInventoryItem.name,
            hoveredObjectName,
          );
        } else {
          actionLine.textContent = window.VerbManager.formatTarget(
            state.currentVerb,
            hoveredObjectName,
          );
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
          actionLine.textContent = window.VerbManager.formatUseWith(
            state.selectedInventoryItem.name,
            hotspotItem.name,
          );
        } else {
          actionLine.textContent = window.VerbManager.formatTarget(
            state.currentVerb,
            hotspotItem.name,
          );
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
        actionLine.textContent = window.VerbManager.formatUseWith(
          state.selectedInventoryItem.name,
        );
      } else {
        actionLine.textContent = window.VerbManager.formatPrompt(
          state.currentVerb,
        );
      }
    }
  });
}

// -------------------------------------------------------
// CANCELA UN MENSAJE TEMPORAL SI EXISTE <refactor>
// -------------------------------------------------------
function clearTemporaryMessage(state, actionLine, getVerbLabel) {
  if (!state.messageTimeout) {
    return;
  }

  state.messageTimeout = null;

  if (actionLine) {
    actionLine.textContent = window.VerbManager.formatPrompt(state.currentVerb);
  }
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
  if (isActiveCharacterUnavailable(state)) return false;

  const mapData = getMapData();

  cancelPendingInteractions(state);

  if (!mapData) {
    return false;
  }

  const interactionTile = PathfindingManager.findInteractionTileForObject(
    clickedObject,
    mapData,
  );

  if (!interactionTile) {
    InteractionManager.showTemporaryMessage(
      `No puedo llegar a ${InteractionManager.getObjectName(clickedObject)}`,
      state,
      actionLine,
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
    );

    return false;
  }

  state.pendingNpc = null;
  state.pendingNpcDistance = null;
  state.pendingHotspot = null;
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
    InteractionManager.showTemporaryMessage(
      InteractionManager.getObjectDescription(clickedObject, state),
      state,
      actionLine,
    );

    EventsManager.selectDefaultVerb(state, actionLine, true);

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
      InventoryManager.clearSelectedInventoryItem(state, actionLine);
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
  if (isActiveCharacterUnavailable(state)) return false;

  const verb = state.currentVerb.toLowerCase();
  const mapData = getMapData();

  cancelPendingInteractions(state);

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
      "No encuentro un camino.",
      state,
      actionLine,
    );

    InventoryManager.clearSelectedInventoryItem(state, actionLine);

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
    );

    InventoryManager.clearSelectedInventoryItem(state, actionLine);

    return;
  }

  state.pendingInteraction = null;
  state.pendingNpc = null;
  state.pendingNpcDistance = null;
  state.pendingHotspot = clickedHotspot;
}

function prepareNpcInteraction(
  clickedNpc,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
) {
  if (isActiveCharacterUnavailable(state)) return false;

  const mapData = getMapData();
  cancelPendingInteractions(state);
  const targetTile = PathfindingManager.findInteractionTileForNpc(
    clickedNpc,
    mapData,
  );

  if (
    !targetTile ||
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
    );
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    return false;
  }

  const player = getActiveCharacter();
  const collision = NpcManager.getCollisionRect(clickedNpc);
  const targetX = collision.x + collision.width / 2;
  const targetY = collision.y + collision.height / 2;

  state.pendingInteraction = null;
  state.pendingHotspot = null;
  state.pendingNpc = clickedNpc;
  state.pendingNpcDistance = Math.hypot(targetX - player.x, targetY - player.y);

  MovementManager.updateDirectionFromVector(
    targetX - player.x,
    targetY - player.y,
    player,
  );

  return true;
}

function handleClickedNpc(
  clickedNpc,
  state,
  actionLine,
  getMapData,
  getActiveCharacter,
  FOOT_OFFSET_Y,
) {
  prepareNpcInteraction(
    clickedNpc,
    state,
    actionLine,
    getMapData,
    getActiveCharacter,
    FOOT_OFFSET_Y,
  );
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
  if (isActiveCharacterUnavailable(state)) return false;

  state.deathCameraFocus = null;
  const wasUsingSelectedItem =
    state.currentVerb.toLowerCase() === "use" && state.selectedInventoryItem;

  cancelPendingInteractions(state);
  InventoryManager.clearSelectedInventoryItem(state, actionLine);

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
    );

    return;
  }

  // Un clic de suelo cancela el objeto seleccionado, pero conserva el verbo
  // USE tal como hacía el flujo anterior mientras existía una selección.
  if (!wasUsingSelectedItem) {
    EventsManager.selectDefaultVerb(state, actionLine);
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
  getCurrentMapName,
  getWorldPointFromClick,
  getVerbLabel,
  getActiveCharacter,
  changeMap,
  changeMapKeepingPosition,
  FOOT_OFFSET_Y,
)  {
  // CLICK EN EL CANVAS
  canvas.addEventListener("click", (event) => {
    if (
      window.DialogueManager?.isActive() ||
      window.ChestManager?.isOpen() ||
      window.NpcManager?.isInsecticideEventPending?.() ||
      isActiveCharacterUnavailable(state)
    ) {
      return;
    }

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

    const worldPoint = getWorldPointFromClick(event);

    if (!worldPoint) {
      cancelPendingInteractions(state);
      InventoryManager.clearSelectedInventoryItem(state, actionLine);
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

    const clickedNpc = InteractionManager.getNpcAt(
      worldPoint.x,
      worldPoint.y,
      mapData,
    );

    const clickedTarget = clickedNpc ?? clickedObject ?? clickedHotspot;
    if (
      clickedTarget &&
      InteractionManager.blockInteractionInDarkness(
        clickedTarget,
        state,
        actionLine,
        getCurrentMapName(),
        mapData,
      )
    ) {
      return;
    }

    if (clickedNpc) {
      handleClickedNpc(
        clickedNpc,
        state,
        actionLine,
        getMapData,
        getActiveCharacter,
        FOOT_OFFSET_Y,
      );
      return;
    }

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
    getCurrentMapName,
    actionLine,
    getActiveCharacter,
    changeMapKeepingPosition,
  );
}

// -------------------------------------------------------
// MANAGER
// -------------------------------------------------------
window.EventsManager = {
  bindCharacterButtons,
  bindVerbButtons,
  cancelPendingInteractions,
  isActiveCharacterUnavailable,
  bindCanvasHover,
  clearTemporaryMessage,
  prepareObjectInteraction,
  handleDefaultObjectVerb,
  handleClickedObject,
  handleClickedHotspot,
  prepareNpcInteraction,
  handleClickedNpc,
  handleGroundClick,
  bindGameEvents,
  selectDefaultVerb,
};
