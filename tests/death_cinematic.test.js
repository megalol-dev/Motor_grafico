const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

function load(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  toggle(value, force) {
    if (force === true) this.values.add(value);
    else if (force === false) this.values.delete(value);
    else if (this.values.has(value)) this.values.delete(value);
    else this.values.add(value);
  }
  contains(value) { return this.values.has(value); }
}

const overlay = {
  hidden: true,
  offsetWidth: 1248,
  classList: new FakeClassList(),
};
const message = { textContent: "" };

global.document = {
  getElementById(id) {
    if (id === "death-overlay") return overlay;
    if (id === "death-overlay-message") return message;
    return null;
  },
  querySelectorAll() { return []; },
};

global.InventoryManager = {};
global.StatefulObjectManager = {};
load("js/game/game_state.js");
load("js/game/deaths.js");

async function run() {
  const instant = {
    preDeathDelayMs: 0,
    fadeMs: 0,
    sceneHoldMs: 0,
    typingMs: 0,
    messageHoldMs: 0,
  };

  await DeathManager.fadeToBlack(instant);
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.classList.contains("is-opaque"), true);
  assert.equal(message.textContent, "");

  const defaultTiming = DeathManager.getCinematicTiming();
  assert.equal(defaultTiming.preDeathDelayMs, 2000);
  assert.equal(defaultTiming.sceneHoldMs, 3000);
  assert.equal(defaultTiming.typingMs, 4400);
  assert.equal(defaultTiming.messageHoldMs, 3000);

  const recordedDelays = [];
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (callback, delay) => {
    recordedDelays.push({ delay, text: message.textContent });
    callback();
    return recordedDelays.length;
  };

  await DeathManager.waitBeforeDeath();
  assert.deepEqual(recordedDelays.map((entry) => entry.delay), [2000]);

  recordedDelays.length = 0;
  await DeathManager.typeDeathMessage("AB");
  assert.deepEqual(
    recordedDelays.map((entry) => entry.delay),
    [2200, 2200, 3000],
  );
  assert.equal(recordedDelays[2].text, "AB");
  assert.equal(message.textContent, "AB");

  recordedDelays.length = 0;
  await DeathManager.revealDeathScene();
  global.setTimeout = originalSetTimeout;
  assert.deepEqual(
    recordedDelays.map((entry) => entry.delay),
    [350, 3000, 350],
  );
  assert.equal(overlay.classList.contains("is-opaque"), true);

  await DeathManager.revealDeathScene(instant);
  assert.equal(overlay.classList.contains("is-opaque"), true);

  const deathText = "Milton muriÃ³ por un olor tÃ³xico y nauseabundo.";
  await DeathManager.typeDeathMessage(deathText, instant);
  assert.equal(message.textContent, deathText);

  await DeathManager.fadeFromBlack(instant);
  assert.equal(overlay.hidden, true);
  assert.equal(overlay.classList.contains("is-opaque"), false);
  assert.equal(message.textContent, "");

  const gameSource = fs.readFileSync("js/game.js", "utf8");
  assert.match(gameSource, /murió por un olor tóxico y nauseabundo\./);

  DeathManager.showOverlay("GAME OVER", true);
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.classList.contains("is-opaque"), true);
  assert.equal(overlay.classList.contains("game-over"), true);
  assert.equal(message.textContent, "GAME OVER");

  const gameCss = fs.readFileSync("css/game.css", "utf8");
  assert.match(gameCss, /\.death-overlay\s*\{[^}]*transition:\s*opacity 350ms ease-in-out/s);
  assert.match(gameCss, /\.death-overlay\.is-opaque\s*\{[^}]*opacity:\s*1/s);
  assert.match(gameCss, /\.death-overlay-message\s*\{[^}]*color:\s*#fff/s);

  console.log("Death cinematic fades, typing and cleanup: OK");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
