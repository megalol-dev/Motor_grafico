// =======================================================
// GESTOR DE MUERTES PERMANENTES DEL EQUIPO
// =======================================================

const DEATH_SLOTS = ["slot1", "slot2", "slot3"];
const CHARACTER_NAMES = {
  pj1: "Ryan",
  pj2: "April",
  pj3: "Milton",
  pj4: "Hank",
  pj5: "Spike",
  pj6: "Robin",
};
const DEFAULT_CINEMATIC_TIMING = {
  preDeathDelayMs: 2000,
  fadeMs: 350,
  sceneHoldMs: 3000,
  typingMs: 4400,
  messageHoldMs: 3000,
};

function createDeathState() {
  return {
    slots: { slot1: false, slot2: false, slot3: false },
    pendingItems: [],
    boundItems: [],
    sequenceActive: false,
    gameOver: false,
  };
}

function getDeathState() {
  GameState.deaths ??= createDeathState();
  GameState.deaths.slots ??= { slot1: false, slot2: false, slot3: false };
  GameState.deaths.pendingItems ??= [];
  GameState.deaths.boundItems ??= [];
  GameState.deaths.sequenceActive ??= false;
  GameState.deaths.gameOver ??= false;
  return GameState.deaths;
}

function resetDeaths() {
  GameState.deaths = createDeathState();
  DeathManager.hideOverlay();
  DeathManager.updateCharacterButtons();
  return GameState.deaths;
}

function isSlotDead(slot) {
  return DEATH_SLOTS.includes(slot) && getDeathState().slots[slot] === true;
}

function getCharacterBySlot(state, slot) {
  if (state?.player?.id === slot) return state.player;
  return state?.companions?.find((character) => character.id === slot) ?? null;
}

function getCharacterName(characterOrSprite) {
  const sprite = typeof characterOrSprite === "string"
    ? characterOrSprite
    : characterOrSprite?.sprite;
  return CHARACTER_NAMES[String(sprite ?? "").toLowerCase()] ?? "El personaje";
}

function captureCharacterLocation(state, slot) {
  const character = getCharacterBySlot(state, slot);
  if (!character?.currentMap) return null;

  return {
    mapName: character.currentMap,
    x: character.x,
    y: character.y,
    direction: character.direction,
  };
}

function getSlotNumber(slot) {
  const index = DEATH_SLOTS.indexOf(slot);
  return index >= 0 ? index + 1 : null;
}

function getGraveTypeId(slot) {
  const number = getSlotNumber(slot);
  return number ? `tumba_${number}` : null;
}

function isGrave(obj) {
  return obj?.type === "grave" || /^tumba_[123]$/.test(obj?.typeId ?? "");
}

function getGraveSlot(obj) {
  if (!isGrave(obj)) return null;
  const match = String(obj.typeId ?? "").match(/^tumba_([123])$/);
  return match ? `slot${match[1]}` : null;
}

function shouldRenderGrave(obj) {
  const slot = getGraveSlot(obj);
  return Boolean(slot && isSlotDead(slot));
}

function findGrave(mapData, slot) {
  const typeId = getGraveTypeId(slot);
  return mapData?.objects?.find((obj) => obj.typeId === typeId) ?? null;
}

function closeDeathSource(source, currentMapName, mapData) {
  const sourceMapName = source?.mapName;
  const sourceObjectId = source?.objectId;
  if (!sourceMapName || !sourceObjectId) return false;

  const liveObject = sourceMapName === currentMapName
    ? mapData?.objects?.find((obj) => obj.id === sourceObjectId)
    : null;
  const savedObject = GameState.maps[sourceMapName]?.objects?.[sourceObjectId];
  const trash = liveObject ?? savedObject ?? null;

  if (trash?.typeId !== "!cuboBasura") return false;

  trash.deathTriggered = false;
  return StatefulObjectManager.setObjectState(
    trash,
    "cerrado",
    liveObject ? mapData.objects : [trash],
    sourceMapName,
  );
}

function getNextLivingSlot(deadSlot) {
  const orders = {
    slot1: ["slot2", "slot3"],
    slot2: ["slot1", "slot3"],
    slot3: ["slot1", "slot2"],
  };
  return orders[deadSlot]?.find((slot) => !isSlotDead(slot)) ?? null;
}

function areAllDead() {
  return DEATH_SLOTS.every((slot) => isSlotDead(slot));
}

function containsSameItem(items, item) {
  return items.some(
    (storedItem) =>
      storedItem && InventoryManager.isSameItemInstance(storedItem, item),
  );
}

function flushPendingToChest(chestItems) {
  if (!Array.isArray(chestItems)) return 0;

  const deathState = getDeathState();
  let transferred = 0;
  deathState.pendingItems = deathState.pendingItems.filter((item) => {
    if (containsSameItem(chestItems, item)) return false;

    const freeSlot = chestItems.findIndex((storedItem) => !storedItem);
    if (freeSlot < 0) return true;

    chestItems[freeSlot] = item;
    transferred += 1;
    return false;
  });

  return transferred;
}

function transferInventory(state, slot) {
  const inventory = InventoryManager.getCharacterInventory(state, slot);
  if (!Array.isArray(inventory)) return false;

  const deathState = getDeathState();
  const chestItems = window.ChestManager?.getItems?.() ?? [];

  inventory.forEach((item, index) => {
    if (!item) return;

    const alreadyStored = item.boundToCharacter
      ? containsSameItem(deathState.boundItems, item)
      : containsSameItem(chestItems, item) ||
        containsSameItem(deathState.pendingItems, item);
    const target = item.boundToCharacter
      ? deathState.boundItems
      : chestItems.findIndex((storedItem) => !storedItem) >= 0
        ? chestItems
        : deathState.pendingItems;

    if (!alreadyStored) {
      if (target === chestItems) {
        target[target.findIndex((storedItem) => !storedItem)] = item;
      } else {
        target.push(item);
      }
    }

    inventory[index] = null;
    if (state.selectedInventoryItem === item) state.selectedInventoryItem = null;
  });

  return true;
}

function markDead(state, slot) {
  if (!DEATH_SLOTS.includes(slot) || isSlotDead(slot)) return false;

  transferInventory(state, slot);
  const deathState = getDeathState();
  deathState.slots[slot] = true;
  deathState.gameOver = areAllDead();
  return true;
}

function setSequenceActive(active) {
  getDeathState().sequenceActive = active === true;
  DeathManager.updateCharacterButtons();
}

function isInputBlocked() {
  const deathState = getDeathState();
  return deathState.sequenceActive || deathState.gameOver;
}

function waitForCinematic(milliseconds) {
  const duration = Math.max(0, Number(milliseconds) || 0);
  if (duration === 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function getCinematicTiming(overrides = {}) {
  return { ...DEFAULT_CINEMATIC_TIMING, ...overrides };
}

function setOverlayOpacity(opaque) {
  const overlay = window.document?.getElementById?.("death-overlay");
  if (!overlay) return false;
  overlay.classList?.toggle("is-opaque", opaque === true);
  return true;
}

async function waitBeforeDeath(overrides = {}) {
  const timing = getCinematicTiming(overrides);
  await waitForCinematic(timing.preDeathDelayMs);
  return true;
}

async function fadeToBlack(overrides = {}) {
  const timing = getCinematicTiming(overrides);
  showOverlay("", false, false);

  const overlay = window.document?.getElementById?.("death-overlay");
  if (overlay) void overlay.offsetWidth;
  setOverlayOpacity(true);
  await waitForCinematic(timing.fadeMs);
  return true;
}

async function revealDeathScene(overrides = {}) {
  const timing = getCinematicTiming(overrides);
  setOverlayOpacity(false);
  await waitForCinematic(timing.fadeMs);
  await waitForCinematic(timing.sceneHoldMs);
  setOverlayOpacity(true);
  await waitForCinematic(timing.fadeMs);
  return true;
}

async function typeDeathMessage(text, overrides = {}) {
  const timing = getCinematicTiming(overrides);
  const message = window.document?.getElementById?.("death-overlay-message");
  const content = String(text ?? "");
  if (!message) return false;

  message.textContent = "";
  const characterDelay = content.length > 0
    ? timing.typingMs / content.length
    : 0;

  for (let index = 0; index < content.length; index += 1) {
    await waitForCinematic(characterDelay);
    message.textContent = content.slice(0, index + 1);
  }

  await waitForCinematic(timing.messageHoldMs);
  return true;
}

async function fadeFromBlack(overrides = {}) {
  const timing = getCinematicTiming(overrides);
  setOverlayOpacity(false);
  await waitForCinematic(timing.fadeMs);
  hideOverlay();
  return true;
}

function showOverlay(text = "", gameOver = false, opaque = true) {
  const overlay = window.document?.getElementById?.("death-overlay");
  const message = window.document?.getElementById?.("death-overlay-message");
  if (!overlay) return false;

  overlay.hidden = false;
  overlay.classList?.toggle("game-over", gameOver === true);
  overlay.classList?.toggle("is-opaque", opaque === true);
  if (message) message.textContent = text;
  return true;
}

function hideOverlay() {
  const overlay = window.document?.getElementById?.("death-overlay");
  if (!overlay) return false;
  overlay.hidden = true;
  overlay.classList?.remove("game-over");
  overlay.classList?.remove("is-opaque");
  const message = window.document?.getElementById?.("death-overlay-message");
  if (message) message.textContent = "";
  return true;
}

function updateCharacterButtons() {
  window.document?.querySelectorAll?.(".player-btn")?.forEach((button) => {
    const dead = isSlotDead(button.dataset.character);
    button.disabled = dead || isInputBlocked();
    button.classList?.toggle("dead-character", dead);
  });
}

window.DeathManager = {
  SLOTS: DEATH_SLOTS,
  reset: resetDeaths,
  getState: getDeathState,
  isSlotDead,
  getCharacterBySlot,
  getCharacterName,
  captureCharacterLocation,
  getSlotNumber,
  getGraveTypeId,
  isGrave,
  getGraveSlot,
  shouldRenderGrave,
  findGrave,
  closeDeathSource,
  getNextLivingSlot,
  areAllDead,
  flushPendingToChest,
  transferInventory,
  markDead,
  setSequenceActive,
  isInputBlocked,
  getCinematicTiming,
  waitBeforeDeath,
  fadeToBlack,
  revealDeathScene,
  typeDeathMessage,
  fadeFromBlack,
  showOverlay,
  hideOverlay,
  updateCharacterButtons,
};

getDeathState();
