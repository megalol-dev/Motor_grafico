const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }

  toggle(name, force) {
    if (force === undefined ? !this.contains(name) : force) this.add(name);
    else this.remove(name);
  }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.dataset = {};
    this.classList = new FakeClassList();
    this.children = [];
    this.listeners = {};
    this.style = {
      setProperty(name, value) {
        this[name] = value;
      },
    };
    this.hidden = false;
    this.textContent = "";
  }

  addEventListener(type, listener) {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }

  appendChild(child) {
    this.children.push(child);
    if (child.id) elements[child.id] = child;
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  querySelector(selector) {
    return selector.startsWith("#") ? elements[selector.slice(1)] ?? null : null;
  }

  click() {
    this.listeners.click?.forEach((listener) =>
      listener({ preventDefault() {}, stopPropagation() {} }),
    );
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  getBoundingClientRect() {
    return { width: 56, height: 56 };
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

const elementIds = [
  "chest-overlay",
  "chest-title",
  "chest-storage-grid",
  "game-screen",
  "verbs-panel",
];
const elements = Object.fromEntries(
  elementIds.map((id) => [id, new FakeElement(id)]),
);
elements["chest-overlay"].hidden = true;
elements["chest-title"].textContent = "Contenido del Cofre Mágico";
const inventorySlots = Array.from({ length: 16 }, () => new FakeElement());

global.document = {
  createElement() {
    return new FakeElement();
  },
  getElementById(id) {
    return elements[id] ?? null;
  },
  querySelectorAll(selector) {
    if (selector === ".inventory-slot") return inventorySlots;
    if (selector === ".verb-btn") return [];
    if (selector === "#chest-storage-grid .chest-slot") {
      return elements["chest-storage-grid"].children.filter((child) =>
        child.className?.split(" ").includes("chest-slot"),
      );
    }
    return [];
  },
  querySelector(selector) {
    if (selector === ".inventory-slot") return inventorySlots[0];
    return null;
  },
};

global.NpcManager = {
  isPointBlockedByNpc() {
    return false;
  },
};
global.DialogueManager = {
  isActive() {
    return false;
  },
};
global.DoorManager = {
  persistObjectState() {},
};
global.EventsManager = {
  selectDefaultVerb(state, actionLine) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    state.currentVerb = "Walk to";
  },
};

load("js/catalogs/objects.js");
load("js/catalogs/verbs.js");
load("js/game/game_state.js");
load("js/game/inventory.js");
load("js/game/world.js");
load("js/game/movement.js");
load("js/game/pathfinding.js");
load("js/game/chest.js");
load("js/game/render.js");
load("js/game/interactions.js");
load("js/game/events.js");

const chestDefinition = ObjectLibrary[0];
assert.equal(chestDefinition.id, "000");
assert.equal(chestDefinition.sprite, "000_cofreMagico.png");
assert.equal(chestDefinition.pickup, false);
assert.equal(chestDefinition.transferable, false);
assert.equal(chestDefinition.solid, true);
assert.equal(ObjectLibrary[1].sprite, "001_key.png");
const patioKeyDefinition = ObjectLibrary.find((object) => object.id === "002");
assert.equal(patioKeyDefinition.sprite, "002_key_patio.png");
assert.equal(patioKeyDefinition.pickup, true);
const vhsDefinition = ObjectLibrary.find((object) => object.id === "005");
assert.deepEqual(
  {
    type: vhsDefinition.type,
    name: vhsDefinition.name,
    description: vhsDefinition.description,
    sprite: vhsDefinition.sprite,
    spriteWidth: vhsDefinition.defaultSpriteWidth,
    spriteHeight: vhsDefinition.defaultSpriteHeight,
    hitboxWidth: vhsDefinition.defaultHitboxWidth,
    hitboxHeight: vhsDefinition.defaultHitboxHeight,
    pickup: vhsDefinition.pickup,
  },
  {
    type: "item",
    name: "Cinta VHS",
    description: "Una vieja cinta VHS. Parece estar en buen estado.",
    sprite: "005_Cinta VHS.png",
    spriteWidth: 24,
    spriteHeight: 30,
    hitboxWidth: 24,
    hitboxHeight: 30,
    pickup: true,
  },
);
const vhsPng = fs.readFileSync("img/objects/005_Cinta VHS.png");
assert.equal(vhsPng.toString("ascii", 1, 4), "PNG");
assert.equal(vhsPng.readUInt32BE(16), 24);
assert.equal(vhsPng.readUInt32BE(20), 30);
assert.equal(VerbLibrary.length, 10);

const chestHtml = fs.readFileSync("index.html", "utf8");
const chestCss = fs.readFileSync("css/chest.css", "utf8");
assert.ok(chestHtml.indexOf('class="play-area"') < chestHtml.indexOf('id="chest-overlay"'));
assert.ok(chestHtml.indexOf('id="chest-overlay"') < chestHtml.indexOf('class="ui-area"'));
assert.doesNotMatch(chestHtml, /id="chest-inventory-grid"/);
assert.match(
  chestHtml,
  /id="chest-title"[\s\S]*?Contenido del Cofre Mágico/,
);
assert.doesNotMatch(chestHtml, /id="chest-message"|id="chest-mode"|id="chest-count"/);
assert.doesNotMatch(chestHtml, /id="chest-inventory-count"|id="chest-close-btn"/);
assert.doesNotMatch(chestHtml, /Contenido del cofre|Inventario:\s*<|>Cerrar</);
assert.match(chestCss, /\.chest-overlay\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;/);
assert.match(chestCss, /\.chest-window\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/);
assert.match(chestCss, /grid-template-columns:\s*repeat\(10,/);
assert.match(chestCss, /grid-template-rows:\s*repeat\(5,/);
assert.match(chestCss, /--chest-slot-width:\s*clamp\(48px,/);
assert.match(chestCss, /--chest-slot-height:\s*clamp\(38px,/);
assert.match(chestCss, /\.chest-storage-grid\s*\{[\s\S]*?background:\s*transparent/);
assert.match(chestCss, /\.chest-slot\s*\{[\s\S]*?display:\s*block;[\s\S]*?visibility:\s*visible;[\s\S]*?opacity:\s*1;[\s\S]*?width:\s*var\(--chest-slot-width\);[\s\S]*?height:\s*var\(--chest-slot-height\);[\s\S]*?border:\s*3px solid #111/);
assert.match(chestCss, /\.chest-slot:disabled\s*\{[\s\S]*?display:\s*block;[\s\S]*?visibility:\s*visible;[\s\S]*?opacity:\s*1;[\s\S]*?background:\s*#304acb/);
assert.doesNotMatch(chestCss, /\.chest-storage-grid\s*\{[\s\S]*?background:\s*rgba\(0,\s*0,\s*0/);
assert.match(chestCss, /chest-open \.verb-btn:not\(\.chest-action-btn\)[\s\S]*?display:\s*none/);
assert.match(chestCss, /:not\(\.chest-open\) \.chest-action-btn[\s\S]*?display:\s*none/);
assert.match(chestCss, /\.chest-open \.chest-action-btn[\s\S]*?display:\s*block/);
assert.match(chestCss, /#chest-store-btn\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*1;/);
assert.match(chestCss, /#chest-take-btn\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*2;/);
assert.match(chestCss, /#chest-back-btn\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*3;/);

const gameSource = fs.readFileSync("js/game.js", "utf8");
assert.ok(gameSource.indexOf("createVerbButtons();") < gameSource.indexOf("ChestManager.initialize();"));

const chestObject = {
  id: "chest_test",
  typeId: "000",
  type: "object",
  name: "Cofre Mágico",
  description: chestDefinition.description,
  x: 24,
  y: 30,
  hitboxWidth: 48,
  hitboxHeight: 60,
  visible: true,
  collected: false,
};
const mapData = {
  tileWidth: 24,
  tileHeight: 30,
  cols: 8,
  rows: 8,
  walkable: Array.from({ length: 8 }, () => Array(8).fill(1)),
  objects: [chestObject],
  npcs: [],
};

assert.equal(WorldManager.isObjectSolid(chestObject), true);
assert.equal(WorldManager.isTileBlockedByObject(2, 2, mapData), true);
assert.equal(MovementManager.isBlockedByObject(48, 60, mapData), true);
assert.deepEqual(
  PathfindingManager.findInteractionTileForObject(chestObject, mapData),
  { col: 2, row: 3 },
);
mapData.walkable[3][2] = 0;
assert.equal(
  PathfindingManager.findInteractionTileForObject(chestObject, mapData),
  null,
);
mapData.walkable[3][2] = 1;

function createState() {
  return {
    currentVerb: "use",
    activeCharacter: "slot1",
    selectedInventoryItem: null,
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
    player: { id: "slot1", sprite: "pj1", direction: "down", moving: false },
    companions: [
      { id: "slot2", sprite: "pj2", moving: false },
      { id: "slot3", sprite: "pj6", moving: false },
    ],
  };
}

function item(id, extra = {}) {
  return {
    id,
    typeId: id,
    name: id,
    description: id,
    sprite: `${id}.png`,
    ...extra,
  };
}

const state = createState();
const actionLine = { textContent: "" };

function interactWithChest(interactionState) {
  InteractionManager.handleObjectInteraction(
    chestObject,
    interactionState,
    actionLine,
    "map_test",
    mapData,
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => VerbManager.getLabel(verb),
    () => {},
  );
}

ChestManager.initialize();
ChestManager.initialize();
assert.equal(elements["chest-store-btn"].listeners.click.length, 1);
assert.equal(elements["chest-take-btn"].listeners.click.length, 1);
assert.equal(elements["chest-back-btn"].listeners.click.length, 1);
assert.equal(elements["verbs-panel"].children.length, 3);
assert.equal(elements["chest-store-btn"].classList.contains("chest-action-btn"), true);
assert.equal(elements["chest-back-btn"].textContent, "Volver al juego");
assert.equal(ChestManager.MAX_CHEST_ITEMS, 50);

const key = item("key_instance", { typeId: "key", name: "Llave" });
state.inventory.slot1.push(key);
InventoryManager.refreshInventoryUI(state, actionLine);
assert.equal(ChestManager.open(state, actionLine), true);
assert.equal(ChestManager.getMode(), "store");
assert.equal(elements["chest-overlay"].hidden, false);
assert.equal(elements["chest-title"].textContent, "Contenido del Cofre Mágico");
assert.equal(elements["game-screen"].classList.contains("chest-open"), true);
assert.equal(elements["chest-store-btn"].classList.contains("active-verb"), true);
assert.equal(elements["chest-storage-grid"].children.length, 50);
assert.equal(
  document.querySelectorAll("#chest-storage-grid .chest-slot").length,
  50,
);
assert.equal(
  elements["chest-storage-grid"].children.filter((slot) => slot.disabled).length,
  50,
);
assert.equal(inventorySlots.length, 16);

inventorySlots[0].children[0].click();
assert.equal(ChestManager.getMode(), "store");
assert.equal(state.inventory.slot1.includes(key), false);
assert.equal(ChestManager.getItems()[0], key);
assert.equal(actionLine.textContent, "Guardaste Llave");
assert.equal(elements["chest-title"].textContent, "Contenido del Cofre Mágico");
assert.equal(elements["chest-storage-grid"].children[0].children.length, 1);
assert.equal(elements["chest-storage-grid"].children[0].disabled, undefined);
assert.equal(
  elements["chest-storage-grid"].children.filter((slot) => slot.disabled).length,
  49,
);

elements["chest-take-btn"].click();
assert.equal(elements["chest-take-btn"].classList.contains("active-verb"), true);
elements["chest-storage-grid"].children[0].click();
assert.equal(ChestManager.getMode(), "take");
assert.equal(ChestManager.getItems().includes(key), false);
assert.equal(state.inventory.slot1[0], key);
assert.equal(actionLine.textContent, "Recuperaste Llave");
assert.equal(elements["chest-title"].textContent, "Contenido del Cofre Mágico");
assert.equal(inventorySlots[0].children.length, 1);
assert.equal(
  elements["chest-storage-grid"].children.filter((slot) => slot.disabled).length,
  50,
);
elements["chest-store-btn"].click();
assert.equal(ChestManager.getMode(), "store");
assert.equal(elements["chest-store-btn"].classList.contains("active-verb"), true);
assert.equal(elements["chest-take-btn"].classList.contains("active-verb"), false);

elements["chest-back-btn"].click();
assert.equal(elements["chest-overlay"].hidden, true);
assert.equal(elements["game-screen"].classList.contains("chest-open"), false);
assert.equal(ChestManager.getMode(), null);
assert.equal(ChestManager.open(state, actionLine), true);
assert.equal(
  document.querySelectorAll("#chest-storage-grid .chest-slot").length,
  50,
);
elements["chest-back-btn"].click();

ChestManager.reset();
state.inventory.slot1 = [];
state.activeCharacter = "slot1";
for (let index = 0; index < 49; index += 1) {
  ChestManager.getItems()[index] = item(`stored_${index}`);
}
const fiftieth = item("fiftieth");
state.inventory.slot1.push(fiftieth);
assert.equal(ChestManager.storeItem(fiftieth, state, actionLine), true);
assert.equal(ChestManager.getItemCount(), 50);
const rejected = item("rejected");
assert.equal(
  InventoryManager.addInventoryItem(state, "slot1", rejected),
  true,
);
assert.equal(ChestManager.storeItem(rejected, state, actionLine), false);
assert.equal(actionLine.textContent, "No cabe nada en el baúl");
assert.equal(elements["chest-title"].textContent, "Contenido del Cofre Mágico");
assert.equal(state.inventory.slot1.includes(rejected), true);

ChestManager.reset();
const withdrawCandidate = item("withdraw_candidate");
ChestManager.getItems()[0] = withdrawCandidate;
state.inventory.slot1 = Array.from({ length: 16 }, (_, index) => item(`full_${index}`));
assert.equal(ChestManager.takeItem(withdrawCandidate, state, actionLine), false);
assert.equal(actionLine.textContent, "No puedo llevar más cosas");
assert.equal(ChestManager.getItems()[0], withdrawCandidate);

state.inventory.slot1 = [];
const boundItem = item("bound", { boundToCharacter: "pj1" });
state.inventory.slot1.push(boundItem);
assert.equal(ChestManager.storeItem(boundItem, state, actionLine), false);
assert.equal(actionLine.textContent, "No puedo separarme de mi amiga");
assert.equal(state.inventory.slot1[0], boundItem);

// Cofre e inventario conservan posiciones y reutilizan el primer hueco libre.
ChestManager.reset();
const fixedKey = item("fixed_key");
const fixedInsecticide = item("fixed_insecticide");
const fixedSalad = item("fixed_salad");
state.inventory.slot1 = [fixedKey, fixedInsecticide, fixedSalad];
assert.equal(ChestManager.storeItem(fixedKey, state, actionLine), true);
assert.equal(ChestManager.storeItem(fixedInsecticide, state, actionLine), true);
assert.equal(ChestManager.storeItem(fixedSalad, state, actionLine), true);
assert.equal(ChestManager.getItems()[0], fixedKey);
assert.equal(ChestManager.getItems()[1], fixedInsecticide);
assert.equal(ChestManager.getItems()[2], fixedSalad);
assert.equal(state.inventory.slot1[0], null);
assert.equal(state.inventory.slot1[1], null);
assert.equal(state.inventory.slot1[2], null);

assert.equal(ChestManager.takeItem(fixedInsecticide, state, actionLine), true);
assert.equal(ChestManager.getItems()[0], fixedKey);
assert.equal(ChestManager.getItems()[1], null);
assert.equal(ChestManager.getItems()[2], fixedSalad);
assert.equal(state.inventory.slot1[0], fixedInsecticide);

const replacement = item("fixed_replacement");
state.inventory.slot1[1] = replacement;
assert.equal(ChestManager.storeItem(replacement, state, actionLine), true);
assert.equal(ChestManager.getItems()[1], replacement);
assert.equal(ChestManager.getItems()[2], fixedSalad);

assert.equal(elements["chest-overlay"].hidden, true);
assert.equal(elements["game-screen"].classList.contains("chest-open"), false);
assert.equal(ChestManager.getMode(), null);
state.currentVerb = "use";
state.player.direction = "down";
interactWithChest(state);
assert.equal(state.player.direction, "up");
assert.equal(ChestManager.isOpen(), true);
elements["chest-back-btn"].click();
assert.equal(ChestManager.isOpen(), false);

state.currentVerb = "open";
state.player.direction = "down";
interactWithChest(state);
assert.equal(state.player.direction, "up");
assert.equal(ChestManager.isOpen(), true);
elements["chest-back-btn"].click();
assert.equal(ChestManager.isOpen(), false);

const storedBeforeInvalidUses = ChestManager.getItems().slice();
const invalidChestItems = [
  item("key_instance", { typeId: "key", name: "Llave" }),
  item("bar_instance", { typeId: "028", name: "Barra de metal" }),
  item("insecticide_instance", { typeId: "006", name: "Insecticida" }),
  item("future_instance", { typeId: "future_item", name: "Objeto futuro" }),
];

for (const invalidItem of invalidChestItems) {
  const invalidState = createState();
  invalidState.inventory.slot1[0] = invalidItem;
  InventoryManager.refreshInventoryUI(invalidState, actionLine);
  inventorySlots[0].children[0].click();

  assert.equal(invalidState.selectedInventoryItem, invalidItem);
  assert.equal(inventorySlots[0].children[0].style.outline, "3px solid yellow");

  // Simula la ejecución diferida al terminar el recorrido A*.
  invalidState.pendingInteraction = chestObject;
  interactWithChest(invalidState);

  assert.equal(ChestManager.isOpen(), false);
  assert.equal(invalidState.inventory.slot1[0], invalidItem);
  assert.deepEqual(ChestManager.getItems(), storedBeforeInvalidUses);
  assert.equal(invalidState.selectedInventoryItem, null);
  assert.equal(inventorySlots[0].children[0].style.outline, undefined);
  assert.equal(invalidState.currentVerb, "Walk to");
  assert.equal(actionLine.textContent, "No puedo usar eso con el Cofre Mágico");
}

for (const verb of [
  "what is",
  "read",
  "pick up",
  "close",
  "talk",
  "turn on",
  "turn off",
  "combine",
  "Walk to",
]) {
  const otherVerbState = createState();
  otherVerbState.currentVerb = verb;
  interactWithChest(otherVerbState);
  assert.equal(ChestManager.isOpen(), false, `${verb} no debe abrir el cofre`);
}

const canceledState = createState();
canceledState.pendingInteraction = chestObject;
canceledState.path = [{ x: 1, y: 1 }];
EventsManager.cancelPendingInteractions(canceledState);
canceledState.path = [];
assert.equal(canceledState.pendingInteraction, null);
assert.equal(ChestManager.isOpen(), false);

state.currentVerb = "what is";
interactWithChest(state);
assert.equal(actionLine.textContent, chestDefinition.description);
assert.equal(ChestManager.isOpen(), false);

// RegresiÃ³n: los ids de instancia solo son Ãºnicos dentro de cada mapa.
// La barra de map7 y el insecticida de map4 se llaman ambos "object_2".
ChestManager.reset();
const sharedState = createState();
const robinBar = item("object_2", {
  typeId: "028",
  name: "Barra de metal",
  worldInstanceId: "map7:object_2",
});
const robinSalad = item("object_3", {
  typeId: "007",
  name: "Ensalada",
  worldInstanceId: "map5:object_3",
});
const robinSpare = item("object_robin_spare", {
  worldInstanceId: "map_test:object_robin_spare",
});
sharedState.activeCharacter = "slot3";
sharedState.inventory.slot3 = InventoryManager.createEmptyInventory();
sharedState.inventory.slot3[0] = robinBar;
sharedState.inventory.slot3[1] = robinSalad;
sharedState.inventory.slot3[5] = robinSpare;

assert.equal(ChestManager.open(sharedState, actionLine), true);
assert.equal(ChestManager.storeItem(robinBar, sharedState, actionLine), true);
assert.equal(ChestManager.storeItem(robinSalad, sharedState, actionLine), true);
assert.equal(sharedState.inventory.slot3[0], null);
assert.equal(sharedState.inventory.slot3[1], null);
assert.equal(sharedState.inventory.slot3[5], robinSpare);
assert.equal(sharedState.inventory.slot3.length, 16);
assert.equal(ChestManager.close(), true);
assert.equal(ChestManager.getMode(), null);
assert.equal(sharedState.selectedInventoryItem, null);
assert.equal(sharedState.pendingInteraction, null);

sharedState.activeCharacter = "slot1";
assert.equal(ChestManager.open(sharedState, actionLine), true);
assert.equal(ChestManager.setMode("take"), true);
assert.equal(ChestManager.takeItem(robinBar, sharedState, actionLine), true);
assert.equal(ChestManager.takeItem(robinSalad, sharedState, actionLine), true);
assert.equal(ChestManager.close(), true);
assert.equal(sharedState.inventory.slot1[0], robinBar);
assert.equal(sharedState.inventory.slot1[1], robinSalad);
assert.equal(sharedState.inventory.slot1.length, 16);
assert.equal(ChestManager.isOpen(), false);
assert.equal(ChestManager.getMode(), null);

const insecticide = {
  id: "object_2",
  typeId: "006",
  type: "item",
  name: "Insecticida",
  description: "De la marca Kukal, lo mata todo.",
  sprite: "006_Insecticida.png",
  pickup: true,
  collected: false,
  visible: true,
};
sharedState.currentVerb = "pick up";
sharedState.pendingInteraction = insecticide;
assert.equal(
  InteractionManager.handleObjectInteraction(
    insecticide,
    sharedState,
    actionLine,
    "map4",
    { objects: [insecticide] },
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => VerbManager.getLabel(verb),
    () => {},
  ),
  true,
);
sharedState.pendingInteraction = null;
assert.equal(sharedState.inventory.slot1[2].typeId, "006");
assert.equal(sharedState.inventory.slot1[2].worldInstanceId, "map4:object_2");
assert.equal(insecticide.collected, true);
assert.equal(insecticide.visible, false);
assert.equal(
  InventoryManager.canAddItemToInventory(sharedState, "slot1", {
    ...sharedState.inventory.slot1[2],
  }),
  false,
);

// Robin tambiÃ©n reutiliza el primer hueco libre, aunque haya huecos intermedios.
sharedState.activeCharacter = "slot3";
const robinPickup = {
  ...insecticide,
  id: "object_normal",
  typeId: "006",
  collected: false,
  visible: true,
};
assert.equal(
  InventoryManager.handlePickUp(
    robinPickup,
    sharedState,
    actionLine,
    "map_test",
  ),
  true,
);
assert.equal(sharedState.inventory.slot3[0]?.id, "object_normal");
assert.equal(sharedState.inventory.slot3[1], null);
assert.equal(sharedState.inventory.slot3[5], robinSpare);
assert.equal(sharedState.inventory.slot3.length, 16);

// Abrir y cerrar sin transferir tampoco deja modo, selecciÃ³n ni interacciÃ³n.
sharedState.selectedInventoryItem = robinPickup;
sharedState.pendingInteraction = chestObject;
assert.equal(ChestManager.open(sharedState, actionLine), true);
assert.equal(sharedState.selectedInventoryItem, null);
assert.equal(sharedState.pendingInteraction, null);
assert.equal(ChestManager.close(), true);
assert.equal(ChestManager.isOpen(), false);
assert.equal(ChestManager.getMode(), null);

// Dos mapas pueden tener el mismo id local sin representar la misma instancia.
ChestManager.reset();
const auditState = createState();
auditState.activeCharacter = "slot3";
const map7Bar = item("object_2", {
  typeId: "028",
  name: "Barra de metal",
  worldInstanceId: "map7:object_2",
});
const map4Insecticide = item("object_2", {
  typeId: "006",
  name: "Insecticida",
  worldInstanceId: "map4:object_2",
});
const secondBarInstance = item("object_other_bar", {
  typeId: "028",
  name: "Barra de metal",
  worldInstanceId: "map_test:object_other_bar",
});
auditState.inventory.slot3[0] = map7Bar;
auditState.inventory.slot3[4] = map4Insecticide;
auditState.inventory.slot3[6] = secondBarInstance;

assert.equal(ChestManager.open(auditState, actionLine), true);
assert.equal(ChestManager.storeItem(map7Bar, auditState, actionLine), true);
assert.equal(
  ChestManager.storeItem(map4Insecticide, auditState, actionLine),
  true,
);
assert.equal(
  ChestManager.storeItem(secondBarInstance, auditState, actionLine),
  true,
);
assert.equal(ChestManager.getItems()[0], map7Bar);
assert.equal(ChestManager.getItems()[1], map4Insecticide);
assert.equal(ChestManager.getItems()[2], secondBarInstance);
assert.equal(auditState.inventory.slot3[0], null);
assert.equal(auditState.inventory.slot3[4], null);
assert.equal(auditState.inventory.slot3[6], null);

// Una copia de la misma identidad global sÃ­ es un duplicado real y no se mueve.
const actualDuplicate = { ...map7Bar };
auditState.inventory.slot3[7] = actualDuplicate;
assert.equal(
  ChestManager.storeItem(actualDuplicate, auditState, actionLine),
  false,
);
assert.equal(actionLine.textContent, "Ese objeto ya está en el cofre");
assert.equal(auditState.inventory.slot3[7], actualDuplicate);
assert.equal(ChestManager.getItemCount(), 3);
assert.equal(ChestManager.close(), true);

// Ryan recupera ambas instancias conservando sus identidades completas.
auditState.activeCharacter = "slot1";
assert.equal(ChestManager.open(auditState, actionLine), true);
assert.equal(ChestManager.setMode("take"), true);
assert.equal(ChestManager.takeItem(map7Bar, auditState, actionLine), true);
assert.equal(
  ChestManager.takeItem(map4Insecticide, auditState, actionLine),
  true,
);
assert.equal(
  ChestManager.takeItem(secondBarInstance, auditState, actionLine),
  true,
);
assert.equal(auditState.inventory.slot1[0].worldInstanceId, "map7:object_2");
assert.equal(auditState.inventory.slot1[1].worldInstanceId, "map4:object_2");
assert.equal(
  auditState.inventory.slot1[2].worldInstanceId,
  "map_test:object_other_bar",
);
assert.equal(ChestManager.getItemCount(), 0);

// Guardar y recuperar repetidamente no deja identidades residuales.
for (let cycle = 0; cycle < 2; cycle += 1) {
  assert.equal(ChestManager.storeItem(map7Bar, auditState, actionLine), true);
  assert.equal(ChestManager.takeItem(map7Bar, auditState, actionLine), true);
  assert.equal(auditState.inventory.slot1[0], map7Bar);
  assert.equal(ChestManager.getItemCount(), 0);
}

// El cofre sigue siendo compartido y los inventarios siguen siendo privados.
const ryanObject = item("ryan_object", {
  worldInstanceId: "map_test:ryan_object",
});
auditState.inventory.slot1[5] = ryanObject;
assert.equal(ChestManager.storeItem(ryanObject, auditState, actionLine), true);
assert.equal(auditState.inventory.slot1[5], null);
assert.equal(ChestManager.close(), true);

auditState.activeCharacter = "slot3";
assert.equal(ChestManager.open(auditState, actionLine), true);
assert.equal(ChestManager.takeItem(ryanObject, auditState, actionLine), true);
assert.equal(auditState.inventory.slot3[0], ryanObject);
assert.equal(auditState.inventory.slot1[0], map7Bar);
assert.equal(auditState.inventory.slot1[1], map4Insecticide);
assert.equal(auditState.inventory.slot1[2], secondBarInstance);
assert.equal(auditState.inventory.slot3[7], actualDuplicate);
assert.equal(ChestManager.close(), true);

// La llave 002 utiliza las transferencias normales del Cofre MÃ¡gico.
ChestManager.reset();
auditState.activeCharacter = "slot1";
const patioKey = item("patio_key_chest", {
  typeId: "002",
  name: "Llave plateada",
  sprite: "002_key_patio.png",
  worldInstanceId: "map8:patio_key_chest",
});
auditState.inventory.slot1[3] = patioKey;
assert.equal(ChestManager.storeItem(patioKey, auditState, actionLine), true);
assert.equal(auditState.inventory.slot1[3], null);
assert.equal(ChestManager.getItems()[0], patioKey);
assert.equal(ChestManager.takeItem(patioKey, auditState, actionLine), true);
assert.equal(auditState.inventory.slot1[3], patioKey);
assert.equal(ChestManager.getItemCount(), 0);

// La cinta VHS usa sin excepciones la recogida y las transferencias estándar.
ChestManager.reset();
const vhsState = createState();
const vhsObject = {
  id: "vhs_test",
  typeId: "005",
  type: "item",
  name: vhsDefinition.name,
  description: vhsDefinition.description,
  sprite: vhsDefinition.sprite,
  spriteWidth: vhsDefinition.defaultSpriteWidth,
  spriteHeight: vhsDefinition.defaultSpriteHeight,
  hitboxWidth: vhsDefinition.defaultHitboxWidth,
  hitboxHeight: vhsDefinition.defaultHitboxHeight,
  pickup: vhsDefinition.pickup,
  collected: false,
  visible: true,
};
vhsState.currentVerb = "pick up";
vhsState.pendingInteraction = vhsObject;
assert.equal(
  InteractionManager.handleObjectInteraction(
    vhsObject,
    vhsState,
    actionLine,
    "map_vhs_test",
    { objects: [vhsObject], npcs: [] },
    {}, {}, true, {}, {}, {}, {}, {},
    1, 1, 24, 60,
    (verb) => VerbManager.getLabel(verb),
    () => {},
  ),
  true,
);
vhsState.pendingInteraction = null;
const vhsInventoryItem = vhsState.inventory.slot1[0];
assert.equal(vhsInventoryItem.typeId, "005");
assert.equal(vhsInventoryItem.worldInstanceId, "map_vhs_test:vhs_test");
assert.equal(vhsInventoryItem.name, "Cinta VHS");
assert.equal(vhsObject.collected, true);
assert.equal(vhsObject.visible, false);
assert.equal(ChestManager.storeItem(vhsInventoryItem, vhsState, actionLine), true);
assert.equal(vhsState.inventory.slot1[0], null);
assert.equal(ChestManager.getItems()[0], vhsInventoryItem);
assert.equal(ChestManager.takeItem(vhsInventoryItem, vhsState, actionLine), true);
assert.equal(vhsState.inventory.slot1[0], vhsInventoryItem);
assert.equal(vhsInventoryItem.worldInstanceId, "map_vhs_test:vhs_test");
assert.equal(ChestManager.getItemCount(), 0);

console.log("Magic chest catalog, collision, approach, modal UI and transfers: OK");
