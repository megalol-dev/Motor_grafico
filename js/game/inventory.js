// =======================================================
// GESTOR DEL INVENTARIO
// =======================================================
//
// Este módulo centraliza toda la lógica relacionada con:
//
// - Actualización visual del inventario.
// - Recogida de objetos.
// - Gestión de los objetos del inventario.
//
// El motor principal (game.js) únicamente llama a este
// gestor y le proporciona la información necesaria.
// Este módulo no accede directamente a variables del
// motor; recibe todos los datos mediante parámetros.
//
// =======================================================

// -------------------------------------------------------
// ACTUALIZA VISUALMENTE EL INVENTARIO HTML <refactor>
// -------------------------------------------------------
function refreshInventoryUI(state, actionLine) {
  const slots = document.querySelectorAll(".inventory-slot");

  // ---------------------------------------------------
  // LIMPIAR SLOTS
  // ---------------------------------------------------
  slots.forEach((slot) => {
    slot.innerHTML = "";
  });

  // ---------------------------------------------------
  // INVENTARIO DEL PERSONAJE ACTIVO
  // ---------------------------------------------------
  const inventory = state.inventory[state.activeCharacter];

  inventory.forEach((obj, index) => {
    const img = document.createElement("img");

    img.src = `./img/objects/${obj.sprite}`;

    img.classList.add("inventory-item");

    // ---------------------------------------------------
    // RESALTAR OBJETO SELECCIONADO
    // ---------------------------------------------------
    if (state.selectedInventoryItem === obj) {
      img.style.outline = "3px solid yellow";
    }

    // ---------------------------------------------------
    // CLICK SOBRE OBJETO DEL INVENTARIO
    // ---------------------------------------------------
    img.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Solo funciona con el verbo USE
      if (state.currentVerb.toLowerCase() !== "use") {
        return;
      }

      state.selectedInventoryItem = obj;

      // Redibujar inventario para mostrar el borde amarillo
      InventoryManager.refreshInventoryUI(state, actionLine);

      if (actionLine) {
        actionLine.textContent = `Use ${obj.name} with...`;
      }
    });

    slots[index].appendChild(img);
  });
}

// ---------------------------------------------------
// PICK UP - Nueva función recoger
// ---------------------------------------------------
function handlePickUp(obj, state, actionLine, currentMapName) {
  // El objeto no puede recogerse
  if (!obj.pickup) {
    if (actionLine) {
      actionLine.textContent = `No puedo coger ${obj.name}.`;
    }

    return;
  }

  // Ya estaba recogido
  if (obj.collected) {
    if (actionLine) {
      actionLine.textContent = `${obj.name} ya no está aquí.`;
    }

    return;
  }

  // Recoger objeto
  obj.collected = true;
  obj.visible = false;

  // Guardar automáticamente todos sus cambios
  DoorManager.persistObjectState(obj, currentMapName);

  const libraryItem = window.ObjectLibrary.find(
    (item) => item.id === obj.typeId,
  );

  state.inventory[state.activeCharacter].push({
    id: obj.id,
    typeId: libraryItem?.id ?? obj.id,
    name: obj.name,
    sprite: obj.sprite,
    description: obj.description,
  });

  InventoryManager.refreshInventoryUI(state, actionLine);

  InteractionManager.showTemporaryMessage(
    `Has cogido ${obj.name}.`,
    state,
    actionLine,
  );

  EventsManager.selectDefaultVerb(state, actionLine, true);

  return;
}

window.InventoryManager = {
  refreshInventoryUI,
  handlePickUp,
};
