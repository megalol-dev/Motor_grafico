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

const MAX_INVENTORY_ITEMS = 16;

function createEmptyInventory() {
  return Array(MAX_INVENTORY_ITEMS).fill(null);
}

function normalizeInventorySlots(inventory) {
  if (!Array.isArray(inventory)) return null;

  if (inventory.length > MAX_INVENTORY_ITEMS) {
    inventory.length = MAX_INVENTORY_ITEMS;
  }

  for (let index = 0; index < MAX_INVENTORY_ITEMS; index += 1) {
    if (!inventory[index]) inventory[index] = null;
  }

  return inventory;
}

function getCharacterInventory(state, characterSlot) {
  const inventory = state?.inventory?.[characterSlot];
  return normalizeInventorySlots(inventory);
}

function getActiveInventory(state) {
  return getCharacterInventory(state, state.activeCharacter);
}

function getInventoryItemCount(inventory) {
  return Array.isArray(inventory)
    ? inventory.reduce((count, item) => count + (item ? 1 : 0), 0)
    : 0;
}

function findFirstFreeInventorySlot(inventory) {
  if (!normalizeInventorySlots(inventory)) return -1;

  for (let index = 0; index < MAX_INVENTORY_ITEMS; index += 1) {
    if (!inventory[index]) return index;
  }

  return -1;
}

function addInventoryItem(state, characterSlot, item) {
  const inventory = getCharacterInventory(state, characterSlot);
  if (!canAddItemToInventory(state, characterSlot, item)) return false;

  const freeSlot = findFirstFreeInventorySlot(inventory);
  if (freeSlot < 0) return false;

  inventory[freeSlot] = item;
  return true;
}

function getInventoryCharacter(state, characterSlot) {
  if (state.player?.id === characterSlot) return state.player;

  return (
    state.companions?.find((character) => character.id === characterSlot) ??
    null
  );
}

function canItemLeaveInventory(item) {
  return Boolean(item) && !item.boundToCharacter;
}

function canCharacterReceiveItem(state, characterSlot, item) {
  if (!item?.boundToCharacter) return true;

  const character = getInventoryCharacter(state, characterSlot);
  return character?.sprite?.toLowerCase() === item.boundToCharacter.toLowerCase();
}

function getItemInstanceIdentity(item) {
  if (item?.worldInstanceId) return `world:${item.worldInstanceId}`;
  if (item?.generatedInstanceId) return `generated:${item.generatedInstanceId}`;
  return null;
}

function isSameItemInstance(firstItem, secondItem) {
  if (!firstItem || !secondItem) return false;
  if (firstItem === secondItem) return true;

  const firstIdentity = getItemInstanceIdentity(firstItem);
  const secondIdentity = getItemInstanceIdentity(secondItem);
  return Boolean(firstIdentity && firstIdentity === secondIdentity);
}

function canAddItemToInventory(
  state,
  characterSlot,
  item,
  replacingItem = null,
) {
  const inventory = getCharacterInventory(state, characterSlot);
  if (!Array.isArray(inventory) || !item) return false;
  if (!canCharacterReceiveItem(state, characterSlot, item)) return false;

  const replacingIndex = replacingItem ? inventory.indexOf(replacingItem) : -1;
  const duplicate = inventory.some(
    (inventoryItem, index) =>
      index !== replacingIndex &&
      isSameItemInstance(inventoryItem, item),
  );

  if (duplicate) return false;

  return (
    replacingIndex >= 0 ||
    getInventoryItemCount(inventory) < MAX_INVENTORY_ITEMS
  );
}

function removeInventoryItem(
  state,
  characterSlot,
  item,
  actionLine,
) {
  const inventory = getCharacterInventory(state, characterSlot);
  const itemIndex = inventory?.indexOf(item) ?? -1;

  if (itemIndex < 0) return false;
  if (!canItemLeaveInventory(item)) return false;

  inventory[itemIndex] = null;
  if (state.selectedInventoryItem === item) {
    state.selectedInventoryItem = null;
  }

  if (characterSlot === state.activeCharacter) {
    InventoryManager.refreshInventoryUI(state, actionLine);
  }

  return true;
}

function replaceInventoryItem(
  state,
  characterSlot,
  itemToReplace,
  replacementItem,
  actionLine,
) {
  const inventory = getCharacterInventory(state, characterSlot);
  const itemIndex = inventory?.indexOf(itemToReplace) ?? -1;

  if (itemIndex < 0 || !canItemLeaveInventory(itemToReplace)) return false;
  if (
    !canAddItemToInventory(
      state,
      characterSlot,
      replacementItem,
      itemToReplace,
    )
  ) {
    return false;
  }

  inventory[itemIndex] = replacementItem;
  if (state.selectedInventoryItem === itemToReplace) {
    state.selectedInventoryItem = null;
  }

  if (characterSlot === state.activeCharacter) {
    InventoryManager.refreshInventoryUI(state, actionLine);
  }

  return true;
}

// -------------------------------------------------------
// DESELECCIONA EL OBJETO EN USO SIN QUITARLO DEL INVENTARIO
// -------------------------------------------------------
function clearSelectedInventoryItem(state, actionLine) {
  if (!state.selectedInventoryItem) {
    return false;
  }

  state.selectedInventoryItem = null;
  InventoryManager.refreshInventoryUI(state, actionLine);

  return true;
}

function consumeSelectedInventoryItem(state, actionLine) {
  const selectedItem = state.selectedInventoryItem;

  if (!selectedItem) {
    return false;
  }

  return removeInventoryItem(
    state,
    state.activeCharacter,
    selectedItem,
    actionLine,
  );
}

function createInventoryItemElement(obj) {
  if (!obj.inventoryFrame) {
    const img = document.createElement("img");
    img.src = `./img/${obj.spriteFolder ?? "objects"}/${obj.sprite}`;
    return img;
  }

  const canvas = document.createElement("canvas");
  const frame = obj.inventoryFrame;
  canvas.width = frame.width;
  canvas.height = frame.height;
  canvas.classList.add("inventory-frame");

  const context = canvas.getContext?.("2d");
  if (context && typeof Image !== "undefined") {
    context.imageSmoothingEnabled = false;
    const sprite = new Image();
    sprite.addEventListener("load", () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        sprite,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    });
    sprite.src = `./img/${obj.spriteFolder ?? "objects"}/${obj.sprite}`;
  }

  return canvas;
}

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
  const inventory = getActiveInventory(state);

  inventory.forEach((obj, index) => {
    if (!obj || !slots[index]) return;

    const itemElement = createInventoryItemElement(obj);

    itemElement.classList.add("inventory-item");

    // ---------------------------------------------------
    // RESALTAR OBJETO SELECCIONADO
    // ---------------------------------------------------
    if (state.selectedInventoryItem === obj) {
      itemElement.style.outline = "3px solid yellow";
    }

    // ---------------------------------------------------
    // CLICK SOBRE OBJETO DEL INVENTARIO
    // ---------------------------------------------------
    itemElement.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (window.NpcManager?.isInsecticideEventPending?.()) return;

      if (window.ChestManager?.isOpen()) {
        window.ChestManager.handleInventoryItemClick(obj, state, actionLine);
        return;
      }

      // Solo funciona con el verbo USE
      if (state.currentVerb.toLowerCase() !== "use") {
        return;
      }

      state.selectedInventoryItem = obj;

      // Redibujar inventario para mostrar el borde amarillo
      InventoryManager.refreshInventoryUI(state, actionLine);

      if (actionLine) {
        actionLine.textContent = window.VerbManager.formatUseWith(obj.name);
      }
    });

    slots[index].appendChild(itemElement);
  });
}

// ---------------------------------------------------
// PICK UP - Nueva función recoger
// ---------------------------------------------------
function handlePickUp(obj, state, actionLine, currentMapName) {
  // Los contenidos ocultos de un objeto con estados no son interactuables.
  if (obj.visible === false) {
    return false;
  }

  // El objeto no puede recogerse
  if (!obj.pickup) {
    if (actionLine) {
      actionLine.textContent = `No puedo coger ${obj.name}.`;
    }

    return false;
  }

  // Ya estaba recogido
  if (obj.collected) {
    if (actionLine) {
      actionLine.textContent = `${obj.name} ya no está aquí.`;
    }

    return false;
  }

  const inventory = getActiveInventory(state);

  if (getInventoryItemCount(inventory) >= MAX_INVENTORY_ITEMS) {
    InteractionManager.showTemporaryMessage(
      "El inventario está lleno",
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return false;
  }

  const libraryItem = window.ObjectLibrary.find(
    (item) => item.id === obj.typeId,
  );
  const displayName = libraryItem?.name ?? obj.name;

  const inventoryItem = {
    id: obj.id,
    worldInstanceId: `${currentMapName}:${obj.id}`,
    typeId: libraryItem?.id ?? obj.id,
    name: displayName,
    sprite: obj.sprite,
    description: obj.description,
  };

  if (!addInventoryItem(state, state.activeCharacter, inventoryItem)) {
    return false;
  }

  // Solo la instancia de llave vinculada explícitamente al buzón activa la
  // variable global, y únicamente después de entrar realmente al inventario.
  if (window.StatefulObjectManager?.isMailboxKey(obj)) {
    GameVariables.set("tenemosLlave", true);
  }

  // Recoger objeto
  obj.collected = true;
  obj.visible = false;

  // Guardar automáticamente todos sus cambios
  DoorManager.persistObjectState(obj, currentMapName);

  InventoryManager.refreshInventoryUI(state, actionLine);

  InteractionManager.showTemporaryMessage(
    `Has cogido ${displayName}.`,
    state,
    actionLine,
  );

  EventsManager.selectDefaultVerb(state, actionLine, true);

  return true;
}

window.InventoryManager = {
  MAX_INVENTORY_ITEMS,
  createEmptyInventory,
  normalizeInventorySlots,
  getCharacterInventory,
  getActiveInventory,
  getInventoryItemCount,
  findFirstFreeInventorySlot,
  addInventoryItem,
  getInventoryCharacter,
  canItemLeaveInventory,
  canCharacterReceiveItem,
  getItemInstanceIdentity,
  isSameItemInstance,
  canAddItemToInventory,
  removeInventoryItem,
  replaceInventoryItem,
  clearSelectedInventoryItem,
  consumeSelectedInventoryItem,
  createInventoryItemElement,
  refreshInventoryUI,
  handlePickUp,
};
