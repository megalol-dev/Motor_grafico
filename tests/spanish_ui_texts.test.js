const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

global.window = global;

vm.runInThisContext(fs.readFileSync("js/catalogs/verbs.js", "utf8"), {
  filename: "js/catalogs/verbs.js",
});

assert.equal(VerbManager.getLabel("Walk to"), "Ir a");
assert.equal(VerbManager.getLabel("open"), "Abrir");
assert.equal(VerbManager.getLabel("close"), "Cerrar");
assert.equal(VerbManager.getLabel("pick up"), "Recoger");
assert.equal(VerbManager.getLabel("turn on"), "Encender");
assert.equal(VerbManager.getLabel("turn off"), "Apagar");

assert.equal(VerbManager.formatPrompt("Walk to"), "Ir a...");
assert.equal(VerbManager.formatPrompt("read"), "Leer...");
assert.equal(VerbManager.formatTarget("open", "Puerta"), "Abrir Puerta");
assert.equal(
  VerbManager.formatTarget("talk", "Milton"),
  "Hablar con Milton",
);
assert.equal(
  VerbManager.formatUseWith("Llave", "Puerta"),
  "Usar Llave con Puerta",
);
assert.equal(VerbManager.formatUseWith("Llave"), "Usar Llave con...");

const indexHtml = fs.readFileSync("index.html", "utf8");

assert.match(indexHtml, />Pulsa COMENZAR</);
assert.match(indexHtml, />Comenzar</);
assert.match(indexHtml, /Comenzar partida/);
assert.match(indexHtml, />Ir a\.\.\.<\/div>/);
assert.doesNotMatch(indexHtml, />Pulsa START</);
assert.doesNotMatch(indexHtml, />Start</);
assert.doesNotMatch(indexHtml, /Start Game/);
assert.doesNotMatch(indexHtml, />Walk to \.\.\.</);

console.log("Spanish gameplay UI texts: OK");
