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

InventoryManager.refreshInventoryUI = () => {};
InteractionManager.showTemporaryMessage = (text, state, actionLine) => {
  actionLine.textContent = text;
};
global.EventsManager = {
  selectDefaultVerb(state, actionLine) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    state.currentVerb = "Walk to";
  },
};
global.DoorManager = { persistObjectState() {} };

assert.deepEqual(
  VerbLibrary.map((verb) => verb.id),
  [
    "use",
    "open",
    "close",
    "talk",
    "what is",
    "read",
    "pick up",
    "turn on",
    "turn off",
    "combine",
  ],
);
const gameCss = fs.readFileSync("css/game.css", "utf8");
assert.match(gameCss, /grid-template-columns:\s*repeat\(4,/);
assert.match(gameCss, /grid-template-rows:\s*repeat\(3,/);
assert.match(gameCss, /grid-auto-flow:\s*row/);
assert.match(
  gameCss,
  /\.verb-btn:nth-child\(8\)[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*3;/,
);
assert.match(
  gameCss,
  /\.verb-btn:nth-child\(10\)[\s\S]*?grid-column:\s*3;[\s\S]*?grid-row:\s*3;/,
);

const plantDefinition = NpcLibrary.find((npc) => npc.id === "NPC_1");
const plantItemDefinition = plantDefinition.inventoryItem;
assert.deepEqual(
  {
    id: plantItemDefinition.id,
    name: plantItemDefinition.name,
    sprite: plantItemDefinition.sprite,
    frame: plantItemDefinition.inventoryFrame,
    owner: plantItemDefinition.boundToCharacter,
    generatedInstanceId: plantItemDefinition.generatedInstanceId,
  },
  {
    id: "NPC_1_friend",
    name: "Planta carnívora",
    sprite: "NPC_1.Planta_carnivora.png",
    frame: { x: 0, y: 0, width: 24, height: 60 },
    owner: "pj6",
    generatedInstanceId: "plant_friend:pj6",
  },
);
assert.equal(ObjectLibrary.some((item) => item.id === "NPC_1_friend"), false);
for (const mapFile of fs.readdirSync("data/maps")) {
  if (!mapFile.endsWith(".json")) continue;
  assert.doesNotMatch(
    fs.readFileSync(`data/maps/${mapFile}`, "utf8"),
    /NPC_1_friend/,
  );
}

function createState(sprite, activeCharacter = "slot2") {
  return {
    currentVerb: "use",
    selectedInventoryItem: null,
    activeCharacter,
    inventory: { slot1: [], slot2: [], slot3: [] },
    player: { id: "slot1", sprite: activeCharacter === "slot1" ? sprite : "pj1" },
    companions: [
      { id: "slot2", sprite: activeCharacter === "slot2" ? sprite : "pj2" },
      { id: "slot3", sprite: activeCharacter === "slot3" ? sprite : "pj3" },
    ],
    messageTimeout: null,
  };
}

function createSalad(id = "salad_test") {
  return {
    id,
    typeId: "007",
    name: "Ensalada",
    sprite: "007_Ensalada.png",
    description: "Es una ensalada de cera, un buen adorno.",
  };
}

const plant = {
  id: "plant_friend_test",
  typeId: "NPC_1",
  x: 48,
  y: 30,
  collision: { offsetX: 0, offsetY: 30, width: 24, height: 30 },
};

GameVariables.initialize(true);
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(GameVariables.get("plantaAmiga"), false);
assert.equal(NpcManager.isActive(plant), true);
GameVariables.set("plantaViva", false);
assert.equal(GameVariables.set("plantaAmiga", true), false);
assert.equal(GameVariables.get("plantaAmiga"), false);
GameVariables.initialize(true);

const refusalMessages = {
  pj1: "No creo que sea buena idea darle esto a una planta carnívora.",
  pj2: "Prefiero conservarla. Es un adorno demasiado bonito.",
  pj3: "Su dieta es carnívora. Esta ensalada no parece una opción adecuada.",
  pj4: "¿Ensalada? ¡Esta planta necesita algo más contundente!",
  pj5: "Ni hablar. No voy a darle mi comida a esa cosa.",
};

for (const [sprite, expectedMessage] of Object.entries(refusalMessages)) {
  GameVariables.initialize(true);
  const state = createState(sprite, sprite === "pj1" ? "slot1" : "slot2");
  const salad = createSalad(`salad_${sprite}`);
  const inventory = InventoryManager.getActiveInventory(state);
  const actionLine = { textContent: "" };
  assert.equal(
    InventoryManager.addInventoryItem(state, state.activeCharacter, salad),
    true,
  );
  state.selectedInventoryItem = salad;

  InteractionManager.handleNpcInteraction(plant, state, actionLine, (verb) => verb);

  assert.equal(actionLine.textContent, expectedMessage);
  assert.equal(inventory.includes(salad), true);
  assert.equal(state.selectedInventoryItem, null);
  assert.equal(GameVariables.get("plantaViva"), true);
  assert.equal(GameVariables.get("plantaAmiga"), false);
}

GameVariables.initialize(true);
const robinState = createState("pj6");
const robinInventory = InventoryManager.getActiveInventory(robinState);
const salad = createSalad("salad_robin");
Array.from({ length: 8 }, (_, index) => ({
    id: `before_${index}`,
    typeId: `before_${index}`,
  })).forEach((item, index) => {
  robinInventory[index] = item;
});
robinInventory[8] = salad;
Array.from({ length: 7 }, (_, index) => ({
    id: `after_${index}`,
    typeId: `after_${index}`,
  })).forEach((item, index) => {
  robinInventory[index + 9] = item;
});
robinState.selectedInventoryItem = salad;
const robinActionLine = { textContent: "" };

InteractionManager.handleNpcInteraction(
  plant,
  robinState,
  robinActionLine,
  (verb) => verb,
);

assert.equal(robinInventory.length, 16);
assert.equal(robinInventory[8], salad);
assert.equal(robinInventory.includes(salad), true);
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(GameVariables.get("plantaAmiga"), false);
assert.equal(NpcManager.isActive(plant), true);
assert.equal(NpcManager.isFriendshipEventPending(plant), true);
assert.equal(NpcManager.isOverlayAnimationActive(plant, "love"), true);
assert.equal(robinState.selectedInventoryItem, null);
NpcManager.updateAnimations([plant], 1);
assert.equal(plant._overlayAnimationFrame, 1);
assert.equal(DialogueManager.isActive(), true);
assert.equal(robinInventory[8], salad);
assert.equal(robinActionLine.textContent, "Planta: ¡Oh! ¡Qué hambre tenía! ◆");
const mapData = {
  tileWidth: 24,
  tileHeight: 30,
  cols: 6,
  rows: 6,
  walkable: Array.from({ length: 6 }, () => Array(6).fill(1)),
  objects: [],
  npcs: [plant],
};
const blockedKeyDuringDialogue = {
  id: "patio_key_during_dialogue",
  typeId: "002",
  blockedByNpcId: plant.id,
};
assert.equal(
  NpcManager.getBlockingNpcForObject(blockedKeyDuringDialogue, mapData),
  plant,
);
assert.equal(InteractionManager.getNpcAt(50, 40, mapData), plant);

robinState.selectedInventoryItem = salad;
assert.equal(
  InteractionManager.handlePlantSalad(plant, robinState, robinActionLine),
  true,
);
robinState.selectedInventoryItem = null;
assert.equal(
  robinInventory.filter((item) => item?.id === "NPC_1_friend").length,
  0,
);

assert.deepEqual(DialogueManager.getCurrentEntry(), {
  speaker: "Planta",
  text: "¡Oh! ¡Qué hambre tenía!",
});
DialogueManager.advance();
assert.deepEqual(DialogueManager.getCurrentEntry(), {
  speaker: "Planta",
  text: "¡Qué rica ensalada!",
});
DialogueManager.advance();
assert.deepEqual(DialogueManager.getCurrentEntry(), {
  speaker: "Planta",
  text: "Me aburro mucho aquí en esta mansión...",
});
DialogueManager.advance();
assert.deepEqual(DialogueManager.getCurrentEntry(), {
  speaker: "Robin",
  text: "Pues vente conmigo. ¡En mi casa estarás mucho mejor!",
});
assert.equal(robinInventory[8], salad);
assert.equal(GameVariables.get("plantaAmiga"), false);
assert.equal(NpcManager.isActive(plant), true);
assert.equal(NpcManager.isOverlayAnimationActive(plant, "love"), true);

// El cierre conserva el inventario del personaje que inició el evento incluso
// si otro flujo cambia de personaje mientras el diálogo está abierto.
robinState.activeCharacter = "slot1";
DialogueManager.advance();
assert.equal(DialogueManager.isActive(), false);
assert.equal(robinInventory.includes(salad), false);
const plantItem = robinInventory[8];
assert.equal(plantItem.id, "NPC_1_friend");
assert.equal(plantItem.generatedInstanceId, "plant_friend:pj6");
assert.equal(plantItem.worldInstanceId, undefined);
assert.equal(
  InventoryManager.getItemInstanceIdentity(plantItem),
  "generated:plant_friend:pj6",
);
assert.equal(InventoryManager.isSameItemInstance(plantItem, { ...plantItem }), true);
assert.equal(plantItem.boundToCharacter, "pj6");
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(GameVariables.get("plantaAmiga"), true);
assert.equal(NpcManager.isActive(plant), false);
assert.equal(NpcManager.isFriendshipEventPending(plant), false);
assert.equal(NpcManager.isOverlayAnimationActive(plant), false);
assert.equal(
  NpcManager.getBlockingNpcForObject(blockedKeyDuringDialogue, mapData),
  null,
);
assert.equal(robinState.inventory.slot1.every((item) => item === null), true);
robinState.activeCharacter = "slot2";
assert.equal(NpcManager.isPointBlockedByNpc(60, 75, mapData), false);
assert.equal(InteractionManager.getNpcAt(50, 40, mapData), null);
assert.equal(PathfindingManager.findInteractionTileForNpc(plant, mapData), null);

assert.equal(InventoryManager.canItemLeaveInventory(plantItem), false);
assert.equal(
  InventoryManager.canCharacterReceiveItem(robinState, "slot1", plantItem),
  false,
);
assert.equal(
  InventoryManager.removeInventoryItem(
    robinState,
    "slot2",
    plantItem,
    robinActionLine,
  ),
  false,
);
robinState.selectedInventoryItem = plantItem;
assert.equal(
  InventoryManager.consumeSelectedInventoryItem(robinState, robinActionLine),
  false,
);
assert.equal(robinInventory.includes(plantItem), true);

// La planta amiga permanece con Robin y no bloquea objetos transferibles.
ChestManager.reset();
assert.equal(
  ChestManager.storeItem(plantItem, robinState, robinActionLine),
  false,
);
assert.equal(robinActionLine.textContent, "No puedo separarme de mi amiga");
assert.equal(robinInventory[8], plantItem);
assert.equal(ChestManager.getItemCount(), 0);

robinInventory[15] = null;
const robinBar = {
  id: "object_2",
  worldInstanceId: "map7:object_2",
  typeId: "028",
  name: "Barra de metal",
  sprite: "028_Barra de metÃ¡l.png",
};
assert.equal(
  InventoryManager.addInventoryItem(
    robinState,
    robinState.activeCharacter,
    robinBar,
  ),
  true,
);
assert.equal(ChestManager.storeItem(robinBar, robinState, robinActionLine), true);
assert.equal(ChestManager.getItems()[0], robinBar);
assert.equal(robinInventory.includes(robinBar), false);
assert.equal(robinInventory[8], plantItem);
assert.equal(robinState.inventory.slot1.every((item) => item === null), true);

const friendRouteKey = {
  id: "patio_key_after_friendship",
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
mapData.objects.push(friendRouteKey);
assert.equal(NpcManager.getBlockingNpcForObject(friendRouteKey, mapData), null);
robinState.currentVerb = "pick up";
assert.equal(
  InteractionManager.handleObjectInteraction(
    friendRouteKey,
    robinState,
    robinActionLine,
    "map8",
    mapData,
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => verb,
    () => {},
  ),
  true,
);
assert.equal(robinInventory.some((item) => item?.typeId === "002"), true);
assert.equal(friendRouteKey.collected, true);

const repeatSalad = createSalad("salad_repeat");
robinInventory[0] = repeatSalad;
robinState.currentVerb = "use";
robinState.selectedInventoryItem = repeatSalad;
InteractionManager.handleNpcInteraction(
  plant,
  robinState,
  robinActionLine,
  (verb) => verb,
);
assert.equal(robinInventory.includes(repeatSalad), true);
assert.equal(
  robinInventory.filter((item) => item?.id === "NPC_1_friend").length,
  1,
);

const insecticideAfterFriend = {
  id: "insecticide_after_friend",
  typeId: "006",
  name: "Insecticida",
};
robinInventory[1] = insecticideAfterFriend;
robinState.selectedInventoryItem = insecticideAfterFriend;
InteractionManager.handleNpcInteraction(
  plant,
  robinState,
  robinActionLine,
  (verb) => verb,
);
assert.equal(robinInventory.includes(insecticideAfterFriend), true);
assert.equal(GameVariables.get("plantaViva"), true);
assert.equal(GameVariables.get("plantaAmiga"), true);

GameVariables.initialize(true);
GameVariables.set("plantaViva", false);
const deadPlantState = createState("pj6");
const deadPlantSalad = createSalad("salad_dead_plant");
deadPlantState.inventory.slot2.push(deadPlantSalad);
deadPlantState.selectedInventoryItem = deadPlantSalad;
InteractionManager.handleNpcInteraction(
  plant,
  deadPlantState,
  { textContent: "" },
  (verb) => verb,
);
assert.equal(deadPlantState.inventory.slot2.includes(deadPlantSalad), true);
assert.equal(GameVariables.get("plantaViva"), false);
assert.equal(GameVariables.get("plantaAmiga"), false);

console.log("Robin and carnivorous plant friendship puzzle: OK");
