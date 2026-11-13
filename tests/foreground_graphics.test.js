const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class FakeElement {
  constructor(id = "", tagName = "div") {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.children = [];
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
      contains: (name) => this.classes.has(name),
    };
    this.value = "";
    this.files = [];
    this._innerHTML = "";
  }

  addEventListener(type, listener) {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }

  dispatch(type, event = {}) {
    this.listeners[type]?.forEach((listener) => listener(event));
  }

  click() {
    this.dispatch("click", {});
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

const drawnObjectSprites = [];
const context = {
  clearRect() {},
  drawImage(image) {
    if (image?._src?.includes("/img/objects/") || image?._src?.includes("./img/objects/")) {
      drawnObjectSprites.push(image._src.split("/").at(-1));
    }
  },
  fillRect() {},
  strokeRect() {},
  fillText() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  save() {},
  restore() {},
  setLineDash() {},
};

const ids = [
  "editor-canvas",
  "map-upload",
  "edit-map-btn",
  "save-map-btn",
  "toggle-grid-btn",
  "add-foreground-graphic-btn",
  "edit-foreground-graphic-btn",
  "delete-foreground-graphic-mode-btn",
  "add-npc-btn",
  "edit-npc-btn",
  "delete-npc-btn",
  "paint-collision-btn",
  "erase-mode-btn",
  "edit-object-btn",
  "add-object-btn",
  "delete-object-btn",
  "btn-edit-hotspots",
  "btn-add-hotspot",
  "btn-delete-hotspot",
  "editor-popup-close",
  "editor-popup",
  "editor-popup-title",
  "editor-popup-content",
  "editor-inspector",
  "foreground-graphic-type",
  "delete-foreground-graphic-btn",
  "npc-collision-offset-x",
  "npc-collision-offset-y",
  "npc-collision-width",
  "npc-collision-height",
];

const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement(id)]));
const canvas = elements["editor-canvas"];
canvas.width = 0;
canvas.height = 0;
canvas.getContext = () => context;
canvas.getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  width: canvas.width * 2,
  height: canvas.height * 2,
});

global.window = global;
global.window.listeners = {};
global.window.addEventListener = (type, listener) => {
  global.window.listeners[type] ??= [];
  global.window.listeners[type].push(listener);
};
global.document = {
  getElementById(id) {
    return elements[id] ?? null;
  },
  createElement(tagName) {
    return new FakeElement("", tagName);
  },
};

class FakeImage {
  constructor() {
    this.width = 768;
    this.height = 180;
    this.naturalWidth = 48;
    this.naturalHeight = 48;
  }

  set src(value) {
    this._src = value;
    queueMicrotask(() => this.onload?.());
  }
}

let exportedJson = null;
global.Image = FakeImage;
global.Blob = class FakeBlob {
  constructor(parts) {
    exportedJson = parts.join("");
  }
};
global.URL = { createObjectURL: () => "blob:test" };
global.ObjectLibrary = [
  {
    id: "key",
    name: "Llave",
    sprite: "key.png",
    defaultSpriteWidth: 16,
    defaultSpriteHeight: 16,
    defaultHitboxWidth: 16,
    defaultHitboxHeight: 16,
    alwaysOnTop: true,
    worldRenderWidth: 8,
    worldRenderHeight: 10,
  },
];
global.HotspotLibrary = [];
global.MapLibrary = [
  { id: "map1", name: "Mapa 1", image: "map1.png", json: "map1.json" },
];

vm.runInThisContext(
  fs.readFileSync("js/catalogs/graficos_traspasables.js", "utf8"),
);
vm.runInThisContext(fs.readFileSync("js/catalogs/npcs.js", "utf8"));
vm.runInThisContext(fs.readFileSync("js/editor.js", "utf8"));

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

async function run() {
  EditorModule.start();

  elements["map-upload"].files = [{ name: "map1.png" }];
  elements["map-upload"].dispatch("change", {
    target: elements["map-upload"],
  });
  await flush();

  elements["add-object-btn"].click();
  elements["save-map-btn"].click();
  const originalObject = JSON.parse(exportedJson).objects[0];
  assert.equal(originalObject.alwaysOnTop, true);
  assert.equal(originalObject.worldRenderWidth, 8);
  assert.equal(originalObject.worldRenderHeight, 10);
  assert.equal(originalObject.blockedByNpcId, null);

  elements["add-foreground-graphic-btn"].click();
  let popupContent = elements["editor-popup-content"];
  let list = popupContent.children[0];
  assert.equal(list.children.length, ForegroundGraphicLibrary.length);

  const firstCard = list.children[0];
  const firstPreview = firstCard.children[0];
  const firstThumbnail = firstPreview.children[0];
  const firstUnavailable = firstPreview.children[1];
  const firstInfo = firstCard.children[1];

  assert.equal(firstThumbnail.src, "./img/traspasables/barrandilla_1.png");
  assert.equal(firstInfo.children[0].textContent, "Barandilla 1");
  assert.equal(firstInfo.children[1].textContent, "barrandilla_1");
  firstThumbnail.dispatch("error");
  assert.equal(firstThumbnail.classList.contains("is-hidden"), true);
  assert.equal(firstUnavailable.classList.contains("is-hidden"), false);

  firstCard.click();
  assert.equal(
    elements["add-foreground-graphic-btn"].style.outline,
    "6px solid #000000",
  );
  assert.equal(elements["edit-foreground-graphic-btn"].style.outline, "none");
  assert.equal(
    elements["delete-foreground-graphic-mode-btn"].style.outline,
    "none",
  );

  canvas.dispatch("mousedown", { clientX: 100, clientY: 60 });
  canvas.dispatch("mousedown", { clientX: 100, clientY: 60 });

  elements["save-map-btn"].click();
  let data = JSON.parse(exportedJson);
  assert.deepEqual(data.foregroundGraphics, [
    { id: "barrandilla_1_1", typeId: "barrandilla_1", x: 50, y: 30 },
    { id: "barrandilla_1_2", typeId: "barrandilla_1", x: 50, y: 30 },
  ]);
  assert.equal(data.objects.length, 1);

  elements["edit-foreground-graphic-btn"].click();
  assert.equal(elements["add-foreground-graphic-btn"].style.outline, "none");
  assert.equal(
    elements["edit-foreground-graphic-btn"].style.outline,
    "6px solid #000000",
  );
  assert.equal(
    elements["delete-foreground-graphic-mode-btn"].style.outline,
    "none",
  );

  canvas.dispatch("mousedown", { clientX: 752, clientY: 164 });
  canvas.dispatch("mousemove", { clientX: 600, clientY: 120 });
  global.window.listeners.mouseup.forEach((listener) => listener());
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.deepEqual(data.objects[0], originalObject);
  assert.equal(data.foregroundGraphics.length, 2);

  canvas.dispatch("mousedown", { clientX: 110, clientY: 70 });
  canvas.dispatch("mousemove", { clientX: 300, clientY: 160 });
  global.window.listeners.mouseup.forEach((listener) => listener());
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.equal(data.foregroundGraphics[0].x, 50);
  assert.equal(data.foregroundGraphics[0].y, 30);
  assert.equal(data.foregroundGraphics[1].x, 145);
  assert.equal(data.foregroundGraphics[1].y, 75);
  assert.equal(data.foregroundGraphics.length, 2);

  elements["delete-foreground-graphic-mode-btn"].click();
  assert.equal(elements["add-foreground-graphic-btn"].style.outline, "none");
  assert.equal(elements["edit-foreground-graphic-btn"].style.outline, "none");
  assert.equal(
    elements["delete-foreground-graphic-mode-btn"].style.outline,
    "6px solid #000000",
  );

  canvas.dispatch("mousedown", { clientX: 752, clientY: 164 });
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.equal(data.objects.length, 1);
  assert.equal(data.foregroundGraphics.length, 2);

  canvas.dispatch("mousedown", { clientX: 300, clientY: 160 });
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.deepEqual(data.foregroundGraphics.map((graphic) => graphic.id), [
    "barrandilla_1_1",
  ]);
  assert.equal(data.objects.length, 1);

  data.objects[0].alwaysOnTop = false;
  data.objects[0].blockedByNpcId = "NPC_1_instance_1";
  global.fetch = async () => ({ json: async () => data });
  elements["edit-map-btn"].click();
  popupContent = elements["editor-popup-content"];
  list = popupContent.children[0];
  list.children[0].children[0].click();
  await flush();
  elements["save-map-btn"].click();
  const reloaded = JSON.parse(exportedJson);
  assert.deepEqual(reloaded.foregroundGraphics, data.foregroundGraphics);
  assert.deepEqual(reloaded.objects, data.objects);
  assert.equal(reloaded.objects[0].alwaysOnTop, false);
  assert.equal(reloaded.objects[0].blockedByNpcId, "NPC_1_instance_1");

  elements["add-npc-btn"].click();
  popupContent = elements["editor-popup-content"];
  list = popupContent.children[0];
  assert.equal(list.children.length, NpcLibrary.length);
  const npcCard = list.children[0];
  assert.equal(
    npcCard.children[0].children[0].src,
    "./img/npcs/NPC_1.Planta_carnivora.png",
  );
  assert.equal(npcCard.children[1].children[0].textContent, "Planta carnívora");
  npcCard.click();

  assert.equal(elements["add-npc-btn"].style.outline, "6px solid #000000");
  canvas.dispatch("mousedown", { clientX: 500, clientY: 80 });
  canvas.dispatch("mousedown", { clientX: 500, clientY: 80 });
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.equal(data.npcs.length, 2);
  assert.equal("_animationFrame" in data.npcs[0], false);
  assert.equal("_animationElapsed" in data.npcs[0], false);
  assert.deepEqual(data.npcs[0].collision, {
    offsetX: 4,
    offsetY: 48,
    width: 16,
    height: 12,
  });

  elements["edit-npc-btn"].click();
  assert.equal(elements["add-npc-btn"].style.outline, "none");
  assert.equal(elements["edit-npc-btn"].style.outline, "6px solid #000000");
  canvas.dispatch("mousedown", { clientX: 510, clientY: 90 });
  canvas.dispatch("mousemove", { clientX: 600, clientY: 140 });
  global.window.listeners.mouseup.forEach((listener) => listener());

  elements["npc-collision-offset-x"].value = "6";
  elements["npc-collision-offset-x"].dispatch("input");
  elements["npc-collision-offset-y"].value = "44";
  elements["npc-collision-offset-y"].dispatch("input");
  elements["npc-collision-width"].value = "18";
  elements["npc-collision-width"].dispatch("input");
  elements["npc-collision-height"].value = "14";
  elements["npc-collision-height"].dispatch("input");

  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.equal(data.npcs.length, 2);
  assert.deepEqual(
    { x: data.npcs[0].x, y: data.npcs[0].y },
    { x: 250, y: 40 },
  );
  assert.deepEqual(
    { x: data.npcs[1].x, y: data.npcs[1].y },
    { x: 295, y: 65 },
  );
  assert.deepEqual(data.npcs[1].collision, {
    offsetX: 6,
    offsetY: 44,
    width: 18,
    height: 14,
  });

  elements["delete-npc-btn"].click();
  assert.equal(elements["edit-npc-btn"].style.outline, "none");
  assert.equal(elements["delete-npc-btn"].style.outline, "6px solid #000000");
  canvas.dispatch("mousedown", { clientX: 100, clientY: 60 });
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.equal(data.npcs.length, 2);
  assert.equal(data.foregroundGraphics.length, 1);
  assert.equal(data.objects.length, 1);

  canvas.dispatch("mousedown", { clientX: 600, clientY: 140 });
  elements["save-map-btn"].click();
  data = JSON.parse(exportedJson);
  assert.deepEqual(data.npcs.map((npc) => npc.id), ["NPC_1_instance_1"]);

  global.fetch = async () => ({ json: async () => data });
  elements["edit-map-btn"].click();
  popupContent = elements["editor-popup-content"];
  list = popupContent.children[0];
  list.children[0].children[0].click();
  await flush();
  elements["save-map-btn"].click();
  const npcReloaded = JSON.parse(exportedJson);
  assert.deepEqual(npcReloaded.npcs, data.npcs);

  // Los objetos prioritarios se dibujan y seleccionan por encima aunque
  // aparezcan antes que el objeto normal en el JSON.
  const layeredData = {
    ...data,
    foregroundGraphics: [],
    npcs: [],
    objects: [
      {
        ...originalObject,
        id: "top_object",
        sprite: "top.png",
        x: 20,
        y: 20,
        alwaysOnTop: true,
      },
      {
        ...originalObject,
        id: "normal_object",
        sprite: "normal.png",
        x: 20,
        y: 20,
        alwaysOnTop: false,
      },
    ],
  };
  drawnObjectSprites.length = 0;
  global.fetch = async () => ({ json: async () => layeredData });
  elements["edit-map-btn"].click();
  popupContent = elements["editor-popup-content"];
  list = popupContent.children[0];
  list.children[0].children[0].click();
  await flush();
  assert.deepEqual(drawnObjectSprites.slice(-2), ["normal.png", "top.png"]);

  elements["edit-object-btn"].click();
  canvas.dispatch("mousedown", { clientX: 50, clientY: 50 });
  assert.match(elements["editor-inspector"].innerHTML, /top_object/);

  elements["save-map-btn"].click();
  const layeredExport = JSON.parse(exportedJson);
  assert.equal(layeredExport.objects[0].alwaysOnTop, true);
  assert.equal(layeredExport.objects[1].alwaysOnTop, false);

  console.log(
    "Foreground and NPC editor modes, thumbnails, collision inspector and JSON cycle: OK",
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
