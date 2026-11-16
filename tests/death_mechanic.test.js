const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  toggle(value, force) {
    if (force === true) this.values.add(value);
    else if (force === false) this.values.delete(value);
    else if (this.values.has(value)) this.values.delete(value);
    else this.values.add(value);
  }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.children = [];
    this.dataset = {};
    this.classList = new FakeClassList();
    this.hidden = true;
    this.disabled = false;
    this.textContent = "";
  }
  addEventListener() {}
  appendChild(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  setAttribute() {}
  set innerHTML(value) { this._innerHTML = value; this.children = []; }
}

const overlay = new FakeElement("death-overlay");
const overlayMessage = new FakeElement("death-overlay-message");
const buttons = ["slot1", "slot2", "slot3"].map((slot) => {
  const button = new FakeElement();
  button.dataset.character = slot;
  return button;
});
const inventorySlots = Array.from({ length: 16 }, () => new FakeElement());
const elements = {
  "death-overlay": overlay,
  "death-overlay-message": overlayMessage,
};

global.document = {
  createElement() { return new FakeElement(); },
  getElementById(id) { return elements[id] ?? null; },
  querySelectorAll(selector) {
    if (selector === ".player-btn") return buttons;
    if (selector === ".inventory-slot") return inventorySlots;
    if (selector === ".verb-btn") return [];
    return [];
  },
};

global.NpcManager = {
  isPointBlockedByNpc() { return false; },
  getBlockingNpcForObject() { return null; },
};
global.RenderManager = { render() {} };

load("js/catalogs/objects.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/variables.js");
load("js/game/doors.js");
load("js/game/object_states.js");
load("js/game/inventory.js");

let chestItems = Array(50).fill(null);
global.ChestManager = {
  getItems() { return chestItems; },
  isOpen() { return false; },
  open() {},
};

load("js/game/deaths.js");

const trashDefinition = ObjectLibrary.find((item) => item.id === "!cuboBasura");
assert.ok(trashDefinition);
assert.equal(trashDefinition.type, "stateful");
assert.equal(trashDefinition.name, "Cubo de basura");
assert.equal(trashDefinition.defaultState, "cerrado");
assert.equal(trashDefinition.stateSprites.cerrado, "!CuboBasura_1.png");
assert.equal(trashDefinition.stateSprites.abierto, "!CuboBasura_2.png");
assert.equal(trashDefinition.defaultSpriteWidth, 28);
assert.equal(trashDefinition.defaultSpriteHeight, 45);
assert.equal(trashDefinition.pickup, false);

const graveDefinitions = ObjectLibrary.slice(-3);
assert.deepEqual(
  graveDefinitions.map((item) => item.id),
  ["tumba_1", "tumba_2", "tumba_3"],
);
assert.deepEqual(
  graveDefinitions.map((item) => item.name),
  ["Tumba 1", "Tumba 2", "Tumba 3"],
);
assert.equal(graveDefinitions.every((item) => item.type === "grave"), true);
assert.equal(graveDefinitions.every((item) => item.pickup === false), true);

for (const [sprite, width, height] of [
  ["!CuboBasura_1.png", 28, 45],
  ["!CuboBasura_2.png", 28, 45],
  ["tumba_1.png", 54, 59],
  ["tumba_2.png", 54, 59],
  ["tumba_3.png", 54, 59],
]) {
  const png = fs.readFileSync(`img/objects/${sprite}`);
  assert.equal(png.readUInt32BE(16), width);
  assert.equal(png.readUInt32BE(20), height);
}

function createState(activeCharacter = "slot1") {
  return {
    currentVerb: "open",
    activeCharacter,
    selectedInventoryItem: null,
    inventory: {
      slot1: InventoryManager.createEmptyInventory(),
      slot2: InventoryManager.createEmptyInventory(),
      slot3: InventoryManager.createEmptyInventory(),
    },
    target: { active: false, x: 0, y: 0 },
    path: [],
    pathIndex: 0,
    pendingInteraction: null,
    pendingHotspot: null,
    pendingNpc: null,
    pendingNpcDistance: null,
    pendingTeleport: null,
    messageTimeout: null,
    player: {
      id: "slot1", sprite: "pj1", currentMap: "map_test",
      x: 12, y: 112.5, width: 24, height: 60, speed: 180,
      direction: "down", moving: false, animFrame: 0,
    },
    companions: [
      {
        id: "slot2", sprite: "pj6", currentMap: "map_test",
        x: 12, y: 112.5, width: 24, height: 60, speed: 180,
        direction: "down", moving: false, animFrame: 0,
      },
      {
        id: "slot3", sprite: "pj5", currentMap: "map_test",
        x: 12, y: 112.5, width: 24, height: 60, speed: 180,
        direction: "down", moving: false, animFrame: 0,
      },
    ],
  };
}

let capturedDialogue = null;
let capturedDeathSlot = null;
let capturedDeathSource = null;
global.DialogueManager = {
  isActive() { return false; },
  start(entries, options) {
    capturedDialogue = { entries, options };
    return true;
  },
};
global.EventsManager = {
  cancelPendingInteractions(state) {
    state.pendingInteraction = null;
    state.pendingHotspot = null;
    state.pendingNpc = null;
    state.pendingNpcDistance = null;
    state.pendingTeleport = null;
  },
  selectDefaultVerb(state) {
    state.selectedInventoryItem = null;
    state.currentVerb = "Walk to";
  },
};
global.GameModule = {
  handleCharacterDeath(slot, source) {
    capturedDeathSlot = slot;
    capturedDeathSource = source;
  },
};

load("js/game/interactions.js");

const lookState = createState();
const expectedLooks = {
  pj1: "Un cubo viejo de basura... Huele fatal. Será mejor no acercarse demasiado.",
  pj2: "¡Qué horror! Ese olor es una auténtica agresión a los sentidos.",
  pj3: "La descomposición de materia orgánica produce gases bastante desagradables.",
  pj4: "¡Puaj! ¡Esto apesta más que mis zapatillas después de entrenar!",
  pj5: "¡Eh, pues no huele tan mal! Me recuerda a mi habitación. ¡Qué buenos tiempos!",
  pj6: "¡Qué asco! ¿Cómo puede alguien dejar que se acumule tanta basura?",
};
const closedTrash = {
  id: "trash_test",
  typeId: "!cuboBasura",
  type: "stateful",
  name: trashDefinition.name,
  description: trashDefinition.description,
  sprite: trashDefinition.sprite,
  state: "cerrado",
  stateSprites: { ...trashDefinition.stateSprites },
  x: 48, y: 30,
  spriteWidth: 28, spriteHeight: 45,
  hitboxWidth: 28, hitboxHeight: 45,
  pickup: false, solid: true, visible: true, collected: false,
};

for (const [sprite, expected] of Object.entries(expectedLooks)) {
  lookState.player.sprite = sprite;
  lookState.activeCharacter = "slot1";
  assert.equal(InteractionManager.getObjectDescription(closedTrash, lookState), expected);
  assert.equal(DeathManager.isSlotDead("slot1"), false);
}
assert.match(expectedLooks.pj5, /no huele tan mal/);

const originalShowTemporaryMessage = InteractionManager.showTemporaryMessage;
const lookActionLine = { textContent: "" };
InteractionManager.showTemporaryMessage = (text) => {
  lookActionLine.textContent = text;
  return true;
};
lookState.currentVerb = "what is";
lookState.player.sprite = "pj1";
InteractionManager.handleObjectInteraction(
  closedTrash, lookState, lookActionLine, "map_test", { objects: [closedTrash] },
  {}, {}, true, {}, {}, {}, {}, {}, 1, 1, 24, 60,
  (verb) => VerbManager.getLabel(verb), () => {},
);
InteractionManager.showTemporaryMessage = originalShowTemporaryMessage;
assert.equal(lookActionLine.textContent, expectedLooks.pj1);
assert.equal(capturedDeathSlot, null);
assert.equal(closedTrash.state, "cerrado");

load("js/game/world.js");
load("js/game/movement.js");
load("js/game/pathfinding.js");
load("js/game/events.js");
load("js/game/player_controller.js");

const mapData = {
  tileWidth: 24,
  tileHeight: 30,
  cols: 12,
  rows: 8,
  walkable: Array.from({ length: 8 }, () => Array(12).fill(1)),
  objects: [closedTrash],
  hotspots: [],
  npcs: [],
  foregroundGraphics: [],
};
const openingState = createState("slot2");
const actionLine = { textContent: "" };
assert.equal(
  EventsManager.prepareObjectInteraction(
    closedTrash,
    openingState,
    actionLine,
    () => mapData,
    () => openingState.companions[0],
    6,
  ),
  true,
);
assert.equal(closedTrash.state, "cerrado");
assert.equal(openingState.pendingInteraction, closedTrash);

const controllerContext = {
  state: openingState,
  mapData,
  actionLine,
  currentMapName: "map_test",
  ctx: {}, canvas: {}, mapImageLoaded: true, mapImage: {},
  objectSprites: {}, playerSprites: {}, foregroundGraphicSprites: {}, npcSprites: {},
  MAP_SCALE: 1, PLAYER_SCALE: 1, FRAME_WIDTH: 24, FRAME_HEIGHT: 60,
  FOOT_OFFSET_Y: 6, TARGET_REACHED_DIST: 5,
  getVerbLabel: (verb) => VerbManager.getLabel(verb),
  getActiveCharacter: () => openingState.companions[0],
  changeMap() {},
};
for (let step = 0; step < 20 && openingState.pendingInteraction; step += 1) {
  PlayerController.updatePlayerByPath(1, controllerContext);
}
assert.equal(closedTrash.state, "abierto");
assert.equal(closedTrash.sprite, "!CuboBasura_2.png");
assert.equal(closedTrash.deathTriggered, true);
assert.deepEqual(capturedDialogue.entries, [{
  speaker: "Robin",
  text: "Un olor nauseabundo rodea a Robin.",
}]);
assert.equal(capturedDeathSlot, null);
assert.equal(DeathManager.getState().sequenceActive, false);
capturedDialogue.options.onFinish();
assert.equal(capturedDeathSlot, "slot2");
assert.deepEqual(capturedDeathSource, {
  mapName: "map_test",
  objectId: "trash_test",
});

const savedTrash = { ...closedTrash, state: "cerrado", sprite: "!CuboBasura_1.png" };
DoorManager.applyPersistentObjectStates("map_test", [savedTrash]);
StatefulObjectManager.applyObjectStates([savedTrash]);
assert.equal(savedTrash.state, "abierto");
assert.equal(savedTrash.deathTriggered, true);

assert.equal(
  DeathManager.closeDeathSource(
    capturedDeathSource,
    "map_test",
    { objects: [closedTrash] },
  ),
  true,
);
assert.equal(closedTrash.state, "cerrado");
assert.equal(closedTrash.sprite, "!CuboBasura_1.png");
assert.equal(closedTrash.deathTriggered, false);
const reloadedTrash = {
  ...closedTrash,
  state: "abierto",
  sprite: "!CuboBasura_2.png",
  deathTriggered: true,
};
DoorManager.applyPersistentObjectStates("map_test", [reloadedTrash]);
StatefulObjectManager.applyObjectStates([reloadedTrash]);
assert.equal(reloadedTrash.state, "cerrado");
assert.equal(reloadedTrash.deathTriggered, false);

const spikeState = createState("slot3");
capturedDialogue = null;
capturedDeathSlot = null;
InteractionManager.handleObjectInteraction(
  closedTrash, spikeState, actionLine, "map_test", mapData,
  {}, {}, true, {}, {}, {}, {}, {}, 1, 1, 24, 60,
  (verb) => VerbManager.getLabel(verb), () => {},
);
assert.equal(closedTrash.state, "cerrado");
assert.equal(closedTrash.deathTriggered, false);
assert.equal(actionLine.textContent, "Aquí no hay nada.");
assert.equal(capturedDialogue, null);
assert.equal(capturedDeathSlot, null);
assert.equal(closedTrash.sprite, "!CuboBasura_1.png");
assert.equal(closedTrash.deathTriggered, false);
assert.equal(capturedDeathSlot, null);

capturedDialogue = null;
capturedDeathSlot = null;
openingState.currentVerb = "open";
InteractionManager.handleObjectInteraction(
  closedTrash, openingState, actionLine, "map_test", mapData,
  {}, {}, true, {}, {}, {}, {}, {}, 1, 1, 24, 60,
  (verb) => VerbManager.getLabel(verb), () => {},
);
assert.equal(closedTrash.state, "abierto");
assert.ok(capturedDialogue);
capturedDialogue.options.onFinish();
assert.equal(capturedDeathSlot, "slot2");

// La misma apertura conserva su bloqueo hasta que la muerte vuelva a cerrarla.
capturedDialogue = null;
capturedDeathSlot = null;
openingState.currentVerb = "open";
InteractionManager.handleObjectInteraction(
  closedTrash, openingState, actionLine, "map_test", mapData,
  {}, {}, true, {}, {}, {}, {}, {}, 1, 1, 24, 60,
  (verb) => VerbManager.getLabel(verb), () => {},
);
assert.equal(actionLine.textContent, "Ya está abierto.");
assert.equal(capturedDialogue, null);
assert.equal(capturedDeathSlot, null);

capturedDialogue = null;
openingState.currentVerb = "open";
InteractionManager.handleObjectInteraction(
  closedTrash, openingState, actionLine, "map_test", mapData,
  {}, {}, true, {}, {}, {}, {}, {}, 1, 1, 24, 60,
  (verb) => VerbManager.getLabel(verb), () => {},
);
assert.equal(actionLine.textContent, "Ya está abierto.");
assert.equal(capturedDialogue, null);

function item(id, extra = {}) {
  return {
    id,
    typeId: extra.typeId ?? id,
    name: extra.name ?? id,
    sprite: `${id}.png`,
    description: id,
    worldInstanceId: extra.worldInstanceId,
    generatedInstanceId: extra.generatedInstanceId,
    boundToCharacter: extra.boundToCharacter,
  };
}

DeathManager.reset();
chestItems = Array(50).fill(null);
const inventoryState = createState("slot2");
const firstObject = item("object_2", { worldInstanceId: "map4:object_2" });
const secondObject = item("object_2", { worldInstanceId: "map7:object_2" });
const plantFriend = item("NPC_1_friend", {
  generatedInstanceId: "plant_friend:pj6",
  boundToCharacter: "pj6",
});
inventoryState.inventory.slot2[0] = firstObject;
inventoryState.inventory.slot2[5] = secondObject;
inventoryState.inventory.slot2[9] = plantFriend;
assert.equal(DeathManager.markDead(inventoryState, "slot2"), true);
assert.equal(DeathManager.isSlotDead("slot2"), true);
assert.equal(inventoryState.inventory.slot2.every((entry) => entry === null), true);
assert.equal(chestItems.includes(firstObject), true);
assert.equal(chestItems.includes(secondObject), true);
assert.equal(DeathManager.getState().boundItems[0], plantFriend);
assert.equal(DeathManager.getState().pendingItems.length, 0);
assert.equal(DeathManager.getNextLivingSlot("slot2"), "slot1");
assert.equal(DeathManager.getGraveTypeId("slot2"), "tumba_2");
assert.equal(DeathManager.markDead(inventoryState, "slot2"), false);
assert.equal(chestItems.filter(Boolean).length, 2);

buttons.forEach((button) => { button.disabled = false; });
DeathManager.updateCharacterButtons();
assert.equal(buttons[1].disabled, true);
assert.equal(buttons[0].disabled, false);

DeathManager.reset();
chestItems = Array.from({ length: 50 }, (_, index) =>
  item(`stored_${index}`, { worldInstanceId: `map:${index}` }),
);
const fullChestState = createState("slot1");
const overflowItem = item("overflow", { worldInstanceId: "map8:overflow" });
fullChestState.inventory.slot1[0] = overflowItem;
assert.equal(DeathManager.markDead(fullChestState, "slot1"), true);
assert.equal(DeathManager.getState().pendingItems[0], overflowItem);
assert.equal(fullChestState.inventory.slot1[0], null);
chestItems[12] = null;
assert.equal(DeathManager.flushPendingToChest(chestItems), 1);
assert.equal(chestItems[12], overflowItem);
assert.equal(DeathManager.getState().pendingItems.length, 0);

DeathManager.reset();
chestItems = Array(50).fill(null);
const positionState = createState("slot3");
positionState.player.currentMap = "map5";
positionState.player.x = 321.25;
positionState.player.y = 654.75;
positionState.player.direction = "left";
positionState.companions[0].currentMap = "map2";
positionState.companions[0].x = 88.5;
positionState.companions[0].y = 144.25;
positionState.companions[1].currentMap = "map8";
const survivorLocation = DeathManager.captureCharacterLocation(
  positionState,
  "slot1",
);
assert.equal(DeathManager.markDead(positionState, "slot3"), true);
assert.deepEqual(
  DeathManager.captureCharacterLocation(positionState, "slot1"),
  survivorLocation,
);
assert.deepEqual(survivorLocation, {
  mapName: "map5",
  x: 321.25,
  y: 654.75,
  direction: "left",
});
assert.equal(positionState.companions[0].currentMap, "map2");
assert.equal(positionState.companions[0].x, 88.5);
assert.equal(positionState.companions[0].y, 144.25);

DeathManager.reset();
const orderState = createState();
assert.equal(DeathManager.markDead(orderState, "slot1"), true);
assert.equal(DeathManager.getNextLivingSlot("slot1"), "slot2");
assert.equal(DeathManager.markDead(orderState, "slot2"), true);
assert.equal(DeathManager.getNextLivingSlot("slot2"), "slot3");
assert.equal(DeathManager.markDead(orderState, "slot3"), true);
assert.equal(DeathManager.areAllDead(), true);
assert.equal(DeathManager.getState().gameOver, true);
DeathManager.showOverlay("GAME OVER", true);
assert.equal(overlay.hidden, false);
assert.equal(overlayMessage.textContent, "GAME OVER");

const deadActionState = createState("slot1");
assert.equal(
  EventsManager.prepareObjectInteraction(
    closedTrash,
    deadActionState,
    { textContent: "" },
    () => mapData,
    () => deadActionState.player,
    6,
  ),
  false,
);

DeathManager.reset();
const graveState = createState();
graveState.camera = { x: 0, y: 0 };
DeathManager.markDead(graveState, "slot2");
load("js/game/render.js");
const drawOrder = [];
const ordinary = {
  id: "ordinary", typeId: "006", type: "item", sprite: "ordinary.png",
  x: 0, y: 0, spriteWidth: 24, spriteHeight: 30,
  hitboxWidth: 24, hitboxHeight: 30, visible: true, collected: false,
};
const graves = graveDefinitions.map((definition, index) => ({
  id: `grave_${index + 1}`,
  typeId: definition.id,
  type: "grave",
  sprite: definition.sprite,
  x: 30 * index,
  y: 30,
  spriteWidth: 54,
  spriteHeight: 59,
  hitboxWidth: 54,
  hitboxHeight: 59,
  visible: true,
  collected: false,
}));
RenderManager.drawObjects(
  { drawImage(sprite) { drawOrder.push(sprite.id); } },
  { objects: [graves[0], ordinary, graves[1], graves[2]] },
  {
    "ordinary.png": { id: "ordinary" },
    "tumba_1.png": { id: "grave1" },
    "tumba_2.png": { id: "grave2" },
    "tumba_3.png": { id: "grave3" },
  },
  graveState,
  1,
);
assert.deepEqual(drawOrder, ["ordinary", "grave2"]);
assert.equal(
  InteractionManager.getObjectAt(35, 35, { objects: graves }),
  null,
);
assert.equal(DeathManager.findGrave({ objects: graves }, "slot2"), graves[1]);

const gameSource = fs.readFileSync("js/game.js", "utf8");
assert.match(gameSource, /async function handleCharacterDeath/);
const deathHandlerSource = gameSource.slice(
  gameSource.indexOf("async function handleCharacterDeath"),
  gameSource.indexOf("function placePlayerAtSpawn"),
);
assert.equal(
  (deathHandlerSource.match(/DeathManager\.waitBeforeDeath\(\)/g) ?? []).length,
  1,
);
assert.ok(
  deathHandlerSource.indexOf("DeathManager.setSequenceActive(true)") <
    deathHandlerSource.indexOf("await DeathManager.waitBeforeDeath()"),
);
assert.ok(
  deathHandlerSource.indexOf("await DeathManager.waitBeforeDeath()") <
    deathHandlerSource.indexOf("await DeathManager.fadeToBlack()"),
);
assert.match(gameSource, /await changeMap\("map1", null, null, "down"\)/);
assert.match(gameSource, /state\.activeCharacter = slot;/);
assert.match(gameSource, /DeathManager\.captureCharacterLocation\(state, nextSlot\)/);
assert.match(gameSource, /await changeMapKeepingPosition\(/);
assert.ok(
  deathHandlerSource.indexOf("await changeMapKeepingPosition(") <
    deathHandlerSource.lastIndexOf("await DeathManager.fadeFromBlack()"),
);
assert.match(gameSource, /DeathManager\.findGrave\(mapData, slot\)/);
assert.match(gameSource, /CameraManager\.centerCameraOnPoint/);
assert.match(gameSource, /DeathManager\.showOverlay\("GAME OVER", true\)/);
const editorSource = fs.readFileSync("js/editor.js", "utf8");
assert.match(editorSource, /window\.ObjectLibrary\.map/);

console.log("Permanent death, trash can, inventory recovery and graves: OK");
