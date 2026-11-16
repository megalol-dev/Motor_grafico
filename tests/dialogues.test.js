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

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.classList = new FakeClassList();
    this.children = [];
    this.attributes = {};
    this._textContent = "";
  }

  set textContent(value) {
    this._textContent = value;
    this.children = [];
  }

  get textContent() {
    if (this.children.length > 0) {
      return this.children.map((child) => child.textContent).join("");
    }
    return this._textContent;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = children;
    this._textContent = "";
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

class FakeRoot extends FakeElement {
  constructor(ownerDocument) {
    super(ownerDocument);
    this.listeners = { click: [] };
  }

  addEventListener(type, listener, capture) {
    this.listeners[type].push({ listener, capture });
  }

  removeEventListener(type, listener, capture) {
    this.listeners[type] = this.listeners[type].filter(
      (entry) => entry.listener !== listener || entry.capture !== capture,
    );
  }

  click(targetName, normalAction) {
    const event = {
      target: { dataset: { testTarget: targetName } },
      defaultPrevented: false,
      propagationStopped: false,
      immediatePropagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
      stopImmediatePropagation() {
        this.immediatePropagationStopped = true;
      },
    };

    for (const entry of this.listeners.click) {
      entry.listener(event);
      if (event.immediatePropagationStopped) break;
    }

    if (!event.propagationStopped) normalAction?.();
    return event;
  }
}

const fakeDocument = {
  createElement() {
    return new FakeElement(fakeDocument);
  },
};
global.document = fakeDocument;

load("js/catalogs/verbs.js");
load("js/game/dialogues.js");
load("js/game/interactions.js");

const root = new FakeRoot(fakeDocument);
const actionLine = new FakeElement(fakeDocument);
DialogueManager.initialize(root, actionLine);
DialogueManager.initialize(root, actionLine);
assert.equal(root.listeners.click.length, 1);

const entries = [
  { speaker: "Planta", text: "Uno" },
  { speaker: "Planta", text: "Dos" },
  { speaker: "Planta", text: "Tres" },
  { speaker: "Robin", text: "Cuatro" },
];
const state = {
  currentVerb: "use",
  activeCharacter: "slot2",
  selectedInventoryItem: { id: "salad" },
  target: { active: true },
  path: [{ col: 1, row: 1 }],
  pathIndex: 0,
  pendingInteraction: { id: "object" },
  pendingHotspot: { id: "hotspot" },
  pendingNpc: { id: "npc" },
  pendingNpcDistance: 10,
  pendingTeleport: { map: "map2" },
  player: { moving: true },
  companions: [{ moving: true }, { moving: true }],
  messageTimeout: null,
};
let ordinaryActions = 0;
let finishes = 0;

const initialClick = root.click("canvas", () => {
  ordinaryActions += 1;
  DialogueManager.start(entries, {
    state,
    actionLine,
    onFinish() {
      finishes += 1;
      actionLine.textContent = VerbManager.formatPrompt("Walk to");
    },
  });
});

assert.equal(initialClick.defaultPrevented, false);
assert.equal(ordinaryActions, 1);
assert.deepEqual(DialogueManager.getCurrentEntry(), entries[0]);
assert.equal(actionLine.textContent, "Planta:Uno◆");
assert.equal(actionLine.classList.contains("dialogue-active"), true);
assert.equal(state.target.active, false);
assert.deepEqual(state.path, []);
assert.equal(state.pendingNpc, null);
assert.equal(state.player.moving, false);
assert.equal(state.companions.every((character) => !character.moving), true);

function findByClass(element, className) {
  if (element.classList?.contains(className)) return element;
  for (const child of element.children ?? []) {
    const found = findByClass(child, className);
    if (found) return found;
  }
  return null;
}

assert.ok(findByClass(actionLine, "dialogue-indicator"));

const blockedMessage = InteractionManager.showTemporaryMessage(
  "Mensaje ordinario",
  state,
  actionLine,
);
assert.equal(blockedMessage, false);
assert.equal(actionLine.textContent, "Planta:Uno◆");

for (const [target, expectedEntry] of [
  ["inventory", entries[1]],
  ["verb", entries[2]],
  ["character", entries[3]],
]) {
  const event = root.click(target, () => {
    ordinaryActions += 1;
    state.currentVerb = "changed";
    state.activeCharacter = "changed";
    state.selectedInventoryItem = { id: "changed" };
  });
  assert.equal(event.defaultPrevented, true);
  assert.equal(event.immediatePropagationStopped, true);
  assert.deepEqual(DialogueManager.getCurrentEntry(), expectedEntry);
}

assert.equal(ordinaryActions, 1);
assert.equal(state.currentVerb, "use");
assert.equal(state.activeCharacter, "slot2");
assert.equal(state.selectedInventoryItem.id, "salad");

const closingClick = root.click("action-line", () => {
  ordinaryActions += 1;
});
assert.equal(closingClick.defaultPrevented, true);
assert.equal(DialogueManager.isActive(), false);
assert.equal(DialogueManager.getCurrentEntry(), null);
assert.equal(finishes, 1);
assert.equal(ordinaryActions, 1);
assert.equal(actionLine.textContent, "Ir a...");
assert.equal(actionLine.classList.contains("dialogue-active"), false);
assert.equal(findByClass(actionLine, "dialogue-indicator"), null);

assert.equal(
  InteractionManager.showTemporaryMessage("Mensaje normal", state, actionLine),
  true,
);
assert.equal(actionLine.textContent, "Mensaje normal");

assert.equal(
  DialogueManager.start([{ speaker: "Ryan", text: "Otra conversación" }], {
    state,
    actionLine,
  }),
  true,
);
assert.equal(DialogueManager.getCurrentEntry().speaker, "Ryan");
root.click("canvas");
assert.equal(DialogueManager.isActive(), false);
assert.equal(root.listeners.click.length, 1);

const longDialogue =
  "La descomposiciÃ³n de materia orgÃ¡nica produce gases bastante desagradables. Mejor no investigar.";
assert.equal(
  DialogueManager.start([{ speaker: "Milton", text: longDialogue }], {
    state,
    actionLine,
  }),
  true,
);
assert.equal(findByClass(actionLine, "dialogue-text").textContent, longDialogue);
root.click("action-line");
assert.equal(DialogueManager.isActive(), false);

const dialogueSource = fs.readFileSync("js/game/dialogues.js", "utf8");
assert.doesNotMatch(dialogueSource, /setTimeout|setInterval/);
const gameCss = fs.readFileSync("css/game.css", "utf8");
assert.match(gameCss, /dialogueIndicatorBlink 2s steps\(1, end\) infinite/);
assert.match(gameCss, /#ff1c1c/);
assert.match(gameCss, /#ffe600/);
assert.match(gameCss, /\.dialogue-text\s*\{[^}]*flex:\s*1 1 auto/s);
assert.match(gameCss, /\.dialogue-text\s*\{[^}]*overflow-wrap:\s*break-word/s);
assert.match(gameCss, /\.dialogue-text\s*\{[^}]*word-break:\s*normal/s);
assert.match(gameCss, /\.dialogue-content\s*\{[^}]*min-width:\s*0/s);
assert.match(gameCss, /\.action-line\.dialogue-active\s*\{[^}]*font-size:\s*clamp/s);
assert.match(gameCss, /\.action-line\.dialogue-active\s*\{[^}]*overflow-y:\s*auto/s);

console.log("Interactive dialogue sequencing and input capture: OK");
