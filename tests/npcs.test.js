const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

load("js/catalogs/npcs.js");
load("js/catalogs/verbs.js");
load("js/game/npcs.js");
load("js/game/world.js");
load("js/game/movement.js");
load("js/game/pathfinding.js");

const definition = NpcLibrary[0];
assert.equal(definition.id, "NPC_1");
assert.equal(definition.sprite, "NPC_1.Planta_carnivora.png");
assert.equal(definition.animationRow, 0);
assert.equal(definition.animationFrames, 4);
assert.equal(definition.frameDuration, 1000);
assert.equal(definition.traspasable, false);
const loveAnimation = definition.overlayAnimations.love;
assert.equal(loveAnimation.sprite, "001 Amor.png");
assert.equal(loveAnimation.spriteFolder, "animations");
assert.equal(loveAnimation.frameWidth, 24);
assert.equal(loveAnimation.frameHeight, 60);
assert.equal(loveAnimation.animationFrames, 4);
assert.equal(loveAnimation.frameDuration, 1000);
const lovePng = fs.readFileSync("img/animations/001 Amor.png");
assert.equal(lovePng.readUInt32BE(16), 96);
assert.equal(lovePng.readUInt32BE(20), 300);
const insecticideAnimation = definition.overlayAnimations.insecticide;
assert.equal(insecticideAnimation.sprite, "002 Isectizida.png");
assert.equal(insecticideAnimation.spriteFolder, "animations");
assert.equal(insecticideAnimation.frameWidth, 24);
assert.equal(insecticideAnimation.frameHeight, 60);
assert.equal(insecticideAnimation.animationFrames, 4);
assert.equal(insecticideAnimation.frameDuration, 2500);
assert.equal(insecticideAnimation.loop, false);
const insecticidePng = fs.readFileSync("img/animations/002 Isectizida.png");
assert.equal(insecticidePng.readUInt32BE(16), 96);
assert.equal(insecticidePng.readUInt32BE(20), 300);
assert.match(
  fs.readFileSync("js/game.js", "utf8"),
  /NPC_1:overlay:|overlayAnimations|asset\.folder/,
);

const animatedNpc = {
  id: "npc-test",
  typeId: "NPC_1",
  x: 48,
  y: 30,
  collision: { offsetX: 0, offsetY: 30, width: 24, height: 30 },
};

NpcManager.normalizeInstance(animatedNpc);
assert.equal(animatedNpc._animationFrame, 0);
NpcManager.updateAnimations([animatedNpc], 0.999);
assert.equal(animatedNpc._animationFrame, 0);
NpcManager.updateAnimations([animatedNpc], 0.001);
assert.equal(animatedNpc._animationFrame, 1);
NpcManager.updateAnimations([animatedNpc], 3);
assert.equal(animatedNpc._animationFrame, 0);

assert.equal(NpcManager.startOverlayAnimation(animatedNpc, "love"), true);
assert.equal(NpcManager.isOverlayAnimationActive(animatedNpc, "love"), true);
assert.equal(animatedNpc._overlayAnimationFrame, 0);
NpcManager.updateAnimations([animatedNpc], 1);
assert.equal(animatedNpc._overlayAnimationFrame, 1);
NpcManager.updateAnimations([animatedNpc], 1);
assert.equal(animatedNpc._overlayAnimationFrame, 2);
NpcManager.updateAnimations([animatedNpc], 1);
assert.equal(animatedNpc._overlayAnimationFrame, 3);
NpcManager.updateAnimations([animatedNpc], 1);
assert.equal(animatedNpc._overlayAnimationFrame, 0);
assert.equal(NpcManager.stopOverlayAnimation(animatedNpc), true);

let insecticideCompletions = 0;
assert.equal(
  NpcManager.startOverlayAnimation(
    animatedNpc,
    "insecticide",
    () => { insecticideCompletions += 1; },
  ),
  true,
);
NpcManager.updateAnimations([animatedNpc], 2.499);
assert.equal(animatedNpc._overlayAnimationFrame, 0);
NpcManager.updateAnimations([animatedNpc], 0.001);
assert.equal(animatedNpc._overlayAnimationFrame, 1);
NpcManager.updateAnimations([animatedNpc], 2.5);
assert.equal(animatedNpc._overlayAnimationFrame, 2);
NpcManager.updateAnimations([animatedNpc], 2.5);
assert.equal(animatedNpc._overlayAnimationFrame, 3);
NpcManager.updateAnimations([animatedNpc], 2.499);
assert.equal(animatedNpc._overlayAnimationFrame, 3);
assert.equal(insecticideCompletions, 0);
NpcManager.updateAnimations([], 0.001);
assert.equal(insecticideCompletions, 1);
assert.equal(NpcManager.isOverlayAnimationActive(animatedNpc), false);
NpcManager.updateAnimations([], 10);
assert.equal(insecticideCompletions, 1);

assert.equal(NpcManager.startOverlayAnimation(animatedNpc, "love"), true);

const mapData = {
  tileWidth: 24,
  tileHeight: 30,
  cols: 5,
  rows: 5,
  walkable: Array.from({ length: 5 }, () => Array(5).fill(1)),
  objects: [],
  npcs: [animatedNpc],
};

assert.equal(NpcManager.isPointBlockedByNpc(60, 75, mapData), true);
assert.equal(NpcManager.isPointBlockedByNpc(20, 75, mapData), false);
assert.equal(MovementManager.canStandAt(60, 75, mapData, 6), false);
assert.equal(WorldManager.isWalkableTile(2, 1, mapData), false);
assert.equal(WorldManager.isWalkableTile(2, 2, mapData), false);
assert.equal(WorldManager.isWalkableTile(1, 2, mapData), true);

const path = PathfindingManager.findPathAStar(1, 2, 3, 2, mapData);
assert.ok(path.length > 0);
assert.equal(
  path.some((tile) => tile.col === 2 && (tile.row === 1 || tile.row === 2)),
  false,
);

const interactionTile = PathfindingManager.findInteractionTileForNpc(
  animatedNpc,
  mapData,
);
assert.ok(interactionTile);
assert.equal(
  WorldManager.isWalkableTile(interactionTile.col, interactionTile.row, mapData),
  true,
);

const mapWithoutNpcs = { ...mapData, npcs: [] };
assert.equal(WorldManager.isWalkableTile(2, 1, mapWithoutNpcs), true);
assert.doesNotThrow(() => NpcManager.updateAnimations(undefined, 1));

global.InventoryManager = { clearSelectedInventoryItem() {} };
global.EventsManager = { selectDefaultVerb() {} };
load("js/game/interactions.js");

assert.equal(InteractionManager.getNpcAt(60, 40, mapData), animatedNpc);
assert.equal(InteractionManager.getNpcAt(10, 10, mapData), null);

const state = { currentVerb: "what is", messageTimeout: null };
const actionLine = { textContent: "" };
InteractionManager.handleNpcInteraction(
  animatedNpc,
  state,
  actionLine,
  (id) => id,
);
assert.equal(actionLine.textContent, definition.description);

load("js/game/events.js");
const interactionState = {
  path: [],
  pathIndex: 0,
  target: { active: false },
  pendingInteraction: null,
  pendingHotspot: null,
  pendingNpc: null,
  messageTimeout: null,
};
const activeCharacter = {
  x: 36,
  y: 90,
  direction: "down",
};
assert.equal(
  EventsManager.prepareNpcInteraction(
    animatedNpc,
    interactionState,
    actionLine,
    () => mapData,
    () => activeCharacter,
    6,
  ),
  true,
);
assert.equal(interactionState.pendingNpc, animatedNpc);
assert.ok(interactionState.path.length > 0);
assert.equal(
  interactionState.path.some(
    (tile) => !WorldManager.isWalkableTile(tile.col, tile.row, mapData),
  ),
  false,
);

load("js/game/render.js");

const drawCalls = [];
const ctx = {
  drawImage(...args) {
    drawCalls.push(args);
  },
};
animatedNpc._animationFrame = 3;
animatedNpc._overlayAnimationFrame = 2;
RenderManager.drawNpc(
  ctx,
  animatedNpc,
  { NPC_1: {}, "NPC_1:overlay:love": {} },
  { camera: { x: 8, y: 10 } },
  3,
);
assert.deepEqual(drawCalls[0].slice(1, 5), [72, 0, 24, 60]);
assert.deepEqual(drawCalls[0].slice(5, 9), [120, 60, 72, 180]);
assert.deepEqual(drawCalls[1].slice(1, 5), [48, 0, 24, 60]);
assert.deepEqual(drawCalls[1].slice(5, 9), [120, 60, 72, 180]);
assert.equal(NpcManager.stopOverlayAnimation(animatedNpc), true);
assert.equal(NpcManager.isOverlayAnimationActive(animatedNpc), false);

const depthOrder = [];
RenderManager.drawNpc = () => depthOrder.push("npc");
RenderManager.drawPlayer = (_ctx, character) => depthOrder.push(character.id);
RenderManager.drawWorldEntities(
  {},
  { id: "slot1", currentMap: "map1" },
  {
    camera: { x: 0, y: 0 },
    player: { id: "slot1", currentMap: "map1", y: 70 },
    companions: [{ id: "slot2", currentMap: "map1", y: 100 }],
  },
  { npcs: [animatedNpc] },
  {},
  {},
  3,
  3,
  24,
  60,
);
assert.deepEqual(depthOrder, ["slot1", "npc", "slot2"]);

const renderOrder = [];
RenderManager.drawMap = () => renderOrder.push("map");
RenderManager.drawObjects = () => renderOrder.push("objects");
RenderManager.drawWorldEntities = () => renderOrder.push("world-entities");
RenderManager.drawForegroundGraphics = () => renderOrder.push("foreground");
RenderManager.render(
  { clearRect() {} },
  { width: 100, height: 100 },
  true,
  {},
  {
    camera: { x: 0, y: 0 },
    player: { id: "slot1", currentMap: "map1", y: 70 },
    companions: [],
  },
  { objects: [], npcs: [animatedNpc], foregroundGraphics: [] },
  {},
  {},
  3,
  3,
  24,
  60,
  { id: "slot1", currentMap: "map1" },
  {},
  {},
);
assert.deepEqual(renderOrder, ["map", "objects", "world-entities", "foreground"]);

console.log(
  "NPC catalog, animation, collision, A*, interaction and depth rendering: OK",
);
