const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

global.document = {
  querySelectorAll() {
    return [];
  },
};
global.DialogueManager = {
  isActive() {
    return false;
  },
};

load("js/catalogs/objects.js");
load("js/catalogs/npcs.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/variables.js");
load("js/game/npcs.js");
load("js/game/object_states.js");
load("js/game/inventory.js");
load("js/game/world.js");
load("js/game/movement.js");
load("js/game/pathfinding.js");
load("js/game/interactions.js");
load("js/game/events.js");

InventoryManager.refreshInventoryUI = () => {};
let persistedObjects = 0;
global.DoorManager = {
  persistObjectState() {
    persistedObjects += 1;
  },
};

const patioKeyDefinition = ObjectLibrary.find((item) => item.id === "002");
assert.ok(patioKeyDefinition);
assert.equal(patioKeyDefinition.name, "Llave plateada");
assert.equal(patioKeyDefinition.sprite, "002_key_patio.png");
assert.equal(patioKeyDefinition.pickup, true);
assert.equal(patioKeyDefinition.worldRenderWidth, 8);
assert.equal(patioKeyDefinition.worldRenderHeight, 10);
assert.equal(patioKeyDefinition.solid, undefined);
assert.equal(fs.existsSync("img/objects/002_key_patio.png"), true);

const objectsSourceBuffer = fs.readFileSync("js/catalogs/objects.js");
const objectsSource = objectsSourceBuffer.toString("utf8");
assert.equal(
  Buffer.from(objectsSource, "utf8").equals(objectsSourceBuffer),
  true,
);
assert.doesNotMatch(objectsSource, /\uFFFD/);
assert.match(
  fs.readFileSync("index.html", "utf8"),
  /<meta\s+charset=["']UTF-8["']\s*\/?>/i,
);

const expectedBlockedMessages = {
  pj1: "Primero tengo que quitar esa planta de en medio. Así no puedo alcanzar la llave.",
  pj2: "Esa planta arruina la composición. ¡No puedo alcanzar la llave!",
  pj3: "La planta bloquea el acceso. Necesito otra solución para coger la llave.",
  pj4: "¡Maldita planta! Si no se aparta, no puedo coger esa llave.",
  pj5: "¡Eh, planta dentuda! ¡Aparta, que quiero coger esa llave!",
  pj6: "Pobrecita, no quiero hacerle daño. Pero no alcanzo la llave.",
};
const maximumBlockedMessageLength = [...expectedBlockedMessages.pj1].length;
assert.deepEqual(patioKeyDefinition.blockedByNpcMessages, expectedBlockedMessages);
for (const message of Object.values(expectedBlockedMessages)) {
  assert.ok([...message].length <= maximumBlockedMessageLength);
  assert.doesNotMatch(message, /Ã|Â|â/);
}
assert.match(expectedBlockedMessages.pj1, /Así/);
assert.match(expectedBlockedMessages.pj2, /composición/);
assert.match(expectedBlockedMessages.pj3, /solución/);
assert.match(expectedBlockedMessages.pj6, /daño/);

const mainKeyDefinition = ObjectLibrary.find((item) => item.id === "key");
assert.equal(mainKeyDefinition.worldRenderWidth, 8);
assert.equal(mainKeyDefinition.worldRenderHeight, 10);

const plant = {
  id: "NPC_1_instance_1",
  typeId: "NPC_1",
  x: 96,
  y: 60,
};

function createPatioKey(id = "patio_key_instance") {
  return {
    id,
    typeId: "002",
    type: "item",
    name: patioKeyDefinition.name,
    description: patioKeyDefinition.description,
    sprite: patioKeyDefinition.sprite,
    x: 100,
    y: 70,
    spriteWidth: 16,
    spriteHeight: 16,
    hitboxWidth: 16,
    hitboxHeight: 16,
    pickup: true,
    visible: true,
    collected: false,
    blockedByNpcId: plant.id,
  };
}

function createMap(key = createPatioKey()) {
  return {
    tileWidth: 24,
    tileHeight: 30,
    cols: 10,
    rows: 10,
    walkable: Array.from({ length: 10 }, () => Array(10).fill(1)),
    objects: [key],
    npcs: [plant],
  };
}

function createState(sprite = "pj1", verb = "pick up") {
  return {
    currentVerb: verb,
    activeCharacter: "slot1",
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
      id: "slot1",
      sprite,
      x: 36,
      y: 186,
      direction: "down",
      moving: false,
    },
    companions: [],
  };
}

function executeObjectInteraction(key, state, actionLine, mapData) {
  return InteractionManager.handleObjectInteraction(
    key,
    state,
    actionLine,
    "map8",
    mapData,
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => VerbManager.getLabel(verb),
    () => {},
  );
}

GameVariables.initialize(true);
const blockedKey = createPatioKey();
const blockedMap = createMap(blockedKey);
assert.equal(blockedKey.visible, true);
assert.deepEqual(StatefulObjectManager.getWorldRenderSize(blockedKey), {
  width: 8,
  height: 10,
});
assert.equal(InteractionManager.getObjectAt(107, 79, blockedMap), blockedKey);
assert.equal(InteractionManager.getObjectAt(109, 79, blockedMap), null);
assert.equal(NpcManager.getBlockingNpcForObject(blockedKey, blockedMap), plant);
assert.deepEqual(
  PathfindingManager.findInteractionTileForObject(blockedKey, blockedMap),
  PathfindingManager.findInteractionTileForNpc(plant, blockedMap),
);

for (const verb of ["Walk to", "pick up"]) {
  const state = createState("pj1", verb);
  const actionLine = { textContent: "Sin mensaje todavía" };
  assert.equal(
    EventsManager.prepareObjectInteraction(
      blockedKey,
      state,
      actionLine,
      () => blockedMap,
      () => state.player,
      6,
    ),
    true,
  );
  assert.ok(state.path.length > 0);
  assert.equal(state.pendingInteraction, blockedKey);
  assert.equal(actionLine.textContent, "Sin mensaje todavía");

  executeObjectInteraction(blockedKey, state, actionLine, blockedMap);
  assert.equal(
    actionLine.textContent,
    patioKeyDefinition.blockedByNpcMessages.pj1,
  );
  assert.equal(state.player.direction, "up");
  assert.equal(blockedKey.collected, false);
  assert.equal(blockedKey.visible, true);
  assert.equal(InventoryManager.getInventoryItemCount(state.inventory.slot1), 0);
}

for (const sprite of ["pj1", "pj2", "pj3", "pj4", "pj5", "pj6"]) {
  const state = createState(sprite, "pick up");
  const actionLine = { textContent: "" };
  executeObjectInteraction(blockedKey, state, actionLine, blockedMap);
  assert.equal(
    actionLine.textContent,
    patioKeyDefinition.blockedByNpcMessages[sprite],
  );
  assert.equal(blockedKey.collected, false);
}
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(GameVariables.get("plantaAmiga"), false);

// Ruta de Robin: la planta sigue viva, pero ya no está activa en el mapa.
GameVariables.initialize(true);
assert.equal(GameVariables.set("plantaAmiga", true), true);
const friendRouteKey = createPatioKey("patio_key_friend_route");
const friendRouteMap = createMap(friendRouteKey);
assert.equal(
  NpcManager.getBlockingNpcForObject(friendRouteKey, friendRouteMap),
  null,
);
const friendRouteState = createState("pj2", "pick up");
assert.equal(
  executeObjectInteraction(
    friendRouteKey,
    friendRouteState,
    { textContent: "" },
    friendRouteMap,
  ),
  true,
);
assert.equal(friendRouteState.inventory.slot1[0].typeId, "002");
assert.equal(
  friendRouteState.inventory.slot1[0].worldInstanceId,
  "map8:patio_key_friend_route",
);
assert.equal("worldRenderWidth" in friendRouteState.inventory.slot1[0], false);
assert.equal("worldRenderHeight" in friendRouteState.inventory.slot1[0], false);
assert.equal(friendRouteKey.visible, false);
assert.equal(friendRouteKey.collected, true);

// Ruta del insecticida: la planta muerta tampoco bloquea la llave.
GameVariables.initialize(true);
assert.equal(GameVariables.set("plantaViva", false), false);
const deadRouteKey = createPatioKey("patio_key_dead_route");
const deadRouteMap = createMap(deadRouteKey);
assert.equal(NpcManager.getBlockingNpcForObject(deadRouteKey, deadRouteMap), null);
const deadRouteState = createState("pj3", "pick up");
assert.equal(
  executeObjectInteraction(
    deadRouteKey,
    deadRouteState,
    { textContent: "" },
    deadRouteMap,
  ),
  true,
);
assert.equal(deadRouteState.inventory.slot1[0].typeId, "002");
assert.equal(deadRouteKey.collected, true);

// Sin el vínculo exacto, otra llave 002 no queda bloqueada por este NPC.
GameVariables.initialize(true);
const unrelatedKey = createPatioKey("unrelated_key");
unrelatedKey.blockedByNpcId = null;
assert.equal(NpcManager.getBlockingNpcForObject(unrelatedKey, createMap(unrelatedKey)), null);

const fullKey = createPatioKey("patio_key_full_inventory");
const fullMap = createMap(fullKey);
GameVariables.set("plantaViva", false);
const fullState = createState("pj4", "pick up");
fullState.inventory.slot1 = Array.from({ length: 16 }, (_, index) => ({
  id: `full_${index}`,
  typeId: `full_${index}`,
}));
assert.equal(
  executeObjectInteraction(fullKey, fullState, { textContent: "" }, fullMap),
  false,
);
assert.equal(fullKey.visible, true);
assert.equal(fullKey.collected, false);

const persistedBeforeRepeat = persistedObjects;
deadRouteState.currentVerb = "pick up";
assert.equal(
  executeObjectInteraction(
    deadRouteKey,
    deadRouteState,
    { textContent: "" },
    deadRouteMap,
  ),
  false,
);
assert.equal(persistedObjects, persistedBeforeRepeat);

const editorSource = fs.readFileSync("js/editor.js", "utf8");
assert.match(editorSource, /blockedByNpcId/);
assert.match(editorSource, /inspector-blocked-by-npc-id/);

console.log("Patio key catalog, NPC blocking, deferred movement and pickup: OK");
