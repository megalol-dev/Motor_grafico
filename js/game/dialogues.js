// =======================================================
// GESTOR DE DIÁLOGOS INTERACTIVOS
// =======================================================

let dialogueRoot = null;
let dialogueActionLine = null;
let dialogueEntries = [];
let dialogueIndex = -1;
let dialogueState = null;
let dialogueOnFinish = null;

function isDialogueActive() {
  return dialogueIndex >= 0 && dialogueIndex < dialogueEntries.length;
}

function normalizeDialogueEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .filter((entry) => entry?.speaker && entry?.text)
    .map((entry) => ({
      speaker: String(entry.speaker),
      text: String(entry.text),
    }));
}

function pauseGameForDialogue(state) {
  if (!state) return;

  if (state.target) state.target.active = false;
  state.path = [];
  state.pathIndex = 0;
  state.pendingInteraction = null;
  state.pendingHotspot = null;
  state.pendingNpc = null;
  state.pendingNpcDistance = null;
  state.pendingTeleport = null;

  if (state.player) state.player.moving = false;
  state.companions?.forEach((character) => {
    character.moving = false;
  });

  state.messageTimeout = true;
}

function createDialogueElement(tagName, className, text) {
  const documentReference =
    dialogueActionLine?.ownerDocument ?? window.document ?? null;
  const element = documentReference?.createElement?.(tagName);

  if (!element) return null;

  element.classList.add(className);
  element.textContent = text;
  return element;
}

function renderCurrentDialogueEntry() {
  if (!isDialogueActive() || !dialogueActionLine) return false;

  const entry = dialogueEntries[dialogueIndex];
  dialogueActionLine.classList?.add("dialogue-active");

  const content = createDialogueElement("span", "dialogue-content", "");
  const speaker = createDialogueElement(
    "span",
    "dialogue-speaker",
    `${entry.speaker}:`,
  );
  const text = createDialogueElement("span", "dialogue-text", entry.text);
  const indicator = createDialogueElement(
    "span",
    "dialogue-indicator",
    "◆",
  );

  if (
    content &&
    speaker &&
    text &&
    indicator &&
    dialogueActionLine.replaceChildren
  ) {
    indicator.setAttribute?.("aria-hidden", "true");
    content.append(speaker, text, indicator);
    dialogueActionLine.replaceChildren(content);
  } else {
    dialogueActionLine.textContent = `${entry.speaker}: ${entry.text} ◆`;
  }

  return true;
}

function finishDialogue() {
  if (!isDialogueActive()) return false;

  const finishedState = dialogueState;
  const finishedCallback = dialogueOnFinish;

  dialogueEntries = [];
  dialogueIndex = -1;
  dialogueState = null;
  dialogueOnFinish = null;

  dialogueActionLine?.classList?.remove("dialogue-active");
  if (finishedState) finishedState.messageTimeout = null;

  if (typeof finishedCallback === "function") {
    finishedCallback();
  } else if (dialogueActionLine) {
    dialogueActionLine.textContent = window.VerbManager.formatPrompt("Walk to");
  }

  return true;
}

function advanceDialogue() {
  if (!isDialogueActive()) return false;

  if (dialogueIndex >= dialogueEntries.length - 1) {
    return finishDialogue();
  }

  dialogueIndex += 1;
  renderCurrentDialogueEntry();
  return true;
}

function handleDialogueClick(event) {
  if (!isDialogueActive()) return;

  event.preventDefault?.();
  event.stopPropagation?.();
  event.stopImmediatePropagation?.();
  advanceDialogue();
}

function initializeDialogueManager(root, actionLine) {
  if (dialogueRoot !== root) {
    dialogueRoot?.removeEventListener?.("click", handleDialogueClick, true);
    root?.addEventListener?.("click", handleDialogueClick, true);
    dialogueRoot = root ?? null;
  }

  dialogueActionLine = actionLine ?? dialogueActionLine;
}

function startDialogue(entries, options = {}) {
  if (isDialogueActive() || window.ChestManager?.isOpen()) return false;

  const normalizedEntries = normalizeDialogueEntries(entries);
  if (normalizedEntries.length === 0) return false;

  dialogueActionLine = options.actionLine ?? dialogueActionLine;
  if (!dialogueActionLine) return false;

  dialogueEntries = normalizedEntries;
  dialogueIndex = 0;
  dialogueState = options.state ?? null;
  dialogueOnFinish = options.onFinish ?? null;

  pauseGameForDialogue(dialogueState);
  renderCurrentDialogueEntry();
  return true;
}

function getCurrentDialogueEntry() {
  if (!isDialogueActive()) return null;
  return { ...dialogueEntries[dialogueIndex] };
}

window.DialogueManager = {
  initialize: initializeDialogueManager,
  start: startDialogue,
  advance: advanceDialogue,
  finish: finishDialogue,
  isActive: isDialogueActive,
  getCurrentEntry: getCurrentDialogueEntry,
};
