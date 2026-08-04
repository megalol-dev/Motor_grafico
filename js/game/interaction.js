/*
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
// MUESTRA UN MENSAJE TEMPORAL EN LA ACTION LINE
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
// DEVUELVE LOS DATOS DEL CATÁLOGO DE UN HOTSPOT
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
// Manager
// -------------------------------------------------------
window.InteractionManager = {
  handleHotspotInteraction,
  getHotspotLibraryItem,
  showTemporaryMessage,
};
*/