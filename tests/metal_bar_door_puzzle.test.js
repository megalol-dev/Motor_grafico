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
load("js/game/interactions.js");

global.EventsManager = {
  selectDefaultVerb(state, actionLine) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    state.currentVerb = "Walk to";
  },
};
global.RenderManager = { render() {} };
InventoryManager.refreshInventoryUI = () => {};

function createState() {
  return {
    currentVerb: "Walk to",
    selectedInventoryItem: null,
    inventory: { slot1: [], slot2: [] },
    activeCharacter: "slot1",
    companions: [
      { id: "slot2", x: 90, y: 120, direction: "left" },
    ],
    player: { id: "slot1", x: 30, y: 60, direction: "down" },
    messageTimeout: null,
  };
}

function interact(obj, state, actionLine, mapData, mapName) {
  InteractionManager.handleObjectInteraction(
    obj,
    state,
    actionLine,
    mapName,
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
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const metalBarDefinition = ObjectLibrary.find((item) => item.id === "028");
assert.ok(metalBarDefinition);
assert.equal(metalBarDefinition.type, "item");
assert.equal(metalBarDefinition.name, "Barra de metal");
assert.equal(metalBarDefinition.sprite, "028_Barra de metál.png");
assert.equal(metalBarDefinition.pickup, true);
assert.equal(fs.existsSync("img/objects/028_Barra de metál.png"), true);

const map2 = JSON.parse(fs.readFileSync("data/maps/map2.json", "utf8"));
const map8 = JSON.parse(fs.readFileSync("data/maps/map8.json", "utf8"));
const door14 = map2.objects.find((obj) => obj.typeId === "door_14");
const door15 = map8.objects.find((obj) => obj.typeId === "door_15");

assert.ok(door14);
assert.ok(door15);
assert.equal(door14.doorPair, "door_pair_8");
assert.equal(door15.doorPair, "door_pair_8");
assert.equal(door14.teleportTo, "map8");
assert.equal(door15.teleportTo, "map2");
assert.equal(
  InteractionManager.getObjectDescription(door14),
  "Es una puerta sin pomo.",
);

GameState.maps = {};
GameState.doors = {
  door_pair_8: { opened: true, locked: false },
};
assert.deepEqual(DoorManager.getDoorState("door_pair_8"), {
  opened: false,
  locked: true,
});

GameState.doors = {};
DoorManager.syncDoorState(door14);
DoorManager.syncDoorState(door15);

assert.deepEqual(GameState.doors.door_pair_8, {
  opened: false,
  locked: true,
});

const state = createState();
const actionLine = { textContent: "" };

state.currentVerb = "what is";
interact(door14, state, actionLine, map2, "map2");
assert.equal(actionLine.textContent, "Es una puerta sin pomo.");

state.currentVerb = "open";
interact(door14, state, actionLine, map2, "map2");
assert.equal(actionLine.textContent, "No puedo abrirla, no tiene pomo.");
assert.equal(door14.opened, false);

state.currentVerb = "open";
interact(door15, state, actionLine, map8, "map8");
assert.equal(
  actionLine.textContent,
  "No puedo abrirla, está bloqueada desde el otro lado.",
);
assert.equal(door15.opened, false);

state.currentVerb = "use";
state.selectedInventoryItem = { typeId: "028", name: "Barra de metal" };
interact(door15, state, actionLine, map8, "map8");
assert.equal(
  actionLine.textContent,
  "No puedo abrir una puerta a golpes con la barra",
);
assert.equal(state.player.direction, "down");
assert.equal(DoorManager.isDoorForcedOpen("door_pair_8"), false);

const wrongItem = { typeId: "key", name: "Llave" };
state.currentVerb = "use";
state.selectedInventoryItem = wrongItem;
interact(door14, state, actionLine, map2, "map2");
assert.equal(actionLine.textContent, "Esta llave parece no ser de aquí");
assert.equal(DoorManager.isDoorForcedOpen("door_pair_8"), false);
assert.equal(state.player.direction, "down");

const futureDoor = {
  id: "future_door",
  typeId: "future_door",
  type: "door",
  name: "Puerta futura",
};
state.currentVerb = "use";
state.selectedInventoryItem = wrongItem;
interact(futureDoor, state, actionLine, { objects: [futureDoor] }, "future_map");
assert.equal(actionLine.textContent, "Esta llave parece no ser de aquí");

const incompatibleObject = {
  id: "incompatible_object",
  typeId: "flowerpot",
  type: "item",
  name: "Maceta",
};
state.currentVerb = "use";
state.selectedInventoryItem = { typeId: "028", name: "Barra de metal" };
interact(
  incompatibleObject,
  state,
  actionLine,
  { objects: [incompatibleObject] },
  "object_map",
);
assert.equal(
  actionLine.textContent,
  "No puedo abrir una puerta a golpes con la barra",
);

const metalBar = {
  id: "metal_bar_instance",
  typeId: "028",
  name: metalBarDefinition.name,
  sprite: metalBarDefinition.sprite,
  description: metalBarDefinition.description,
};
state.inventory.slot1.push(metalBar);
state.currentVerb = "use";
state.selectedInventoryItem = metalBar;
const playerPositionBeforeBar = { x: state.player.x, y: state.player.y };
const companionDirectionBeforeBar = state.companions[0].direction;
interact(door14, state, actionLine, map2, "map2");

assert.equal(
  actionLine.textContent,
  "Con la barra de metal consigo forzar la puerta.",
);
assert.equal(DoorManager.isDoorForcedOpen("door_pair_8"), true);
assert.equal(door14.opened, true);
assert.equal(door14.locked, false);
assert.equal(state.inventory.slot1.includes(metalBar), true);
assert.equal(state.selectedInventoryItem, null);
assert.equal(state.player.direction, "right");
assert.deepEqual(
  { x: state.player.x, y: state.player.y },
  playerPositionBeforeBar,
);
assert.equal(state.companions[0].direction, companionDirectionBeforeBar);

DoorManager.syncDoorState(door15);
assert.equal(door15.opened, true);
assert.equal(door15.locked, false);

for (const [door, doorMap, mapName] of [
  [door14, map2, "map2"],
  [door15, map8, "map8"],
]) {
  state.currentVerb = "close";
  interact(door, state, actionLine, doorMap, mapName);
  assert.equal(
    actionLine.textContent,
    "La puerta ha quedado forzada y ya no se puede cerrar.",
  );
  assert.equal(door.opened, true);
}

const reloadedDoor14 = clone(
  map2.objects.find((obj) => obj.typeId === "door_14"),
);
reloadedDoor14.opened = false;
reloadedDoor14.locked = true;
DoorManager.applyPersistentObjectStates("map2", [reloadedDoor14]);
assert.equal(reloadedDoor14.opened, true);
assert.equal(reloadedDoor14.locked, false);

state.currentVerb = "use";
state.selectedInventoryItem = metalBar;
interact(reloadedDoor14, state, actionLine, { objects: [reloadedDoor14] }, "map2");
assert.equal(actionLine.textContent, "La puerta ya está abierta y forzada.");
assert.equal(state.inventory.slot1.length, 1);
assert.equal(InventoryManager.getInventoryItemCount(state.inventory.slot1), 1);
assert.equal(state.selectedInventoryItem, null);

const pickupState = createState();
const pickupActionLine = { textContent: "" };
const barOnMap = {
  id: "object_bar_test",
  typeId: "028",
  type: "item",
  name: metalBarDefinition.name,
  description: metalBarDefinition.description,
  sprite: metalBarDefinition.sprite,
  pickup: true,
  collected: false,
  visible: true,
};
InventoryManager.handlePickUp(barOnMap, pickupState, pickupActionLine, "map_test");
InventoryManager.handlePickUp(barOnMap, pickupState, pickupActionLine, "map_test");
assert.equal(barOnMap.visible, false);
assert.equal(barOnMap.collected, true);
assert.equal(pickupState.inventory.slot1.length, 16);
assert.equal(
  InventoryManager.getInventoryItemCount(pickupState.inventory.slot1),
  1,
);
assert.equal(pickupState.inventory.slot1[0].typeId, "028");
assert.equal(GameState.maps.map_test.objects.object_bar_test.collected, true);

const normalDoorDefinition = ObjectLibrary.find(
  (item) => item.id === "door_2",
);
const normalDoor = {
  ...clone(normalDoorDefinition),
  id: "normal_door_test",
  typeId: normalDoorDefinition.id,
};
const normalMap = { objects: [normalDoor] };
const normalState = createState();
const normalActionLine = { textContent: "" };

normalState.currentVerb = "open";
interact(normalDoor, normalState, normalActionLine, normalMap, "normal_map");
assert.equal(normalDoor.opened, true);

normalState.currentVerb = "close";
interact(normalDoor, normalState, normalActionLine, normalMap, "normal_map");
assert.equal(normalDoor.opened, false);

const keyedDoorDefinition = ObjectLibrary.find((item) => item.id === "door_0");
const keyedDoor = {
  ...clone(keyedDoorDefinition),
  id: "keyed_door_test",
  typeId: keyedDoorDefinition.id,
};
const keyedState = createState();
const key = { typeId: "key", name: "Llave" };
keyedState.activeCharacter = "slot2";
keyedState.inventory.slot2.push(key);
keyedState.currentVerb = "use";
keyedState.selectedInventoryItem = key;
const companionPositionBeforeKey = {
  x: keyedState.companions[0].x,
  y: keyedState.companions[0].y,
};
const playerDirectionBeforeKey = keyedState.player.direction;
interact(
  keyedDoor,
  keyedState,
  normalActionLine,
  { objects: [keyedDoor] },
  "keyed_map",
);
assert.equal(keyedDoor.opened, true);
assert.equal(keyedDoor.locked, false);
assert.equal(keyedState.inventory.slot2.includes(key), true);
assert.equal(keyedState.selectedInventoryItem, null);
assert.equal(keyedState.companions[0].direction, "up");
assert.deepEqual(
  { x: keyedState.companions[0].x, y: keyedState.companions[0].y },
  companionPositionBeforeKey,
);
assert.equal(keyedState.player.direction, playerDirectionBeforeKey);

const editorSource = fs.readFileSync("js/editor.js", "utf8");
assert.match(editorSource, /window\.ObjectLibrary\.map/);
assert.match(editorSource, /typeId:\s*libraryItem\.id/);
const eventsSource = fs.readFileSync("js/game/events.js", "utf8");
assert.match(eventsSource, /InteractionManager\.getObjectDescription/);

console.log("Metal bar and permanently forced door pair puzzle: OK");
