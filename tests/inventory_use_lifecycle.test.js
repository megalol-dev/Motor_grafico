const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

class FakeElement {
  constructor() {
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.listeners = {};
    this.classList = {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    };
  }

  addEventListener(type, listener) {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }

  click() {
    this.listeners.click?.forEach((listener) =>
      listener({ preventDefault() {}, stopPropagation() {} }),
    );
  }

  appendChild(child) {
    this.children.push(child);
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

const inventorySlots = Array.from({ length: 16 }, () => new FakeElement());
let playerButtons = [];
let verbButtons = [];

global.document = {
  createElement() {
    return new FakeElement();
  },
  querySelectorAll(selector) {
    if (selector === ".inventory-slot") return inventorySlots;
    if (selector === ".player-btn") return playerButtons;
    if (selector === ".verb-btn") return verbButtons;
    return [];
  },
};

load("js/catalogs/objects.js");
load("js/catalogs/verbs.js");
load("js/game/inventory.js");

function makeInventoryItem(id) {
  return {
    id: `${id}_instance`,
    typeId: id,
    name: id,
    sprite: `${id}.png`,
    description: id,
  };
}

function makeState() {
  return {
    currentVerb: "use",
    selectedInventoryItem: null,
    activeCharacter: "slot1",
    inventory: { slot1: [], slot2: [], slot3: [] },
    target: { active: false },
    path: [],
    pathIndex: 0,
    pendingInteraction: null,
    pendingHotspot: null,
    pendingNpc: null,
    pendingNpcDistance: null,
    pendingTeleport: null,
    messageTimeout: null,
    player: { id: "slot1", moving: false, currentMap: "map1" },
    companions: [
      { id: "slot2", moving: false, currentMap: "map1" },
      { id: "slot3", moving: false, currentMap: "map1" },
    ],
  };
}

// Una sola referencia controla la selección lógica y el borde amarillo.
const selectionState = makeState();
const key = makeInventoryItem("key");
const bar = makeInventoryItem("028");
selectionState.inventory.slot1.push(key, bar);
const selectionActionLine = { textContent: "" };

InventoryManager.refreshInventoryUI(selectionState, selectionActionLine);
inventorySlots[0].children[0].click();
assert.equal(selectionState.selectedInventoryItem, key);
assert.equal(selectionActionLine.textContent, "Usar key con...");
assert.equal(inventorySlots[0].children[0].style.outline, "3px solid yellow");

inventorySlots[1].children[0].click();
assert.equal(selectionState.selectedInventoryItem, bar);
assert.equal(inventorySlots[0].children[0].style.outline, undefined);
assert.equal(inventorySlots[1].children[0].style.outline, "3px solid yellow");

InventoryManager.clearSelectedInventoryItem(
  selectionState,
  selectionActionLine,
);
assert.equal(selectionState.selectedInventoryItem, null);
assert.equal(inventorySlots[1].children[0].style.outline, undefined);

// El límite se valida antes de alterar objeto, inventario o persistencia.
let persistedObjects = 0;
global.DoorManager = {
  persistObjectState() {
    persistedObjects += 1;
  },
};
global.InteractionManager = {
  showTemporaryMessage(text, state, actionLine) {
    state.messageTimeout = true;
    actionLine.textContent = text;
  },
};
global.EventsManager = {
  selectDefaultVerb(state) {
    state.currentVerb = "Walk to";
  },
};

function makePickupObject(id) {
  return {
    id,
    typeId: "028",
    type: "item",
    name: "Barra de metal",
    description: "Una barra de metal resistente.",
    sprite: "028_Barra de metál.png",
    pickup: true,
    collected: false,
    visible: true,
  };
}

assert.equal(InventoryManager.MAX_INVENTORY_ITEMS, 16);
assert.deepEqual(
  InventoryManager.createEmptyInventory(),
  Array(16).fill(null),
);

const emptyState = makeState();
InventoryManager.handlePickUp(
  makePickupObject("pickup_empty"),
  emptyState,
  { textContent: "" },
  "map_test",
);
assert.equal(emptyState.inventory.slot1.length, 16);
assert.equal(emptyState.inventory.slot1[0]?.id, "pickup_empty");
assert.equal(emptyState.inventory.slot1.slice(1).every((item) => item === null), true);

const fifteenState = makeState();
fifteenState.inventory.slot1 = Array.from({ length: 15 }, (_, index) =>
  makeInventoryItem(`item_${index}`),
);
InventoryManager.handlePickUp(
  makePickupObject("pickup_sixteenth"),
  fifteenState,
  { textContent: "" },
  "map_test",
);
assert.equal(fifteenState.inventory.slot1.length, 16);

const fullState = makeState();
fullState.inventory.slot1 = Array.from({ length: 16 }, (_, index) =>
  makeInventoryItem(`full_${index}`),
);
const rejectedObject = makePickupObject("pickup_rejected");
const rejectedSnapshot = JSON.parse(JSON.stringify(rejectedObject));
const fullActionLine = { textContent: "" };
const persistedBeforeRejection = persistedObjects;

InventoryManager.handlePickUp(
  rejectedObject,
  fullState,
  fullActionLine,
  "map_full",
);

assert.equal(fullActionLine.textContent, "El inventario está lleno");
assert.equal(fullState.inventory.slot1.length, 16);
assert.deepEqual(rejectedObject, rejectedSnapshot);
assert.equal(persistedObjects, persistedBeforeRejection);

fullState.activeCharacter = "slot2";
InventoryManager.handlePickUp(
  rejectedObject,
  fullState,
  fullActionLine,
  "map_full",
);
assert.equal(fullState.inventory.slot2.length, 16);
assert.equal(fullState.inventory.slot2[0]?.id, "pickup_rejected");
assert.equal(rejectedObject.collected, true);
assert.equal(rejectedObject.visible, false);

for (const character of ["slot1", "slot2", "slot3"]) {
  const perCharacterState = makeState();
  perCharacterState.activeCharacter = character;
  perCharacterState.inventory[character] = Array.from(
    { length: 16 },
    (_, index) => makeInventoryItem(`${character}_${index}`),
  );
  const candidate = makePickupObject(`candidate_${character}`);

  InventoryManager.handlePickUp(
    candidate,
    perCharacterState,
    { textContent: "" },
    "map_test",
  );

  assert.equal(perCharacterState.inventory[character].length, 16);
  assert.equal(candidate.collected, false);
  assert.equal(candidate.visible, true);
}

// Flujo general de Usar y cancelación de acciones pendientes.
load("js/game/interactions.js");

global.PathfindingManager = {
  findInteractionTileForObject() {
    return { col: 1, row: 1 };
  },
  findInteractionTileForHotspot() {
    return { col: 1, row: 1 };
  },
  findInteractionTileForNpc() {
    return { col: 1, row: 1 };
  },
  createPathToTile(_col, _row, _player, state) {
    state.path = [{ col: 1, row: 1 }];
    return true;
  },
};
global.WorldManager = {
  findNearestWalkableTile() {
    return { col: 1, row: 1 };
  },
};
global.MovementManager = { updateDirectionFromVector() {} };
global.NpcManager = {
  isActive() {
    return true;
  },
  getLibraryItem(npc) {
    return {
      name: npc.typeId === "NPC_1" ? "Planta carnívora" : "Otro NPC",
      description: "Un NPC.",
    };
  },
  getCollisionRect() {
    return { x: 24, y: 30, width: 24, height: 30 };
  },
};
global.RenderManager = { render() {} };
global.HotspotLibrary = [
  { id: "test_hotspot", name: "Zona", description: "Una zona." },
];
global.VerbLibrary = [
  { id: "use", label: "Usar" },
  { id: "open", label: "Abrir" },
];

load("js/game/events.js");

const lifecycleState = makeState();
lifecycleState.inventory.slot1.push(key, bar);
const lifecycleActionLine = { textContent: "" };
const player = { x: 12, y: 30, direction: "down", moving: false };
const mapData = {
  tileWidth: 24,
  tileHeight: 30,
  objects: [],
  hotspots: [],
  npcs: [],
};
const incompatibleObject = {
  id: "incompatible",
  typeId: "flowerpot",
  type: "item",
  name: "Maceta",
  description: "Maceta",
};

lifecycleState.selectedInventoryItem = key;
EventsManager.handleClickedObject(
  incompatibleObject,
  lifecycleState,
  lifecycleActionLine,
  () => mapData,
  () => player,
  6,
);
assert.equal(lifecycleState.selectedInventoryItem, key);
assert.equal(lifecycleState.pendingInteraction, incompatibleObject);

InteractionManager.handleObjectInteraction(
  incompatibleObject,
  lifecycleState,
  lifecycleActionLine,
  "map_test",
  mapData,
  {},
  {},
  true,
  {},
  {},
  {},
  {},
  {},
  1,
  1,
  24,
  60,
  (verb) => verb,
  () => {},
);
assert.equal(lifecycleActionLine.textContent, "No puedo usar key con Maceta.");
assert.equal(lifecycleState.selectedInventoryItem, null);
assert.equal(lifecycleState.inventory.slot1.includes(key), true);

lifecycleState.currentVerb = "use";
lifecycleState.selectedInventoryItem = bar;
InteractionManager.handleNpcInteraction(
  { typeId: "NPC_1" },
  lifecycleState,
  lifecycleActionLine,
  (verb) => verb,
);
assert.equal(lifecycleActionLine.textContent, "No es una buena idea");
assert.equal(lifecycleState.selectedInventoryItem, null);
assert.equal(lifecycleState.inventory.slot1.includes(bar), true);

lifecycleState.currentVerb = "use";
lifecycleState.selectedInventoryItem = bar;
InteractionManager.handleNpcInteraction(
  { typeId: "NPC_FUTURE" },
  lifecycleState,
  lifecycleActionLine,
  (verb) => verb,
);
assert.equal(
  lifecycleActionLine.textContent,
  "No puedo abrir una puerta a golpes con la barra",
);
assert.equal(lifecycleState.selectedInventoryItem, null);

lifecycleState.currentVerb = "use";
lifecycleState.selectedInventoryItem = bar;
InteractionManager.handleHotspotInteraction(
  { typeId: "test_hotspot" },
  lifecycleState,
  lifecycleActionLine,
);
assert.equal(
  lifecycleActionLine.textContent,
  "No puedo abrir una puerta a golpes con la barra",
);
assert.equal(lifecycleState.selectedInventoryItem, null);

lifecycleState.currentVerb = "use";
lifecycleState.selectedInventoryItem = key;
lifecycleState.pendingInteraction = { typeId: "door_14", type: "door" };
player.direction = "down";
EventsManager.handleGroundClick(
  { x: 48, y: 60 },
  lifecycleState,
  lifecycleActionLine,
  () => mapData,
  () => player,
  6,
  (verb) => verb,
);
assert.equal(lifecycleState.selectedInventoryItem, null);
assert.equal(lifecycleState.pendingInteraction, null);
assert.ok(lifecycleState.path.length > 0);
assert.equal(lifecycleState.currentVerb, "use");
assert.equal(player.direction, "down");

WorldManager.findNearestWalkableTile = () => null;
lifecycleState.selectedInventoryItem = key;
lifecycleState.pendingInteraction = incompatibleObject;
EventsManager.handleGroundClick(
  { x: 999, y: 999 },
  lifecycleState,
  lifecycleActionLine,
  () => mapData,
  () => player,
  6,
  (verb) => verb,
);
assert.equal(lifecycleState.selectedInventoryItem, null);
assert.equal(lifecycleState.pendingInteraction, null);
assert.equal(lifecycleState.path.length, 0);

const openButton = new FakeElement();
openButton.dataset.verb = "open";
verbButtons = [openButton];
lifecycleState.currentVerb = "use";
lifecycleState.selectedInventoryItem = bar;
lifecycleState.pendingInteraction = incompatibleObject;
EventsManager.bindVerbButtons(verbButtons, lifecycleState, lifecycleActionLine);
openButton.click();
assert.equal(lifecycleState.currentVerb, "open");
assert.equal(lifecycleActionLine.textContent, "Abrir...");
assert.equal(lifecycleState.selectedInventoryItem, null);
assert.equal(lifecycleState.pendingInteraction, null);

const slot2Button = new FakeElement();
slot2Button.dataset.character = "slot2";
playerButtons = [slot2Button];
lifecycleState.currentVerb = "use";
lifecycleState.selectedInventoryItem = key;
lifecycleState.activeCharacter = "slot1";
EventsManager.bindCharacterButtons(
  lifecycleState,
  () => "map1",
  lifecycleActionLine,
  () =>
    lifecycleState.activeCharacter === "slot1"
      ? lifecycleState.player
      : lifecycleState.companions.find(
          (character) => character.id === lifecycleState.activeCharacter,
        ),
  () => {},
);
slot2Button.click();
assert.equal(lifecycleState.activeCharacter, "slot2");
assert.equal(lifecycleState.selectedInventoryItem, null);

console.log("Inventory capacity and Use selection lifecycle: OK");
