const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.classList = { add() {}, remove() {}, contains() { return false; } };
  }

  addEventListener() {}

  appendChild(child) {
    this.children.push(child);
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }
}

const inventorySlots = Array.from({ length: 16 }, () => new FakeElement());
global.document = {
  createElement() {
    return new FakeElement();
  },
  querySelectorAll(selector) {
    return selector === ".inventory-slot" ? inventorySlots : [];
  },
};

global.NpcManager = {
  isPointBlockedByNpc() {
    return false;
  },
};

let renderCount = 0;
global.RenderManager = {
  render() {
    renderCount += 1;
  },
};
global.ChestManager = { open() {} };
global.EventsManager = {
  selectDefaultVerb(state) {
    InventoryManager.clearSelectedInventoryItem(state, { textContent: "" });
    state.currentVerb = "Walk to";
  },
};

load("js/catalogs/objects.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/variables.js");
load("js/game/doors.js");
load("js/game/object_states.js");
load("js/game/inventory.js");
load("js/game/world.js");
load("js/game/pathfinding.js");
load("js/game/interactions.js");

const mailboxDefinition = ObjectLibrary.find((item) => item.id === "!buzon");
const keyDefinition = ObjectLibrary.find((item) => item.id === "key");
assert.ok(mailboxDefinition);
assert.equal(mailboxDefinition.type, "stateful");
assert.equal(mailboxDefinition.defaultState, "cerrado");
assert.equal(mailboxDefinition.defaultSpriteWidth, 28);
assert.equal(mailboxDefinition.defaultSpriteHeight, 45);
assert.equal(mailboxDefinition.stateSprites.cerrado, "!buzon1_Cerrado.png");
assert.equal(mailboxDefinition.stateSprites.abierto, "!buzon2_Abierto.png");
assert.equal(keyDefinition.alwaysOnTop, true);
assert.equal(keyDefinition.defaultSpriteWidth, 16);
assert.equal(keyDefinition.defaultSpriteHeight, 16);
assert.equal(keyDefinition.worldRenderWidth, 8);
assert.equal(keyDefinition.worldRenderHeight, 10);
assert.ok(ObjectLibrary.indexOf(mailboxDefinition) > ObjectLibrary.indexOf(keyDefinition));
assert.ok(
  ObjectLibrary.indexOf(mailboxDefinition) <
    ObjectLibrary.findIndex((item) => item.id === "door_0"),
);

function createMailboxObjects(suffix = "1") {
  const mailbox = {
    id: `mailbox_${suffix}`,
    typeId: "!buzon",
    type: "stateful",
    name: "Buzón",
    description: mailboxDefinition.description,
    sprite: mailboxDefinition.sprite,
    state: "cerrado",
    stateSprites: { ...mailboxDefinition.stateSprites },
    containedObjectId: `mailbox_key_${suffix}`,
    x: 48,
    y: 30,
    spriteWidth: 48,
    spriteHeight: 60,
    hitboxWidth: 48,
    hitboxHeight: 60,
    pickup: false,
    visible: true,
    collected: false,
  };
  const key = {
    id: `mailbox_key_${suffix}`,
    typeId: "key",
    type: "item",
    name: "Llave",
    description: keyDefinition.description,
    sprite: keyDefinition.sprite,
    x: 60,
    y: 48,
    spriteWidth: 16,
    spriteHeight: 16,
    hitboxWidth: 16,
    hitboxHeight: 16,
    pickup: true,
    visible: true,
    collected: false,
  };
  const unrelatedKey = {
    ...key,
    id: `unrelated_key_${suffix}`,
    x: 150,
  };

  // La llave se deja antes que el buzón para comprobar que, al abrirse,
  // recibe prioridad de clic aunque el contenedor aparezca después en el JSON.
  return { mailbox, key, unrelatedKey, objects: [key, mailbox, unrelatedKey] };
}

function createMap(objects) {
  return {
    tileWidth: 24,
    tileHeight: 30,
    cols: 12,
    rows: 8,
    walkable: Array.from({ length: 8 }, () => Array(12).fill(1)),
    objects,
    npcs: [],
  };
}

function createState() {
  return {
    currentVerb: "open",
    activeCharacter: "slot1",
    selectedInventoryItem: null,
    inventory: { slot1: [], slot2: [], slot3: [] },
    messageTimeout: null,
    player: { id: "slot1", sprite: "pj1" },
    companions: [
      { id: "slot2", sprite: "pj2" },
      { id: "slot3", sprite: "pj3" },
    ],
  };
}

function interact(obj, state, mapData, mapName = "map_mailbox") {
  const actionLine = { textContent: "" };
  InteractionManager.handleObjectInteraction(
    obj,
    state,
    actionLine,
    mapName,
    mapData,
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => VerbManager.getLabel(verb),
    () => {},
  );
  return actionLine;
}

GameState.maps = {};
GameVariables.initialize(true);
const first = createMailboxObjects();
const firstMap = createMap(first.objects);
StatefulObjectManager.applyObjectStates(first.objects);

assert.equal(first.mailbox.state, "cerrado");
assert.equal(first.mailbox.sprite, "!buzon1_Cerrado.png");
assert.equal(first.mailbox.spriteWidth, 28);
assert.equal(first.mailbox.spriteHeight, 45);
assert.equal(first.mailbox.hitboxWidth, 48);
assert.equal(first.mailbox.hitboxHeight, 60);
assert.equal(first.key.visible, false);
assert.equal(first.unrelatedKey.visible, true);
assert.equal(InteractionManager.getObjectAt(61, 49, firstMap), first.mailbox);
assert.equal(PathfindingManager.findInteractionTileForObject(first.key, firstMap), null);
assert.equal(
  InventoryManager.handlePickUp(first.key, createState(), { textContent: "" }, "map_mailbox"),
  false,
);

const viewState = createState();
viewState.currentVerb = "what is";
assert.equal(
  interact(first.mailbox, viewState, firstMap).textContent,
  "Es un buzón típico americano",
);

const state = createState();
let actionLine = interact(first.mailbox, state, firstMap);
assert.equal(first.mailbox.state, "abierto");
assert.equal(first.mailbox.sprite, "!buzon2_Abierto.png");
assert.equal(first.mailbox.spriteWidth, 28);
assert.equal(first.mailbox.spriteHeight, 45);
assert.equal(first.key.visible, true);
assert.equal(InteractionManager.getObjectAt(61, 49, firstMap), first.key);
assert.equal(GameVariables.get("buzonAbierto"), true);
assert.equal(actionLine.textContent, "Has abierto el buzón.");
assert.equal(renderCount, 1);

state.currentVerb = "open";
assert.equal(
  interact(first.mailbox, state, firstMap).textContent,
  "El buzón ya está abierto.",
);

// El estado persistido se aplica a una carga nueva del mismo mapa.
const reloaded = createMailboxObjects();
DoorManager.applyPersistentObjectStates("map_mailbox", reloaded.objects);
StatefulObjectManager.applyObjectStates(reloaded.objects);
assert.equal(reloaded.mailbox.state, "abierto");
assert.equal(reloaded.mailbox.sprite, "!buzon2_Abierto.png");
assert.equal(reloaded.key.visible, true);

state.currentVerb = "close";
actionLine = interact(first.mailbox, state, firstMap);
assert.equal(first.mailbox.state, "cerrado");
assert.equal(first.mailbox.sprite, "!buzon1_Cerrado.png");
assert.equal(first.key.visible, false);
assert.equal(GameVariables.get("buzonAbierto"), false);
assert.equal(actionLine.textContent, "Has cerrado el buzón.");

state.currentVerb = "close";
assert.equal(
  interact(first.mailbox, state, firstMap).textContent,
  "El buzón ya está cerrado.",
);

state.currentVerb = "open";
interact(first.mailbox, state, firstMap);
const pickupActionLine = { textContent: "" };
InventoryManager.handlePickUp(first.key, state, pickupActionLine, "map_mailbox");
assert.equal(state.inventory.slot1[0].typeId, "key");
assert.equal("worldRenderWidth" in state.inventory.slot1[0], false);
assert.equal("worldRenderHeight" in state.inventory.slot1[0], false);
assert.equal(first.key.collected, true);
assert.equal(first.key.visible, false);
assert.equal(GameVariables.get("tenemosLlave"), true);

StatefulObjectManager.setObjectState(first.mailbox, "cerrado", first.objects, "map_mailbox");
StatefulObjectManager.setObjectState(first.mailbox, "abierto", first.objects, "map_mailbox");
assert.equal(first.key.visible, false);
assert.equal(first.key.collected, true);
assert.equal(state.inventory.slot1.filter(Boolean).length, 1);

// Con inventario lleno la recogida no altera la llave ni la variable global.
GameVariables.initialize(true);
const full = createMailboxObjects("full");
const fullMap = createMap(full.objects);
StatefulObjectManager.applyObjectStates(full.objects);
StatefulObjectManager.setObjectState(full.mailbox, "abierto", full.objects, "map_full");
const fullState = createState();
fullState.inventory.slot1 = Array.from({ length: 16 }, (_, index) => ({
  id: `full_${index}`,
  typeId: `full_${index}`,
}));
const fullActionLine = { textContent: "" };
InventoryManager.handlePickUp(full.key, fullState, fullActionLine, "map_full");
assert.equal(fullActionLine.textContent, "El inventario está lleno");
assert.equal(full.key.collected, false);
assert.equal(full.key.visible, true);
assert.equal(GameVariables.get("tenemosLlave"), false);
assert.equal(full.unrelatedKey.visible, true);

// Abrir, cerrar y recoger conservan la misma casilla estricta a la izquierda
// y solo se ejecutan cuando PlayerController finaliza la ruta.
load("js/game/events.js");
load("js/game/movement.js");
load("js/game/player_controller.js");
const deferred = createMailboxObjects("deferred");
const deferredMap = createMap(deferred.objects);
StatefulObjectManager.applyObjectStates(deferred.objects);
const expectedLeftTile = { col: 1, row: 3 };
assert.deepEqual(
  PathfindingManager.findInteractionTileForObject(
    deferred.mailbox,
    deferredMap,
  ),
  expectedLeftTile,
);

function createDeferredState(verb) {
  const deferredState = createState();
  deferredState.currentVerb = verb;
  deferredState.target = { active: false, x: 0, y: 0 };
  deferredState.path = [];
  deferredState.pathIndex = 0;
  deferredState.pendingInteraction = null;
  deferredState.pendingHotspot = null;
  deferredState.pendingNpc = null;
  deferredState.pendingNpcDistance = null;
  deferredState.pendingTeleport = null;
  Object.assign(deferredState.player, {
    x: 12,
    y: 112.5,
    speed: 180,
    direction: "left",
    moving: false,
  });
  return deferredState;
}

function prepareDeferredInteraction(target, deferredState, mapData) {
  return EventsManager.prepareObjectInteraction(
    target,
    deferredState,
    { textContent: "" },
    () => mapData,
    () => deferredState.player,
    6,
  );
}

function updateDeferredInteraction(deferredState, mapData) {
  PlayerController.updatePlayerByPath(1, {
    state: deferredState,
    mapData,
    actionLine: { textContent: "" },
    currentMapName: "map_deferred",
    ctx: {},
    canvas: {},
    mapImageLoaded: true,
    mapImage: {},
    objectSprites: {},
    playerSprites: {},
    foregroundGraphicSprites: {},
    npcSprites: {},
    MAP_SCALE: 1,
    PLAYER_SCALE: 1,
    FRAME_WIDTH: 24,
    FRAME_HEIGHT: 60,
    FOOT_OFFSET_Y: 6,
    TARGET_REACHED_DIST: 5,
    getVerbLabel: (verb) => VerbManager.getLabel(verb),
    getActiveCharacter: () => deferredState.player,
    changeMap() {},
  });
}

const deferredOpenState = createDeferredState("open");
assert.equal(
  prepareDeferredInteraction(
    deferred.mailbox,
    deferredOpenState,
    deferredMap,
  ),
  true,
);
assert.equal(deferred.mailbox.state, "cerrado");
updateDeferredInteraction(deferredOpenState, deferredMap);
assert.equal(deferred.mailbox.state, "cerrado");
updateDeferredInteraction(deferredOpenState, deferredMap);
assert.equal(deferred.mailbox.state, "abierto");
assert.equal(deferredOpenState.player.direction, "right");
assert.deepEqual(
  PathfindingManager.findInteractionTileForObject(deferred.key, deferredMap),
  expectedLeftTile,
);

const deferredCloseState = createDeferredState("close");
assert.equal(
  prepareDeferredInteraction(
    deferred.mailbox,
    deferredCloseState,
    deferredMap,
  ),
  true,
);
updateDeferredInteraction(deferredCloseState, deferredMap);
assert.equal(deferred.mailbox.state, "abierto");
updateDeferredInteraction(deferredCloseState, deferredMap);
assert.equal(deferred.mailbox.state, "cerrado");
assert.equal(deferredCloseState.player.direction, "right");

StatefulObjectManager.setObjectState(
  deferred.mailbox,
  "abierto",
  deferred.objects,
  "map_deferred",
);
const deferredPickupState = createDeferredState("pick up");
assert.equal(
  prepareDeferredInteraction(deferred.key, deferredPickupState, deferredMap),
  true,
);
updateDeferredInteraction(deferredPickupState, deferredMap);
assert.equal(deferred.key.collected, false);
updateDeferredInteraction(deferredPickupState, deferredMap);
assert.equal(deferred.key.collected, true);
assert.equal(deferredPickupState.player.direction, "right");
assert.equal(deferredPickupState.inventory.slot1[0].typeId, "key");

const blocked = createMailboxObjects("blocked");
const blockedMap = createMap(blocked.objects);
StatefulObjectManager.applyObjectStates(blocked.objects);
blockedMap.walkable[3][1] = 0;
const blockedState = createDeferredState("open");
assert.equal(
  prepareDeferredInteraction(blocked.mailbox, blockedState, blockedMap),
  false,
);
assert.equal(blockedState.pendingInteraction, null);
assert.equal(blocked.mailbox.state, "cerrado");

for (const spriteName of ["!buzon1_Cerrado.png", "!buzon2_Abierto.png"]) {
  const png = fs.readFileSync(`img/objects/${spriteName}`);
  assert.equal(png.readUInt32BE(16), 28);
  assert.equal(png.readUInt32BE(20), 45);
}

// Orden de dibujo reutilizable: normales primero y prioritarios después.
load("js/game/render.js");
const drawOrder = [];
const drawCalls = [];
const renderContext = {
  drawImage(sprite, x, y, width, height) {
    drawOrder.push(sprite.id);
    drawCalls.push({ sprite: sprite.id, x, y, width, height });
  },
};
const normalObject = {
  id: "normal",
  typeId: "006",
  visible: true,
  collected: false,
  sprite: "normal.png",
  x: 0,
  y: 0,
  spriteWidth: 10,
  spriteHeight: 10,
  hitboxWidth: 10,
  hitboxHeight: 10,
};
const topObject = {
  ...normalObject,
  id: "top",
  typeId: "006",
  sprite: "top.png",
  alwaysOnTop: true,
};
RenderManager.drawObjects(
  renderContext,
  { objects: [topObject, normalObject] },
  { "normal.png": { id: "normal" }, "top.png": { id: "top" } },
  { camera: { x: 0, y: 0 } },
  1,
);
assert.deepEqual(drawOrder, ["normal", "top"]);
assert.equal(
  InteractionManager.getObjectAt(5, 5, { objects: [topObject, normalObject] }),
  topObject,
);

topObject.visible = false;
drawOrder.length = 0;
RenderManager.drawObjects(
  renderContext,
  { objects: [topObject, normalObject] },
  { "normal.png": { id: "normal" }, "top.png": { id: "top" } },
  { camera: { x: 0, y: 0 } },
  1,
);
assert.deepEqual(drawOrder, ["normal"]);
assert.equal(
  InteractionManager.getObjectAt(5, 5, { objects: [topObject, normalObject] }),
  normalObject,
);
topObject.visible = true;
topObject.alwaysOnTop = false;
assert.equal(StatefulObjectManager.isAlwaysOnTop(topObject), false);

const worldKey = {
  ...normalObject,
  id: "world_key",
  typeId: "key",
  sprite: "key.png",
  x: 20,
  y: 30,
};
drawOrder.length = 0;
drawCalls.length = 0;
RenderManager.drawObjects(
  renderContext,
  { objects: [worldKey] },
  { "key.png": { id: "key" } },
  { camera: { x: 0, y: 0 } },
  1,
);
assert.deepEqual(drawCalls[0], {
  sprite: "key",
  x: 20,
  y: 30,
  width: 8,
  height: 10,
});
assert.equal(
  InteractionManager.getObjectAt(27, 39, { objects: [worldKey] }),
  worldKey,
);
assert.equal(
  InteractionManager.getObjectAt(29, 35, { objects: [worldKey] }),
  null,
);

const inventoryKeyElement = InventoryManager.createInventoryItemElement({
  sprite: "001_key.png",
});
assert.equal(inventoryKeyElement.src, "./img/objects/001_key.png");
assert.equal(inventoryKeyElement.width, undefined);
assert.equal(inventoryKeyElement.height, undefined);

const editorSource = fs.readFileSync("js/editor.js", "utf8");
const indexSource = fs.readFileSync("index.html", "utf8");
assert.match(editorSource, /inspector-contained-object-id/);
assert.match(editorSource, /containedObjectId/);
assert.match(editorSource, /stateSprites/);
assert.match(editorSource, /inspector-always-on-top/);
assert.match(editorSource, /Siempre por encima/);
assert.match(editorSource, /getEditorObjectsInDrawOrder/);
assert.match(editorSource, /alwaysOnTop/);
assert.match(editorSource, /getEditorWorldRenderSize/);
assert.match(editorSource, /worldRenderWidth/);
assert.match(indexSource, /js\/game\/object_states\.js/);

console.log("Stateful mailbox, linked key and persistence: OK");
