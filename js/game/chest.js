// =======================================================
// GESTOR DEL COFRE MÁGICO COMPARTIDO
// =======================================================

const MAX_CHEST_ITEMS = 50;

let chestIsOpen = false;
let chestMode = null;
let activeState = null;
let activeActionLine = null;
let chestRoot = null;

function getChestItems() {
  GameState.chest ??= { items: [] };
  GameState.chest.items ??= [];

  const items = GameState.chest.items;
  const hasFixedSlots =
    items.length === MAX_CHEST_ITEMS &&
    Array.from(
      { length: MAX_CHEST_ITEMS },
      (_unused, index) => index in items,
    ).every(Boolean);

  if (!hasFixedSlots) {
    const fixedSlots = Array(MAX_CHEST_ITEMS).fill(null);
    items.slice(0, MAX_CHEST_ITEMS).forEach((item, index) => {
      fixedSlots[index] = item ?? null;
    });
    GameState.chest.items = fixedSlots;
  }

  return GameState.chest.items;
}

function getChestItemCount(items = getChestItems()) {
  return items.reduce((count, item) => count + (item ? 1 : 0), 0);
}

function findFirstFreeChestSlot(items = getChestItems()) {
  return items.findIndex((item) => !item);
}

function getElement(id) {
  return chestRoot?.querySelector?.(`#${id}`) ??
    window.document?.getElementById?.(id) ?? null;
}

function showChestMessage(
  text,
  state = activeState,
  actionLine = activeActionLine,
) {
  if (!text || !state || !actionLine) return false;
  return InteractionManager.showTemporaryMessage(text, state, actionLine);
}

function stopGameInput(state) {
  if (!state) return;

  if (state.target) state.target.active = false;
  state.path = [];
  state.pathIndex = 0;
  state.pendingInteraction = null;
  state.pendingHotspot = null;
  state.pendingNpc = null;
  state.pendingNpcDistance = null;
  state.pendingTeleport = null;
  if (state.player) state.player.moving = false;
  state.companions?.forEach((character) => {
    character.moving = false;
  });
}

function setMode(mode) {
  if (!chestIsOpen || !["store", "take"].includes(mode)) return false;

  chestMode = mode;
  getElement("chest-store-btn")?.classList.toggle(
    "active-verb",
    mode === "store",
  );
  getElement("chest-take-btn")?.classList.toggle(
    "active-verb",
    mode === "take",
  );

  return true;
}

function createSlot(item, index, kind) {
  const slot = document.createElement("button");
  slot.type = "button";
  slot.className = `chest-slot chest-${kind}-slot`;
  slot.dataset.index = String(index);

  if (!item) {
    slot.disabled = true;
    slot.setAttribute("aria-disabled", "true");
    return slot;
  }

  slot.title = item.name ?? "Objeto";
  const itemElement = InventoryManager.createInventoryItemElement(item);
  itemElement.classList.add("chest-item-icon");
  slot.appendChild(itemElement);

  slot.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (kind === "storage" && chestMode === "take") {
      takeItem(item, activeState, activeActionLine);
    }
  });

  return slot;
}

function fillGrid(container, items, capacity, kind) {
  if (!container) return;
  container.replaceChildren?.();
  if (!container.replaceChildren) container.innerHTML = "";

  for (let index = 0; index < capacity; index += 1) {
    container.appendChild(createSlot(items[index] ?? null, index, kind));
  }
}

function renderChestUI() {
  if (!activeState) return false;

  const chestItems = getChestItems();
  fillGrid(getElement("chest-storage-grid"), chestItems, MAX_CHEST_ITEMS, "storage");

  return true;
}

function handleInventoryItemClick(item, state, actionLine) {
  if (!chestIsOpen || chestMode !== "store") return false;
  return storeItem(item, state, actionLine);
}

function storeItem(item, state = activeState, actionLine = activeActionLine) {
  const inventory = InventoryManager.getCharacterInventory(
    state,
    state?.activeCharacter,
  );
  const chestItems = getChestItems();
  const sourceIndex = inventory?.indexOf(item) ?? -1;
  const targetIndex = findFirstFreeChestSlot(chestItems);

  if (sourceIndex < 0) return false;
  if (
    getChestItemCount(chestItems) >= MAX_CHEST_ITEMS ||
    targetIndex < 0
  ) {
    showChestMessage("No cabe nada en el baúl", state, actionLine);
    return false;
  }
  if (!InventoryManager.canItemLeaveInventory(item)) {
    showChestMessage("No puedo separarme de mi amiga", state, actionLine);
    return false;
  }
  if (
    chestItems.some(
      (storedItem) => InventoryManager.isSameItemInstance(storedItem, item),
    )
  ) {
    showChestMessage("Ese objeto ya está en el cofre", state, actionLine);
    return false;
  }

  try {
    if (!InventoryManager.removeInventoryItem(
      state,
      state.activeCharacter,
      item,
      actionLine,
    )) {
      return false;
    }

    chestItems[targetIndex] = item;
  } catch (error) {
    chestItems[targetIndex] = null;
    if (!inventory.includes(item)) inventory[sourceIndex] = item;
    InventoryManager.refreshInventoryUI(state, actionLine);
    return false;
  }

  showChestMessage(
    `Guardaste ${item.name ?? "Objeto"}`,
    state,
    actionLine,
  );
  renderChestUI();
  return true;
}

function takeItem(item, state = activeState, actionLine = activeActionLine) {
  const inventory = InventoryManager.getCharacterInventory(
    state,
    state?.activeCharacter,
  );
  const chestItems = getChestItems();
  const sourceIndex = chestItems.indexOf(item);
  const targetIndex = InventoryManager.findFirstFreeInventorySlot(inventory);

  if (sourceIndex < 0 || !Array.isArray(inventory)) return false;
  if (
    InventoryManager.getInventoryItemCount(inventory) >=
      InventoryManager.MAX_INVENTORY_ITEMS ||
    targetIndex < 0
  ) {
    showChestMessage("No puedo llevar más cosas", state, actionLine);
    return false;
  }
  if (!InventoryManager.canAddItemToInventory(
    state,
    state.activeCharacter,
    item,
  )) {
    showChestMessage("No puedo llevar ese objeto", state, actionLine);
    return false;
  }

  try {
    chestItems[sourceIndex] = null;
    if (!InventoryManager.addInventoryItem(state, state.activeCharacter, item)) {
      chestItems[sourceIndex] = item;
      return false;
    }
  } catch (error) {
    if (inventory[targetIndex] === item) inventory[targetIndex] = null;
    chestItems[sourceIndex] = item;
    InventoryManager.refreshInventoryUI(state, actionLine);
    return false;
  }

  InventoryManager.refreshInventoryUI(state, actionLine);
  showChestMessage(
    `Recuperaste ${item.name ?? "Objeto"}`,
    state,
    actionLine,
  );
  renderChestUI();
  return true;
}

function open(state, actionLine) {
  if (chestIsOpen || window.DialogueManager?.isActive()) return false;

  chestRoot ??= document.getElementById("chest-overlay");
  if (!chestRoot) return false;

  activeState = state;
  activeActionLine = actionLine ?? null;
  stopGameInput(state);
  InventoryManager.clearSelectedInventoryItem(state, actionLine);
  chestIsOpen = true;
  chestRoot.hidden = false;
  document.getElementById("game-screen")?.classList.add("chest-open");
  setMode("store");
  renderChestUI();
  return true;
}

function close() {
  if (!chestIsOpen) return false;

  chestIsOpen = false;
  chestMode = null;
  if (chestRoot) chestRoot.hidden = true;
  document.getElementById("game-screen")?.classList.remove("chest-open");
  if (activeState) {
    activeState.messageTimeout = null;
    window.EventsManager?.selectDefaultVerb?.(
      activeState,
      activeActionLine,
    );
  }

  activeState = null;
  activeActionLine = null;
  return true;
}

function createChestActionButton(id, label) {
  const existingButton = document.getElementById(id);
  if (existingButton) return existingButton;

  const verbsPanel = document.getElementById("verbs-panel");
  if (!verbsPanel) return null;

  const button = document.createElement("button");
  button.id = id;
  button.type = "button";
  button.textContent = label;
  button.classList.add("verb-btn", "chest-action-btn");
  verbsPanel.appendChild(button);
  return button;
}

function initialize() {
  getChestItems();
  chestRoot = document.getElementById("chest-overlay");
  const storeButton = createChestActionButton(
    "chest-store-btn",
    "Guardar objeto",
  );
  const takeButton = createChestActionButton(
    "chest-take-btn",
    "Sacar objeto",
  );
  const backButton = createChestActionButton(
    "chest-back-btn",
    "Volver al juego",
  );
  if (!chestRoot || chestRoot.dataset.bound === "true") return Boolean(chestRoot);

  chestRoot.dataset.bound = "true";
  chestRoot.addEventListener("click", (event) => event.stopPropagation());
  storeButton?.addEventListener("click", () => setMode("store"));
  takeButton?.addEventListener("click", () => setMode("take"));
  backButton?.addEventListener("click", close);
  return true;
}

function reset() {
  if (chestIsOpen) close();
  GameState.chest = { items: Array(MAX_CHEST_ITEMS).fill(null) };
  return GameState.chest.items;
}

window.ChestManager = {
  MAX_CHEST_ITEMS,
  initialize,
  reset,
  open,
  close,
  isOpen: () => chestIsOpen,
  getMode: () => chestMode,
  getItems: getChestItems,
  getItemCount: getChestItemCount,
  findFirstFreeSlot: findFirstFreeChestSlot,
  setMode,
  handleInventoryItemClick,
  storeItem,
  takeItem,
  render: renderChestUI,
};
