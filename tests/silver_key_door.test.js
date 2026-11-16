const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

load("js/catalogs/objects.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/doors.js");
load("js/game/inventory.js");
load("js/game/chest.js");
global.NpcManager = {
  getBlockingNpcForObject() { return null; },
  isPointBlockedByNpc() { return false; },
};
load("js/game/world.js");
load("js/game/movement.js");
load("js/game/pathfinding.js");
load("js/game/interactions.js");
load("js/game/events.js");

EventsManager.selectDefaultVerb = (state, actionLine) => {
  InventoryManager.clearSelectedInventoryItem(state, actionLine);
  state.currentVerb = "Walk to";
};
global.RenderManager = { render() {} };
InventoryManager.refreshInventoryUI = () => {};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createState() {
  return {
    currentVerb: "Walk to",
    selectedInventoryItem: null,
    inventory: {
      slot1: InventoryManager.createEmptyInventory(),
      slot2: InventoryManager.createEmptyInventory(),
      slot3: InventoryManager.createEmptyInventory(),
    },
    activeCharacter: "slot1",
    target: { active: false, x: 0, y: 0 },
    path: [],
    pathIndex: 0,
    pendingInteraction: null,
    pendingHotspot: null,
    pendingNpc: null,
    pendingNpcDistance: null,
    pendingTeleport: null,
    companions: [],
    player: {
      id: "slot1",
      sprite: "pj1",
      x: 30,
      y: 60,
      direction: "down",
    },
    messageTimeout: null,
  };
}

function interact(obj, state, actionLine, mapData, mapName, changeMap = () => {}) {
  return InteractionManager.handleObjectInteraction(
    obj,
    state,
    actionLine,
    mapName,
    mapData,
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => verb,
    changeMap,
  );
}

const silverKeyDefinition = ObjectLibrary.find((item) => item.id === "002");
assert.ok(silverKeyDefinition);
assert.equal(silverKeyDefinition.name, "Llave plateada");
assert.equal(silverKeyDefinition.sprite, "002_key_patio.png");
assert.equal(silverKeyDefinition.defaultSpriteWidth, 16);
assert.equal(silverKeyDefinition.defaultSpriteHeight, 16);
assert.equal(silverKeyDefinition.worldRenderWidth, 8);
assert.equal(silverKeyDefinition.worldRenderHeight, 10);
assert.equal(silverKeyDefinition.pickup, true);

const door8Definition = ObjectLibrary.find((item) => item.id === "door_8");
assert.equal(door8Definition.requiredItem, "002");
assert.equal(door8Definition.unlockOnly, undefined);
assert.equal(door8Definition.relockOnClose, false);

const map5Template = JSON.parse(fs.readFileSync("data/maps/map5.json", "utf8"));
const map6Template = JSON.parse(fs.readFileSync("data/maps/map6.json", "utf8"));
const door8 = clone(map5Template.objects.find((obj) => obj.typeId === "door_8"));
const door9 = clone(map6Template.objects.find((obj) => obj.typeId === "door_9"));
assert.ok(door8);
assert.ok(door9);
assert.equal(door8.requiredItem ?? door8Definition.requiredItem, "002");
assert.equal(door8.teleportTo, "map6");
assert.equal(door8.teleportX, 8);
assert.equal(door8.teleportY, 3);
assert.equal(door8.teleportDirection, "down");
assert.equal(door9.teleportTo, "map5");
assert.equal(door9.teleportX, 26);
assert.equal(door9.teleportY, 4);

GameState.maps = {};
GameState.doors = {};
GameState.chest = { items: [] };
DoorManager.syncDoorState(door8);
DoorManager.syncDoorState(door9);
assert.deepEqual(GameState.doors.door_pair_5, {
  opened: false,
  locked: true,
});

const state = createState();
const actionLine = { textContent: "" };
const map5 = { objects: [door8] };

state.currentVerb = "open";
interact(door8, state, actionLine, map5, "map5");
assert.equal(actionLine.textContent, "Está cerrada con llave.");
assert.equal(door8.opened, false);
assert.equal(door8.locked, true);

const ironKey = { id: "iron", typeId: "key", name: "Llave" };
state.inventory.slot1[0] = ironKey;
state.currentVerb = "use";
state.selectedInventoryItem = ironKey;
interact(door8, state, actionLine, map5, "map5");
assert.equal(actionLine.textContent, "Esta llave parece no ser de aquí");
assert.equal(door8.locked, true);

const silverKey = {
  id: "object_2",
  worldInstanceId: "map8:object_2",
  typeId: "002",
  name: "Llave plateada",
  sprite: "002_key_patio.png",
};
state.inventory.slot1[1] = silverKey;

// La identidad y el nombre sobreviven a un viaje por el Cofre Mágico.
ChestManager.reset();
assert.equal(ChestManager.storeItem(silverKey, state, actionLine), true);
assert.equal(state.inventory.slot1.includes(silverKey), false);
assert.equal(ChestManager.takeItem(silverKey, state, actionLine), true);
assert.equal(state.inventory.slot1.includes(silverKey), true);
assert.equal(silverKey.worldInstanceId, "map8:object_2");

// El clic prepara la misma ruta A* diferida que el resto de objetos.
state.currentVerb = "use";
state.selectedInventoryItem = silverKey;
const map5ForPath = {
  tileWidth: 24,
  tileHeight: 30,
  cols: 32,
  rows: 6,
  walkable: Array.from({ length: 6 }, () => Array(32).fill(1)),
  objects: [door8],
  npcs: [],
};
assert.equal(
  EventsManager.prepareObjectInteraction(
    door8,
    state,
    actionLine,
    () => map5ForPath,
    () => state.player,
    6,
  ),
  true,
);
assert.equal(state.pendingInteraction, door8);
assert.ok(state.path.length > 0);

state.currentVerb = "use";
state.selectedInventoryItem = silverKey;
let automaticTransition = null;
interact(
  door8,
  state,
  actionLine,
  map5,
  "map5",
  (...args) => { automaticTransition = args; },
);
assert.equal(actionLine.textContent, "Puerta se ha abierto.");
assert.equal(door8.opened, true);
assert.equal(door8.locked, false);
assert.equal(state.inventory.slot1.includes(silverKey), true);
assert.equal(GameState.doors.door_pair_5.opened, true);
assert.equal(GameState.doors.door_pair_5.locked, false);
assert.equal(automaticTransition, null);

// La pareja recupera el estado global al cargar cualquiera de sus caras.
const reloadedDoor8 = clone(
  map5Template.objects.find((obj) => obj.typeId === "door_8"),
);
const reloadedDoor9 = clone(
  map6Template.objects.find((obj) => obj.typeId === "door_9"),
);
DoorManager.applyPersistentObjectStates("map5", [reloadedDoor8]);
DoorManager.applyPersistentObjectStates("map6", [reloadedDoor9]);
assert.equal(reloadedDoor8.locked, false);
assert.equal(reloadedDoor9.locked, false);
assert.equal(reloadedDoor8.opened, true);
assert.equal(reloadedDoor9.opened, true);

state.activeCharacter = "slot2";
state.inventory.slot2 = InventoryManager.createEmptyInventory();
assert.equal(reloadedDoor8.opened, true);
assert.equal(reloadedDoor8.locked, false);
assert.equal(GameState.doors.door_pair_5.opened, true);

const returnDoor = clone(
  map6Template.objects.find((obj) => obj.typeId === "door_9"),
);
DoorManager.applyPersistentObjectStates("map6", [returnDoor]);
assert.equal(returnDoor.opened, true);
assert.equal(returnDoor.locked, false);

let transition = null;
state.currentVerb = "walk to";
interact(
  reloadedDoor8,
  state,
  actionLine,
  { objects: [reloadedDoor8] },
  "map5",
  (...args) => { transition = args; },
);
assert.deepEqual(transition, ["map6", 8, 3, "down"]);

transition = null;
state.currentVerb = "walk to";
interact(
  returnDoor,
  state,
  actionLine,
  { objects: [returnDoor] },
  "map6",
  (...args) => { transition = args; },
);
assert.deepEqual(transition, ["map5", 26, 4, "down"]);

// Cerrar no vuelve a bloquear esta pareja; se puede abrir otra vez sin llave.
state.currentVerb = "close";
interact(reloadedDoor8, state, actionLine, { objects: [reloadedDoor8] }, "map5");
assert.equal(reloadedDoor8.opened, false);
assert.equal(reloadedDoor8.locked, false);
state.currentVerb = "open";
interact(reloadedDoor8, state, actionLine, { objects: [reloadedDoor8] }, "map5");
assert.equal(reloadedDoor8.opened, true);

// La llave 002 no satisface los requisitos de otras puertas.
const map1 = JSON.parse(fs.readFileSync("data/maps/map1.json", "utf8"));
const door0 = clone(map1.objects.find((obj) => obj.typeId === "door_0"));
GameState.doors.door_pair_1 = { opened: false, locked: true };
DoorManager.syncDoorState(door0);
state.activeCharacter = "slot1";
state.currentVerb = "use";
state.selectedInventoryItem = silverKey;
interact(door0, state, actionLine, { objects: [door0] }, "map1");
assert.equal(door0.opened, false);
assert.equal(door0.locked, true);

state.currentVerb = "use";
state.selectedInventoryItem = ironKey;
interact(door0, state, actionLine, { objects: [door0] }, "map1");
assert.equal(door0.opened, true);
assert.equal(door0.locked, false);
assert.equal(state.inventory.slot1.includes(ironKey), true);

console.log("Silver key 002 and door_8 unlocking: OK");
