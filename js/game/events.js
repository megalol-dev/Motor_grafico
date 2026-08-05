// -------------------------------------------------------
// EVENTOS DE LOS BOTONES DE PERSONAJES
// -------------------------------------------------------
function bindCharacterButtons() {
  const playerButtons = document.querySelectorAll(".player-btn");

  playerButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const selected = button.dataset.character;

      if (!selected) return;

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
function bindVerbButtons() {
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
function bindCanvasHover() {
  canvas.addEventListener("mousemove", (event) => {
    const isGameVisible = document
      .getElementById("game-screen")
      ?.classList.contains("active");

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


// ---------------------------------------------------
// Manager
// ---------------------------------------------------
window.EventsManager = {
  bindCharacterButtons,
  bindVerbButtons,
  bindCanvasHover,
  bindGameEvents,
};
