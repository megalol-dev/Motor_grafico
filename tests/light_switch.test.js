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
    this.classList = { add() {}, remove() {}, contains() { return false; } };
  }

  addEventListener() {}
  appendChild(child) { this.children.push(child); }
  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }
}

const inventorySlots = Array.from({ length: 16 }, () => new FakeElement());
global.document = {
  createElement() { return new FakeElement(); },
  querySelectorAll(selector) {
    return selector === ".inventory-slot" ? inventorySlots : [];
  },
};

global.ChestManager = { open() {}, isOpen() { return false; } };
global.DialogueManager = { isActive() { return false; } };
global.NpcManager = {
  isPointBlockedByNpc() { return false; },
  getBlockingNpcForObject() { return null; },
  getLibraryItem() { return { name: "NPC", description: "NPC" }; },
  isActive() { return true; },
};

load("js/catalogs/objects.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/variables.js");
load("js/game/doors.js");
load("js/game/object_states.js");
load("js/game/inventory.js");
load("js/game/world.js");
load("js/game/movement.js");
load("js/game/pathfinding.js");
load("js/game/interactions.js");
load("js/game/render.js");
load("js/game/events.js");
load("js/game/player_controller.js");

const switchDefinition = ObjectLibrary.find(
  (item) => item.id === "!interruptor",
);
const mailboxDefinition = ObjectLibrary.find((item) => item.id === "!buzon");
assert.ok(switchDefinition);
assert.equal(switchDefinition.type, "stateful");
assert.equal(switchDefinition.defaultState, "apagado");
assert.equal(switchDefinition.stateSprites.apagado, "!Interruptor1.png");
assert.equal(switchDefinition.stateSprites.encendido, "!Interruptor2.png");
assert.equal(switchDefinition.defaultSpriteWidth, 24);
assert.equal(switchDefinition.defaultSpriteHeight, 30);
assert.equal(switchDefinition.defaultHitboxWidth, 24);
assert.equal(switchDefinition.defaultHitboxHeight, 30);
assert.equal(switchDefinition.pickup, false);
assert.ok(
  ObjectLibrary.indexOf(switchDefinition) ===
    ObjectLibrary.indexOf(mailboxDefinition) + 1,
);

for (const spriteName of ["!Interruptor1.png", "!Interruptor2.png"]) {
  const png = fs.readFileSync(`img/objects/${spriteName}`);
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 24);
  assert.equal(png.readUInt32BE(20), 30);
}

function createSwitch(state) {
  return {
    id: "light_switch_test",
    typeId: "!interruptor",
    type: "stateful",
    name: switchDefinition.name,
    description: switchDefinition.description,
    sprite: switchDefinition.sprite,
    state,
    stateSprites: { ...switchDefinition.stateSprites },
    x: 48,
    y: 30,
    spriteWidth: 24,
    spriteHeight: 30,
    hitboxWidth: 24,
    hitboxHeight: 30,
    pickup: false,
    solid: true,
    visible: true,
    collected: false,
  };
}

function createMap(objects) {
  return {
    tileWidth: 24,
    tileHeight: 30,
    cols: 12,
    rows: 8,
    walkable: Array.from({ length: 8 }, () => Array(12).fill(1)),
    objects,
    hotspots: [],
    npcs: [],
    foregroundGraphics: [],
  };
}

function createState() {
  return {
    currentVerb: "Walk to",
    activeCharacter: "slot1",
    selectedInventoryItem: null,
    inventory: { slot1: [], slot2: [], slot3: [] },
    target: { active: false, x: 0, y: 0 },
    path: [],
    pathIndex: 0,
    pendingInteraction: null,
    pendingHotspot: null,
    pendingNpc: null,
    pendingNpcDistance: null,
    pendingTeleport: null,
    messageTimeout: null,
    camera: { x: 0, y: 0 },
    player: {
      id: "slot1",
      sprite: "pj1",
      currentMap: "map4",
      x: 12,
      y: 112.5,
      width: 24,
      height: 60,
      speed: 180,
      direction: "down",
      moving: false,
      animFrame: 0,
    },
    companions: [],
  };
}

function createRenderContext() {
  const calls = [];
  return {
    calls,
    clearRect() { calls.push({ kind: "clear" }); },
    fillRect(x, y, width, height) {
      calls.push({ kind: "fill", fillStyle: this.fillStyle, x, y, width, height });
    },
    drawImage(sprite) { calls.push({ kind: "image", sprite }); },
  };
}

function render(mapData, state, ctx = createRenderContext()) {
  RenderManager.render(
    ctx,
    { width: 960, height: 540 },
    true,
    { id: "map" },
    state,
    mapData,
    {
      "!Interruptor1.png": { id: "switch-off" },
      "!Interruptor2.png": { id: "switch-on" },
      "pickup.png": { id: "pickup" },
    },
    { pj1: { id: "player" } },
    1,
    1,
    24,
    60,
    state.player,
    {},
    {},
  );
  return ctx;
}

function interact(obj, state, mapData, actionLine, ctx = createRenderContext()) {
  return InteractionManager.handleObjectInteraction(
    obj,
    state,
    actionLine,
    "map4",
    mapData,
    ctx,
    { width: 960, height: 540 },
    true,
    { id: "map" },
    {
      "!Interruptor1.png": { id: "switch-off" },
      "!Interruptor2.png": { id: "switch-on" },
      "pickup.png": { id: "pickup" },
    },
    { pj1: { id: "player" } },
    {},
    {},
    1,
    1,
    24,
    60,
    (verb) => VerbManager.getLabel(verb),
    () => {},
  );
}

GameState.maps = {};
const lightSwitch = createSwitch();
const otherObject = {
  id: "pickup_test",
  typeId: "006",
  type: "item",
  name: "Objeto",
  description: "Objeto",
  sprite: "pickup.png",
  x: 120,
  y: 30,
  spriteWidth: 24,
  spriteHeight: 30,
  hitboxWidth: 24,
  hitboxHeight: 30,
  pickup: true,
  visible: true,
  collected: false,
};
const map4 = createMap([lightSwitch, otherObject]);
StatefulObjectManager.applyObjectStates(map4.objects);
assert.equal(lightSwitch.state, "apagado");
assert.equal(lightSwitch.sprite, "!Interruptor1.png");
assert.equal(StatefulObjectManager.isMapDark("map4", map4), true);
assert.equal(StatefulObjectManager.isMapDark("map3", map4), false);
assert.equal(StatefulObjectManager.isMapDark("map4", createMap([])), false);

const darkState = createState();
const darkRender = render(map4, darkState);
const darknessIndex = darkRender.calls.findIndex((call) => call.kind === "fill");
const darknessCall = darkRender.calls[darknessIndex];
const switchDrawIndexes = darkRender.calls
  .map((call, index) => call.sprite?.id === "switch-off" ? index : -1)
  .filter((index) => index >= 0);
assert.equal(darknessCall.fillStyle, "rgba(0, 0, 0, 0.90)");
assert.deepEqual(switchDrawIndexes.length, 1);
assert.ok(switchDrawIndexes[0] < darknessIndex);
assert.equal(darkRender.calls.at(-1).kind, "fill");

const otherMapState = createState();
otherMapState.player.currentMap = "map3";
const otherMapRender = render(map4, otherMapState);
assert.equal(otherMapRender.calls.some((call) => call.kind === "fill"), false);

const blockedState = createState();
blockedState.currentVerb = "pick up";
blockedState.selectedInventoryItem = { id: "selected" };
blockedState.pendingInteraction = otherObject;
blockedState.pendingHotspot = { id: "hotspot" };
blockedState.pendingNpc = { id: "npc" };
blockedState.path = [{ col: 1, row: 1 }];
blockedState.target.active = true;
const blockedLine = { textContent: "" };
assert.equal(
  InteractionManager.blockInteractionInDarkness(
    otherObject,
    blockedState,
    blockedLine,
    "map4",
    map4,
  ),
  true,
);
assert.equal(blockedLine.textContent, "Está muy oscuro, no veo nada.");
assert.equal(blockedState.currentVerb, "Walk to");
assert.equal(blockedState.selectedInventoryItem, null);
assert.deepEqual(blockedState.path, []);
assert.equal(blockedState.target.active, false);
assert.equal(blockedState.pendingInteraction, null);
assert.equal(blockedState.pendingHotspot, null);
assert.equal(blockedState.pendingNpc, null);

for (const verb of ["use", "turn on", "turn off"]) {
  const state = createState();
  state.currentVerb = verb;
  assert.equal(
    InteractionManager.blockInteractionInDarkness(
      lightSwitch,
      state,
      { textContent: "" },
      "map4",
      map4,
    ),
    false,
  );
}

const blockedSwitchViewState = createState();
blockedSwitchViewState.currentVerb = "what is";
const blockedSwitchViewLine = { textContent: "" };
assert.equal(
  InteractionManager.blockInteractionInDarkness(
    lightSwitch,
    blockedSwitchViewState,
    blockedSwitchViewLine,
    "map4",
    map4,
  ),
  true,
);
assert.equal(
  blockedSwitchViewLine.textContent,
  "Está muy oscuro, no veo nada.",
);

for (const target of [{ typeId: "hotspot" }, { typeId: "NPC_1" }]) {
  const state = createState();
  const actionLine = { textContent: "" };
  assert.equal(
    InteractionManager.blockInteractionInDarkness(
      target,
      state,
      actionLine,
      "map4",
      map4,
    ),
    true,
  );
  assert.equal(actionLine.textContent, "Está muy oscuro, no veo nada.");
}

const walkingState = createState();
EventsManager.handleGroundClick(
  { x: 180, y: 120 },
  walkingState,
  { textContent: "" },
  () => map4,
  () => walkingState.player,
  6,
  (verb) => VerbManager.getLabel(verb),
);
assert.ok(walkingState.path.length > 0);

const switchState = createState();
switchState.currentVerb = "use";
const switchLine = { textContent: "" };
assert.equal(
  EventsManager.prepareObjectInteraction(
    lightSwitch,
    switchState,
    switchLine,
    () => map4,
    () => switchState.player,
    6,
  ),
  true,
);
assert.equal(lightSwitch.state, "apagado");

const controllerContext = {
  state: switchState,
  mapData: map4,
  actionLine: switchLine,
  currentMapName: "map4",
  ctx: createRenderContext(),
  canvas: { width: 960, height: 540 },
  mapImageLoaded: true,
  mapImage: { id: "map" },
  objectSprites: {
    "!Interruptor1.png": { id: "switch-off" },
    "!Interruptor2.png": { id: "switch-on" },
  },
  playerSprites: { pj1: { id: "player" } },
  foregroundGraphicSprites: {},
  npcSprites: {},
  MAP_SCALE: 1,
  PLAYER_SCALE: 1,
  FRAME_WIDTH: 24,
  FRAME_HEIGHT: 60,
  FOOT_OFFSET_Y: 6,
  TARGET_REACHED_DIST: 5,
  getVerbLabel: (verb) => VerbManager.getLabel(verb),
  getActiveCharacter: () => switchState.player,
  changeMap() {},
};
for (let step = 0; step < 20 && lightSwitch.state !== "encendido"; step += 1) {
  PlayerController.updatePlayerByPath(1, controllerContext);
}
assert.equal(lightSwitch.state, "encendido");
assert.equal(lightSwitch.sprite, "!Interruptor2.png");
assert.equal(StatefulObjectManager.isMapDark("map4", map4), false);
assert.equal(switchLine.textContent, "Has encendido la luz.");
assert.equal(
  InteractionManager.blockInteractionInDarkness(
    otherObject,
    createState(),
    { textContent: "" },
    "map4",
    map4,
  ),
  false,
);

function runDeferredSwitchVerb(verb) {
  switchState.currentVerb = verb;
  switchState.messageTimeout = null;
  switchState.player.x = 12;
  switchState.player.y = 112.5;
  switchState.path = [];
  switchState.pathIndex = 0;
  switchState.pendingInteraction = null;
  switchState.target.active = false;

  assert.equal(
    EventsManager.prepareObjectInteraction(
      lightSwitch,
      switchState,
      switchLine,
      () => map4,
      () => switchState.player,
      6,
    ),
    true,
  );
  assert.equal(switchState.pendingInteraction, lightSwitch);
  assert.ok(switchState.path.length > 0);

  for (let step = 0; step < 20 && switchState.pendingInteraction; step += 1) {
    PlayerController.updatePlayerByPath(1, controllerContext);
  }
  assert.equal(switchState.pendingInteraction, null);
}

runDeferredSwitchVerb("turn on");
assert.equal(lightSwitch.state, "encendido");
assert.equal(switchLine.textContent, "Ya está encendido.");

runDeferredSwitchVerb("turn off");
assert.equal(lightSwitch.state, "apagado");
assert.equal(switchLine.textContent, "Has apagado la luz.");
assert.equal(StatefulObjectManager.isMapDark("map4", map4), true);

runDeferredSwitchVerb("turn off");
assert.equal(lightSwitch.state, "apagado");
assert.equal(switchLine.textContent, "Ya está apagado.");

runDeferredSwitchVerb("turn on");
assert.equal(lightSwitch.state, "encendido");
assert.equal(switchLine.textContent, "Has encendido la luz.");
assert.equal(StatefulObjectManager.isMapDark("map4", map4), false);

const reloadedSwitch = createSwitch();
const reloadedMap = createMap([reloadedSwitch]);
DoorManager.applyPersistentObjectStates("map4", reloadedMap.objects);
StatefulObjectManager.applyObjectStates(reloadedMap.objects);
assert.equal(reloadedSwitch.state, "encendido");
assert.equal(reloadedSwitch.sprite, "!Interruptor2.png");
assert.equal(StatefulObjectManager.isMapDark("map4", reloadedMap), false);

switchState.currentVerb = "use";
interact(lightSwitch, switchState, map4, switchLine);
assert.equal(lightSwitch.state, "apagado");
assert.equal(lightSwitch.sprite, "!Interruptor1.png");
assert.equal(StatefulObjectManager.isMapDark("map4", map4), true);
assert.equal(switchLine.textContent, "Has apagado la luz.");

const darkReloadedSwitch = createSwitch();
const darkReloadedMap = createMap([darkReloadedSwitch]);
DoorManager.applyPersistentObjectStates("map4", darkReloadedMap.objects);
StatefulObjectManager.applyObjectStates(darkReloadedMap.objects);
assert.equal(darkReloadedSwitch.state, "apagado");
assert.equal(StatefulObjectManager.isMapDark("map4", darkReloadedMap), true);

const exitDoor = {
  id: "map4_exit_test",
  typeId: "door_5",
  type: "door",
  name: "Puerta",
  description: "Es una puerta.",
  sprite: "door_5.png",
  x: 48,
  y: 90,
  spriteWidth: 24,
  spriteHeight: 71,
  hitboxWidth: 24,
  hitboxHeight: 71,
  visible: true,
  collected: false,
  pickup: false,
  locked: true,
  opened: false,
  requiredItem: null,
  doorPair: "door_pair_light_test",
  teleportTo: "map2",
  teleportX: 7,
  teleportY: 10,
  teleportDirection: "down",
  interactionMode: "inside",
  teleportMode: "inside",
  interactionTileX: 1,
  interactionTileY: 4,
};
const exitSwitch = createSwitch("apagado");
exitSwitch.id = "exit_light_switch";
exitSwitch.x = 120;
const exitMap = createMap([exitSwitch, exitDoor]);
StatefulObjectManager.applyObjectStates(exitMap.objects);
assert.equal(StatefulObjectManager.isMapDark("map4", exitMap), true);

for (const verb of ["open", "walk to", "use"]) {
  const state = createState();
  state.currentVerb = verb;
  assert.equal(
    InteractionManager.blockInteractionInDarkness(
      exitDoor,
      state,
      { textContent: "" },
      "map4",
      exitMap,
    ),
    false,
  );
}

const invalidExitVerbState = createState();
invalidExitVerbState.currentVerb = "turn on";
const invalidExitVerbLine = { textContent: "" };
assert.equal(
  InteractionManager.blockInteractionInDarkness(
    exitDoor,
    invalidExitVerbState,
    invalidExitVerbLine,
    "map4",
    exitMap,
  ),
  true,
);
assert.equal(invalidExitVerbLine.textContent, "Está muy oscuro, no veo nada.");

const fakeExit = { ...exitDoor, id: "not_in_loaded_map" };
const fakeExitState = createState();
fakeExitState.currentVerb = "open";
assert.equal(
  InteractionManager.blockInteractionInDarkness(
    fakeExit,
    fakeExitState,
    { textContent: "" },
    "map4",
    exitMap,
  ),
  true,
);

const exitState = createState();
const exitLine = { textContent: "" };
let transition = null;
const exitContext = {
  ...controllerContext,
  state: exitState,
  mapData: exitMap,
  actionLine: exitLine,
  getActiveCharacter: () => exitState.player,
  changeMap(mapName, x, y, direction) {
    transition = { mapName, x, y, direction };
    exitState.player.currentMap = mapName;
  },
};

function runDeferredExitVerb(verb) {
  exitState.currentVerb = verb;
  exitState.messageTimeout = null;
  exitState.player.currentMap = "map4";
  exitState.player.x = 12;
  exitState.player.y = 112.5;
  exitState.path = [];
  exitState.pathIndex = 0;
  exitState.pendingInteraction = null;
  exitState.target.active = false;

  assert.equal(
    EventsManager.prepareObjectInteraction(
      exitDoor,
      exitState,
      exitLine,
      () => exitMap,
      () => exitState.player,
      6,
    ),
    true,
  );
  assert.equal(exitState.pendingInteraction, exitDoor);
  assert.ok(exitState.path.length > 0);

  for (let step = 0; step < 20 && exitState.pendingInteraction; step += 1) {
    PlayerController.updatePlayerByPath(1, exitContext);
  }
  assert.equal(exitState.pendingInteraction, null);
}

runDeferredExitVerb("open");
assert.equal(exitDoor.opened, true);
assert.equal(transition, null);

runDeferredExitVerb("walk to");
assert.deepEqual(transition, {
  mapName: "map2",
  x: 7,
  y: 10,
  direction: "down",
});
const afterExitRender = render(exitMap, exitState);
assert.equal(afterExitRender.calls.some((call) => call.kind === "fill"), false);
exitState.player.currentMap = "map4";
const afterReturnRender = render(exitMap, exitState);
assert.equal(afterReturnRender.calls.some((call) => call.kind === "fill"), true);
assert.equal(exitSwitch.state, "apagado");

const lockedExit = {
  ...exitDoor,
  id: "locked_exit_test",
  typeId: "door_8",
  doorPair: "door_pair_locked_light_test",
  requiredItem: "002",
  locked: true,
  opened: false,
};
const lockedMap = createMap([createSwitch("apagado"), lockedExit]);
StatefulObjectManager.applyObjectStates(lockedMap.objects);
const lockedState = createState();
lockedState.currentVerb = "open";
const lockedLine = { textContent: "" };
interact(lockedExit, lockedState, lockedMap, lockedLine);
assert.equal(lockedExit.opened, false);
assert.equal(lockedExit.locked, true);
assert.equal(lockedLine.textContent, "Está cerrada con llave.");

const editorSource = fs.readFileSync("js/editor.js", "utf8");
assert.match(editorSource, /window\.ObjectLibrary\.map/);
assert.match(editorSource, /stateSprites/);

console.log("Map4 light switch, darkness, interaction lock and persistence: OK");
