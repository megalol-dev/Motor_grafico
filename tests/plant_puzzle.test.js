const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

load("js/catalogs/objects.js");
load("js/catalogs/npcs.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/variables.js");
load("js/game/dialogues.js");
load("js/game/npcs.js");
load("js/game/inventory.js");
load("js/game/chest.js");
load("js/game/interactions.js");
load("js/game/pathfinding.js");
load("js/game/render.js");

InventoryManager.refreshInventoryUI = () => {};
global.EventsManager = {
  selectDefaultVerb(state, actionLine) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    state.currentVerb = "Walk to";
  },
};
global.DoorManager = { persistObjectState() {} };

const insecticideDefinition = ObjectLibrary.find((item) => item.id === "006");
const saladDefinition = ObjectLibrary.find((item) => item.id === "007");

assert.deepEqual(
  {
    name: insecticideDefinition.name,
    sprite: insecticideDefinition.sprite,
    description: insecticideDefinition.description,
    width: insecticideDefinition.defaultSpriteWidth,
    height: insecticideDefinition.defaultSpriteHeight,
    pickup: insecticideDefinition.pickup,
  },
  {
    name: "Insecticida",
    sprite: "006_Insecticida.png",
    description: "De la marca Kukal, lo mata todo.",
    width: 24,
    height: 30,
    pickup: true,
  },
);
assert.deepEqual(
  {
    name: saladDefinition.name,
    sprite: saladDefinition.sprite,
    description: saladDefinition.description,
    width: saladDefinition.defaultSpriteWidth,
    height: saladDefinition.defaultSpriteHeight,
    pickup: saladDefinition.pickup,
  },
  {
    name: "Ensalada",
    sprite: "007_Ensalada.png",
    description: "Es una ensalada de cera, un buen adorno.",
    width: 24,
    height: 30,
    pickup: true,
  },
);
assert.ok(VerbLibrary.some((verb) => verb.id === "talk" && verb.label === "Hablar"));
assert.match(fs.readFileSync("js/editor.js", "utf8"), /window\.ObjectLibrary\.map/);

assert.equal(GameVariables.get("plantaViva"), true);
GameVariables.set("plantaViva", false);
assert.equal(GameVariables.get("plantaViva"), false);
GameVariables.initialize();
assert.equal(GameVariables.get("plantaViva"), false);
GameVariables.initialize(true);
assert.equal(GameVariables.get("plantaViva"), true);

const plant = {
  id: "plant_test",
  typeId: "NPC_1",
  x: 48,
  y: 30,
  collision: { offsetX: 0, offsetY: 30, width: 24, height: 30 },
};

const dialogues = {
  pj1: {
    speaker: "Ryan",
    opening: "¡Cuidado! ¡Una planta carnívora!",
    plant: "¡Guaaaaargh!",
    closing: "Efectivamente, no parece buena idea acercarse.",
  },
  pj2: {
    speaker: "April",
    opening: "Qué colores tan increíbles... aunque esos dientes dan miedo.",
    plant: "¡Guaaaaargh!",
    closing: "Creo que esta planta no quiere que le haga un retrato.",
  },
  pj3: {
    speaker: "Milton",
    opening: "Interesante... Una especie carnívora. Mejor no acercarse demasiado.",
    plant: "¡Guaaaaargh!",
    closing: "Interesante... Su sistema digestivo parece bastante agresivo.",
  },
  pj4: {
    speaker: "Hank",
    opening: "¿Y si le doy un puñetazo?",
    plant: "¡Guaaaaargh!",
    closing: "¡Eh, tranquila! ¡Que yo no soy tu cena!",
  },
  pj5: {
    speaker: "Spike",
    opening: "¡Ja! Esta planta tiene más mala leche que yo.",
    plant: "¡Guaaaaargh!",
    closing: "Vale, vale... ¡Tampoco hacía falta ponerse así!",
  },
  pj6: {
    speaker: "Robin",
    opening: "Tranquila, pequeña. Sé que puedes entenderme.",
    plant: "Tengo hambre... ¡Tengo mucha hambre!",
    closing: "Tranquila, te buscaré algo de comer.",
  },
};

function createState(sprite = "pj1", activeCharacter = "slot1") {
  return {
    currentVerb: "talk",
    selectedInventoryItem: null,
    activeCharacter,
    inventory: { slot1: [], slot2: [], slot3: [] },
    player: { id: "slot1", sprite: "pj1" },
    companions: [
      { id: "slot2", sprite },
      { id: "slot3", sprite: "pj3" },
    ],
    messageTimeout: null,
  };
}

for (const [sprite, expectedDialogue] of Object.entries(dialogues)) {
  const state =
    sprite === "pj1" ? createState("pj2", "slot1") : createState(sprite, "slot2");
  const actionLine = { textContent: "" };
  const inventoryBefore = JSON.stringify(state.inventory);
  const variablesBefore = { ...GameState.variables };

  InteractionManager.handleNpcInteraction(
    plant,
    state,
    actionLine,
    (verb) => verb,
  );

  const expectedEntries = [
    { speaker: expectedDialogue.speaker, text: expectedDialogue.opening },
    { speaker: "Planta carnívora", text: expectedDialogue.plant },
    { speaker: expectedDialogue.speaker, text: expectedDialogue.closing },
  ];
  assert.equal(DialogueManager.isActive(), true);
  assert.deepEqual(DialogueManager.getCurrentEntry(), expectedEntries[0]);
  DialogueManager.advance();
  assert.deepEqual(DialogueManager.getCurrentEntry(), expectedEntries[1]);
  DialogueManager.advance();
  assert.deepEqual(DialogueManager.getCurrentEntry(), expectedEntries[2]);
  DialogueManager.advance();
  assert.equal(DialogueManager.isActive(), false);
  assert.equal(state.messageTimeout, null);
  assert.equal(state.currentVerb, "Walk to");
  assert.equal(JSON.stringify(state.inventory), inventoryBefore);
  assert.deepEqual(GameState.variables, variablesBefore);
}

const repeatState = createState("pj2", "slot1");
const repeatActionLine = { textContent: "" };
for (let attempt = 0; attempt < 2; attempt += 1) {
  repeatState.currentVerb = "talk";
  InteractionManager.handleNpcInteraction(
    plant,
    repeatState,
    repeatActionLine,
    (verb) => verb,
  );
  assert.deepEqual(DialogueManager.getCurrentEntry(), {
    speaker: "Ryan",
    text: dialogues.pj1.opening,
  });
  DialogueManager.advance();
  DialogueManager.advance();
  DialogueManager.advance();
  assert.equal(DialogueManager.isActive(), false);
}

GameVariables.set("plantaViva", false);
const absentPlantState = createState("pj2", "slot1");
InteractionManager.handleNpcInteraction(
  plant,
  absentPlantState,
  { textContent: "" },
  (verb) => verb,
);
assert.equal(DialogueManager.isActive(), false);
GameVariables.initialize(true);

function createInsecticide(id) {
  return {
    id,
    typeId: "006",
    name: "Insecticida",
    sprite: "006_Insecticida.png",
    description: insecticideDefinition.description,
  };
}

for (const sprite of ["pj1", "pj2", "pj3", "pj4", "pj5"]) {
  GameVariables.initialize(true);
  const state =
    sprite === "pj1" ? createState("pj2", "slot1") : createState(sprite, "slot2");
  const insecticide = createInsecticide(`insecticide_${sprite}`);
  const inventory = InventoryManager.getActiveInventory(state);
  const actionLine = { textContent: "" };

  state.currentVerb = "use";
  state.selectedInventoryItem = insecticide;
  assert.equal(
    InventoryManager.addInventoryItem(state, state.activeCharacter, insecticide),
    true,
  );

  InteractionManager.handleNpcInteraction(
    plant,
    state,
    actionLine,
    (verb) => verb,
  );

  assert.equal(GameVariables.get("plantaViva"), true);
  assert.equal(GameVariables.get("plantaAmiga"), false);
  assert.equal(inventory.includes(insecticide), false);
  assert.equal(state.selectedInventoryItem, null);
  assert.equal(NpcManager.isOverlayAnimationActive(plant, "insecticide"), true);
  assert.equal(NpcManager.isInsecticideEventPending(plant), true);
  assert.equal(NpcManager.isActive(plant), true);

  if (sprite === "pj1") {
    const firstFrameDraws = [];
    RenderManager.drawNpc(
      { drawImage(...args) { firstFrameDraws.push(args); } },
      plant,
      { NPC_1: {}, "NPC_1:overlay:insecticide": {} },
      { camera: { x: 0, y: 0 } },
      1,
    );
    assert.deepEqual(firstFrameDraws[1].slice(1, 5), [0, 0, 24, 60]);
    assert.deepEqual(firstFrameDraws[1].slice(5, 9), [48, 30, 24, 60]);
  }

  const keyDuringAnimation = {
    id: `key_during_${sprite}`,
    typeId: "002",
    blockedByNpcId: plant.id,
  };
  const mapDuringAnimation = {
    objects: [keyDuringAnimation],
    npcs: [plant],
  };
  assert.equal(
    NpcManager.getBlockingNpcForObject(keyDuringAnimation, mapDuringAnimation),
    plant,
  );

  if (sprite === "pj1") {
    const robinDuringAnimation = createState("pj6", "slot2");
    const robinSalad = {
      id: "robin_salad_during_insecticide",
      typeId: "007",
    };
    robinDuringAnimation.inventory.slot2.push(robinSalad);
    robinDuringAnimation.selectedInventoryItem = robinSalad;
    assert.equal(
      InteractionManager.handlePlantSalad(
        plant,
        robinDuringAnimation,
        { textContent: "" },
      ),
      true,
    );
    assert.equal(robinDuringAnimation.inventory.slot2.includes(robinSalad), true);
    assert.equal(GameVariables.get("plantaAmiga"), false);
    assert.equal(
      NpcManager.isOverlayAnimationActive(plant, "insecticide"),
      true,
    );
  }

  // Ni una llamada duplicada ni la ruta de amistad pueden alterar el evento.
  state.selectedInventoryItem = insecticide;
  assert.equal(
    InteractionManager.handlePlantInsecticide(plant, state, actionLine),
    true,
  );
  assert.equal(inventory.filter((item) => item === insecticide).length, 0);
  const saladDuringAnimation = {
    id: `salad_during_${sprite}`,
    typeId: "007",
  };
  state.selectedInventoryItem = saladDuringAnimation;
  assert.equal(
    InteractionManager.handlePlantSalad(plant, state, actionLine),
    true,
  );
  state.selectedInventoryItem = null;

  NpcManager.updateAnimations([plant], 2.499);
  assert.equal(plant._overlayAnimationFrame, 0);
  assert.equal(GameVariables.get("plantaViva"), true);
  NpcManager.updateAnimations([plant], 0.001);
  assert.equal(plant._overlayAnimationFrame, 1);
  NpcManager.updateAnimations([plant], 2.5);
  assert.equal(plant._overlayAnimationFrame, 2);
  NpcManager.updateAnimations([plant], 2.5);
  assert.equal(plant._overlayAnimationFrame, 3);
  NpcManager.updateAnimations([plant], 2.499);
  assert.equal(plant._overlayAnimationFrame, 3);
  assert.equal(GameVariables.get("plantaViva"), true);
  assert.equal(NpcManager.isActive(plant), true);
  assert.equal(
    inventory.some((item) => item?.id === "NPC_1_friend"),
    false,
  );
  assert.equal(
    NpcManager.getBlockingNpcForObject(keyDuringAnimation, mapDuringAnimation),
    plant,
  );

  // El último fotograma completa sus 2500 ms antes de finalizar.
  NpcManager.updateAnimations([], 0.001);
  assert.equal(actionLine.textContent, "La planta murió.");
  assert.equal(GameVariables.get("plantaViva"), false);
  assert.equal(GameVariables.get("plantaAmiga"), false);
  assert.equal(NpcManager.isOverlayAnimationActive(plant), false);
  assert.equal(NpcManager.isInsecticideEventPending(plant), false);
  assert.equal(NpcManager.isActive(plant), false);
  assert.equal(
    NpcManager.getBlockingNpcForObject(keyDuringAnimation, mapDuringAnimation),
    null,
  );
  NpcManager.updateAnimations([], 10);
  assert.equal(GameVariables.get("plantaViva"), false);
}

// La ruta del insecticida no contamina futuras transferencias del cofre.
ChestManager.reset();
const postInsecticideState = createState("pj2", "slot1");
const postInsecticideBar = {
  id: "object_2",
  worldInstanceId: "map7:object_2",
  typeId: "028",
  name: "Barra de metal",
  sprite: "028_Barra.png",
};
assert.equal(
  InventoryManager.addInventoryItem(
    postInsecticideState,
    "slot1",
    postInsecticideBar,
  ),
  true,
);
assert.equal(
  ChestManager.storeItem(
    postInsecticideBar,
    postInsecticideState,
    { textContent: "" },
  ),
  true,
);
assert.equal(
  ChestManager.takeItem(postInsecticideBar, postInsecticideState),
  true,
);
assert.equal(postInsecticideState.inventory.slot1[0], postInsecticideBar);
assert.equal(GameVariables.get("plantaViva"), false);

const deadRouteKey = {
  id: "patio_key_after_insecticide",
  typeId: "002",
  type: "item",
  name: "Llave plateada",
  description: "Una llave del patio.",
  sprite: "002_key_patio.png",
  pickup: true,
  visible: true,
  collected: false,
  blockedByNpcId: plant.id,
};
const deadRouteMap = { objects: [deadRouteKey], npcs: [plant] };
assert.equal(NpcManager.getBlockingNpcForObject(deadRouteKey, deadRouteMap), null);
postInsecticideState.currentVerb = "pick up";
assert.equal(
  InteractionManager.handleObjectInteraction(
    deadRouteKey,
    postInsecticideState,
    { textContent: "" },
    "map8",
    deadRouteMap,
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => verb,
    () => {},
  ),
  true,
);
assert.equal(postInsecticideState.inventory.slot1[1].typeId, "002");
assert.equal(deadRouteKey.collected, true);

GameVariables.initialize(true);
const robinState = createState("pj6", "slot2");
const robinInsecticide = createInsecticide("insecticide_robin");
const robinInventory = InventoryManager.getActiveInventory(robinState);
const robinActionLine = { textContent: "" };
assert.equal(
  InventoryManager.addInventoryItem(
    robinState,
    robinState.activeCharacter,
    robinInsecticide,
  ),
  true,
);
robinState.currentVerb = "use";
robinState.selectedInventoryItem = robinInsecticide;

InteractionManager.handleNpcInteraction(
  plant,
  robinState,
  robinActionLine,
  (verb) => verb,
);

assert.equal(
  robinActionLine.textContent,
  "¡No pienso hacerle daño a una planta!",
);
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(robinInventory.includes(robinInsecticide), true);
assert.equal(robinState.selectedInventoryItem, null);
assert.equal(NpcManager.isOverlayAnimationActive(plant), false);

const mapData = {
  tileWidth: 24,
  tileHeight: 30,
  cols: 6,
  rows: 6,
  walkable: Array.from({ length: 6 }, () => Array(6).fill(1)),
  objects: [],
  npcs: [plant],
};

GameVariables.set("plantaViva", false);
assert.equal(NpcManager.isActive(plant), false);
assert.equal(NpcManager.isActive({ ...plant, id: "plant_other_map" }), false);
assert.equal(NpcManager.isPointBlockedByNpc(60, 75, mapData), false);
assert.equal(InteractionManager.getNpcAt(50, 40, mapData), null);
assert.equal(PathfindingManager.findInteractionTileForNpc(plant, mapData), null);

let npcDraws = 0;
RenderManager.drawNpc(
  { drawImage() { npcDraws += 1; } },
  plant,
  { NPC_1: {} },
  { camera: { x: 0, y: 0 } },
  1,
);
assert.equal(npcDraws, 0);

const secondInsecticide = createInsecticide("insecticide_second");
const secondState = createState("pj2", "slot1");
secondState.inventory.slot1.push(secondInsecticide);
secondState.currentVerb = "use";
secondState.selectedInventoryItem = secondInsecticide;
InteractionManager.handleNpcInteraction(
  plant,
  secondState,
  { textContent: "" },
  (verb) => verb,
);
assert.equal(secondState.inventory.slot1.includes(secondInsecticide), true);
assert.equal(GameVariables.get("plantaViva"), false);

GameVariables.initialize(true);
global.document = { querySelectorAll: () => [] };
load("js/game/events.js");
const cancelledState = createState("pj2", "slot1");
const cancelledInsecticide = createInsecticide("insecticide_cancelled");
cancelledState.inventory.slot1.push(cancelledInsecticide);
cancelledState.selectedInventoryItem = cancelledInsecticide;
cancelledState.pendingNpc = plant;
EventsManager.cancelPendingInteractions(cancelledState);
InventoryManager.clearSelectedInventoryItem(cancelledState, { textContent: "" });
assert.equal(cancelledState.pendingNpc, null);
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(cancelledState.inventory.slot1.includes(cancelledInsecticide), true);

const otherObjectState = createState("pj2", "slot1");
const otherObjectInsecticide = createInsecticide("insecticide_other_object");
otherObjectState.inventory.slot1.push(otherObjectInsecticide);
otherObjectState.currentVerb = "use";
otherObjectState.selectedInventoryItem = otherObjectInsecticide;
InteractionManager.handleObjectInteraction(
  { id: "pot", typeId: "flowerpot", type: "item", name: "Maceta" },
  otherObjectState,
  { textContent: "" },
  "map_test",
  { objects: [] },
  {}, {}, true, {}, {}, {}, {}, {},
  1, 1, 24, 60,
  (verb) => verb,
  () => {},
);
assert.equal(
  otherObjectState.inventory.slot1.includes(otherObjectInsecticide),
  true,
);
assert.equal(otherObjectState.selectedInventoryItem, null);

console.log("Plant dialogue, variables and insecticide puzzle: OK");
