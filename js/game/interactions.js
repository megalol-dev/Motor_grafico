// -------------------------------------------------------
// MANAGER DE INTERACCIONES DEL JUEGO
// Centraliza toda la lógica relacionada con objetos,
// hotspots, mensajes temporales, teletransportes e
// interacciones mediante verbos.
// -------------------------------------------------------

// -------------------------------------------------------
// DEVUELVE EL OBJETO SOBRE EL QUE SE HA HECHO CLICK <refactor>
// -------------------------------------------------------
function getObjectAt(worldX, worldY, mapData) {
  if (!mapData?.objects) return null;

  let fallbackObject = null;

  for (let i = mapData.objects.length - 1; i >= 0; i--) {
    const obj = mapData.objects[i];

    if (!obj.visible) continue;
    if (obj.collected) continue;

    const worldRenderSize =
      window.StatefulObjectManager?.getWorldRenderSize(obj) ?? {
        width: obj.spriteWidth ?? obj.hitboxWidth,
        height: obj.spriteHeight ?? obj.hitboxHeight,
      };

    const inside =
      worldX >= obj.x &&
      worldX <= obj.x + worldRenderSize.width &&
      worldY >= obj.y &&
      worldY <= obj.y + worldRenderSize.height;

    if (inside) {
      // Los objetos prioritarios visibles se seleccionan antes que los
      // normales. Entre prioridades iguales se conserva el orden inverso
      // del JSON, igual que antes.
      if (
        (window.StatefulObjectManager?.isAlwaysOnTop(obj) ??
          obj.alwaysOnTop === true)
      ) {
        return obj;
      }

      fallbackObject ??= obj;
    }
  }

  return fallbackObject;
}

function getObjectLibraryItem(obj) {
  if (!obj?.typeId || !window.ObjectLibrary) {
    return null;
  }

  return window.ObjectLibrary.find((item) => item.id === obj.typeId) ?? null;
}

function getObjectName(obj) {
  return getObjectLibraryItem(obj)?.name ?? obj?.name ?? "";
}

function getObjectDescription(obj) {
  const libraryItem = getObjectLibraryItem(obj);

  if (libraryItem?.forceOpenItem) {
    return libraryItem.description;
  }

  return obj.description;
}

function getActiveCharacterFromState(state) {
  if (state.player?.id === state.activeCharacter) {
    return state.player;
  }

  return (
    state.companions?.find(
      (character) => character.id === state.activeCharacter,
    ) ?? state.player
  );
}

function faceActiveCharacter(state, direction) {
  const character = getActiveCharacterFromState(state);

  if (character) {
    character.direction = direction;
  }
}

function faceActiveCharacterTowardsNpc(state, npc) {
  const character = getActiveCharacterFromState(state);
  if (!character || !npc) return;

  const rect = NpcManager.getCollisionRect(npc);
  MovementManager.updateDirectionFromVector(
    rect.x + rect.width / 2 - character.x,
    rect.y + rect.height / 2 - character.y,
    character,
  );
}

function getBlockedByNpcMessage(obj, state) {
  const libraryItem = getObjectLibraryItem(obj);
  const characterTypeId = getActiveCharacterTypeId(state);

  return (
    libraryItem?.blockedByNpcMessages?.[characterTypeId] ??
    `${getObjectName(obj)} estÃ¡ bloqueado por algo que impide alcanzarlo.`
  );
}

function getInvalidUseMessage(selectedItem, targetKind, target) {
  if (!selectedItem) {
    return null;
  }

  if (
    selectedItem.typeId === "028" &&
    targetKind === "npc" &&
    target?.typeId === "NPC_1"
  ) {
    return "No es una buena idea";
  }

  if (
    selectedItem.typeId === "key" &&
    targetKind === "object" &&
    target?.type === "door"
  ) {
    return "Esta llave parece no ser de aquí";
  }

  if (selectedItem.typeId === "028") {
    return "No puedo abrir una puerta a golpes con la barra";
  }

  return null;
}

function getActiveCharacterTypeId(state) {
  return getActiveCharacterFromState(state)?.sprite?.toLowerCase() ?? null;
}

function getNpcTalkMessage(npc, state) {
  if (npc?.typeId !== "NPC_1" || !NpcManager.isActive(npc)) {
    return "No parece tener nada que decir";
  }

  return (
    getNpcTalkDialogue(npc, state)[0]?.text ??
    "No parece tener nada que decir"
  );
}

function getNpcTalkDialogue(npc, state) {
  if (npc?.typeId !== "NPC_1" || !NpcManager.isActive(npc)) return [];

  const plantDialogues = {
    pj1: {
      speaker: "Ryan",
      opening: "¡Cuidado! ¡Una planta carnívora!",
      closing: "Efectivamente, no parece buena idea acercarse.",
    },
    pj2: {
      speaker: "April",
      opening: "Qué colores tan increíbles... aunque esos dientes dan miedo.",
      closing: "Creo que esta planta no quiere que le haga un retrato.",
    },
    pj3: {
      speaker: "Milton",
      opening: "Interesante... Una especie carnívora. Mejor no acercarse demasiado.",
      closing: "Interesante... Su sistema digestivo parece bastante agresivo.",
    },
    pj4: {
      speaker: "Hank",
      opening: "¿Y si le doy un puñetazo?",
      closing: "¡Eh, tranquila! ¡Que yo no soy tu cena!",
    },
    pj5: {
      speaker: "Spike",
      opening: "¡Ja! Esta planta tiene más mala leche que yo.",
      closing: "Vale, vale... ¡Tampoco hacía falta ponerse así!",
    },
    pj6: {
      speaker: "Robin",
      opening: "Tranquila, pequeña. Sé que puedes entenderme.",
      closing: "Tranquila, te buscaré algo de comer.",
    },
  };
  const characterTypeId = getActiveCharacterTypeId(state);
  const dialogue = plantDialogues[characterTypeId];

  if (!dialogue) return [];

  return [
    { speaker: dialogue.speaker, text: dialogue.opening },
    {
      speaker: "Planta carnívora",
      text:
        characterTypeId === "pj6"
          ? "Tengo hambre... ¡Tengo mucha hambre!"
          : "¡Guaaaaargh!",
    },
    { speaker: dialogue.speaker, text: dialogue.closing },
  ];
}

function handlePlantSalad(npc, state, actionLine) {
  if (
    npc?.typeId !== "NPC_1" ||
    state.selectedInventoryItem?.typeId !== "007"
  ) {
    return false;
  }

  const characterTypeId = getActiveCharacterTypeId(state);
  const refusalMessages = {
    pj1: "No creo que sea buena idea darle esto a una planta carnívora.",
    pj2: "Prefiero conservarla. Es un adorno demasiado bonito.",
    pj3: "Su dieta es carnívora. Esta ensalada no parece una opción adecuada.",
    pj4: "¿Ensalada? ¡Esta planta necesita algo más contundente!",
    pj5: "Ni hablar. No voy a darle mi comida a esa cosa.",
  };

  if (characterTypeId !== "pj6") {
    InteractionManager.showTemporaryMessage(
      refusalMessages[characterTypeId] ??
        "No parece una buena idea darle la ensalada.",
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return true;
  }

  if (NpcManager.isPlantEventPending(npc)) {
    return true;
  }

  const salad = state.selectedInventoryItem;
  const friendshipCharacterSlot = state.activeCharacter;
  const activeInventory = InventoryManager.getActiveInventory(state);
  const plantItem = NpcManager.createInventoryItem("NPC_1");
  const canBefriendPlant =
    GameVariables.get("plantaViva") === true &&
    GameVariables.get("plantaAmiga") === false &&
    activeInventory.includes(salad) &&
    InventoryManager.canAddItemToInventory(
      state,
      friendshipCharacterSlot,
      plantItem,
      salad,
    );

  if (!canBefriendPlant) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return true;
  }

  NpcManager.setFriendshipEventPending(npc, true);
  EventsManager.selectDefaultVerb(state, actionLine, true);
  const dialogueStarted = DialogueManager.start(
    [
      { speaker: "Planta", text: "¡Oh! ¡Qué hambre tenía!" },
      { speaker: "Planta", text: "¡Qué rica ensalada!" },
      {
        speaker: "Planta",
        text: "Me aburro mucho aquí en esta mansión...",
      },
      {
        speaker: "Robin",
        text: "Pues vente conmigo. ¡En mi casa estarás mucho mejor!",
      },
    ],
    {
      state,
      actionLine,
      onFinish() {
        NpcManager.stopOverlayAnimation(npc);
        NpcManager.setFriendshipEventPending(npc, false);

        const inventory = InventoryManager.getCharacterInventory(
          state,
          friendshipCharacterSlot,
        );
        const canCompleteFriendship =
          GameVariables.get("plantaViva") === true &&
          GameVariables.get("plantaAmiga") === false &&
          inventory.includes(salad) &&
          InventoryManager.canAddItemToInventory(
            state,
            friendshipCharacterSlot,
            plantItem,
            salad,
          );

        if (canCompleteFriendship) {
          const exchanged = InventoryManager.replaceInventoryItem(
            state,
            friendshipCharacterSlot,
            salad,
            plantItem,
            actionLine,
          );

          if (exchanged) {
            GameVariables.set("plantaAmiga", true);
          }
        }

        if (actionLine) {
          actionLine.textContent = window.VerbManager.formatPrompt("Walk to");
        }
      },
    },
  );

  if (!dialogueStarted) {
    NpcManager.setFriendshipEventPending(npc, false);
    return true;
  }

  NpcManager.startOverlayAnimation(npc, "love");

  return true;
}

function handlePlantInsecticide(npc, state, actionLine) {
  if (
    npc?.typeId !== "NPC_1" ||
    state.selectedInventoryItem?.typeId !== "006"
  ) {
    return false;
  }

  if (!NpcManager.isActive(npc)) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return true;
  }

  if (NpcManager.isPlantEventPending(npc)) {
    return true;
  }

  if (getActiveCharacterTypeId(state) === "pj6") {
    InteractionManager.showTemporaryMessage(
      "¡No pienso hacerle daño a una planta!",
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return true;
  }

  const inventory = InventoryManager.getActiveInventory(state);

  if (!inventory.includes(state.selectedInventoryItem)) {
    return false;
  }

  NpcManager.setInsecticideEventPending(npc, true);
  const animationStarted = NpcManager.startOverlayAnimation(
    npc,
    "insecticide",
    () => {
      NpcManager.setInsecticideEventPending(npc, false);

      if (
        GameVariables.get("plantaViva") === true &&
        GameVariables.get("plantaAmiga") === false
      ) {
        GameVariables.set("plantaViva", false);
      }

      InteractionManager.showTemporaryMessage(
        "La planta murió.",
        state,
        actionLine,
      );
    },
  );

  if (!animationStarted) {
    NpcManager.setInsecticideEventPending(npc, false);
    return false;
  }

  const consumed = InventoryManager.consumeSelectedInventoryItem(
    state,
    actionLine,
  );
  if (!consumed) {
    NpcManager.stopOverlayAnimation(npc);
    NpcManager.setInsecticideEventPending(npc, false);
    return false;
  }

  EventsManager.selectDefaultVerb(state, actionLine, true);

  return true;
}

// -------------------------------------------------------
// DEVUELVE EL HOTSPOT SITUADO EN UNA POSICIÓN DEL MAPA <refactor>
// -------------------------------------------------------
function getHotspotAt(worldX, worldY, mapData) {
  if (!mapData?.hotspots) {
    return null;
  }

  // Recorremos desde el último para respetar el orden
  // cuando existan varios hotspots superpuestos.
  for (let i = mapData.hotspots.length - 1; i >= 0; i -= 1) {
    const hotspot = mapData.hotspots[i];

    const inside =
      worldX >= hotspot.x &&
      worldX <= hotspot.x + hotspot.width &&
      worldY >= hotspot.y &&
      worldY <= hotspot.y + hotspot.height;

    if (inside) {
      return hotspot;
    }
  }

  return null;
}

// -------------------------------------------------------
// DEVUELVE LOS DATOS DEL CATÁLOGO DE UN HOTSPOT <refactor>
// -------------------------------------------------------
function getHotspotLibraryItem(hotspot) {
  if (!hotspot?.typeId || !window.HotspotLibrary) {
    return null;
  }

  return (
    window.HotspotLibrary.find((item) => item.id === hotspot.typeId) ?? null
  );
}

function getNpcAt(worldX, worldY, mapData) {
  if (!Array.isArray(mapData?.npcs)) return null;

  for (let i = mapData.npcs.length - 1; i >= 0; i -= 1) {
    const npc = mapData.npcs[i];
    if (!NpcManager.isActive(npc)) continue;

    const libraryItem = NpcManager.getLibraryItem(npc);
    if (!libraryItem?.interactive) continue;

    const size = NpcManager.getSpriteSize(npc);
    const inside =
      worldX >= npc.x &&
      worldX <= npc.x + size.width &&
      worldY >= npc.y &&
      worldY <= npc.y + size.height;

    if (inside) return npc;
  }

  return null;
}

function blockInteractionInDarkness(
  target,
  state,
  actionLine,
  currentMapName,
  mapData,
) {
  if (
    !window.StatefulObjectManager?.isMapDark?.(currentMapName, mapData)
  ) {
    return false;
  }

  const verb = state.currentVerb.toLowerCase();
  const isUsableLightSwitch =
    window.StatefulObjectManager?.getLightSwitch?.(mapData) === target &&
    ["use", "turn on", "turn off"].includes(verb);
  const isMapExit =
    mapData?.objects?.includes(target) &&
    target?.type === "door" &&
    typeof target.teleportTo === "string" &&
    target.teleportTo.length > 0 &&
    target.teleportTo !== currentMapName &&
    ["walk to", "open", "use"].includes(verb);

  if (isUsableLightSwitch || isMapExit) {
    return false;
  }

  state.target && (state.target.active = false);
  state.path = [];
  state.pathIndex = 0;
  EventsManager.cancelPendingInteractions(state);
  EventsManager.selectDefaultVerb(state, actionLine, true);
  InteractionManager.showTemporaryMessage(
    "Está muy oscuro, no veo nada.",
    state,
    actionLine,
  );
  return true;
}

function handleNpcInteraction(
  npc,
  state,
  actionLine,
  getVerbLabel,
  currentMapName = null,
  mapData = null,
) {
  if (
    blockInteractionInDarkness(
      npc,
      state,
      actionLine,
      currentMapName,
      mapData,
    )
  ) {
    return;
  }

  const libraryItem = NpcManager.getLibraryItem(npc);
  if (!libraryItem || !NpcManager.isActive(npc)) {
    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    return;
  }

  const verb = state.currentVerb.toLowerCase();

  if (verb === "use" && handlePlantSalad(npc, state, actionLine)) {
    return;
  }

  if (verb === "use" && handlePlantInsecticide(npc, state, actionLine)) {
    return;
  }

  if (verb === "talk") {
    const dialogue = getNpcTalkDialogue(npc, state);

    EventsManager.selectDefaultVerb(state, actionLine, true);

    if (dialogue.length > 0) {
      DialogueManager.start(dialogue, { state, actionLine });
    } else {
      InteractionManager.showTemporaryMessage(
        getNpcTalkMessage(npc, state),
        state,
        actionLine,
      );
    }

    return;
  }

  const invalidUseMessage =
    verb === "use"
      ? getInvalidUseMessage(state.selectedInventoryItem, "npc", npc)
      : null;
  const message = invalidUseMessage ??
    (verb === "what is"
      ? libraryItem.description
      : `${getVerbLabel(state.currentVerb)} ${libraryItem.name}`);

  InteractionManager.showTemporaryMessage(message, state, actionLine);
  InventoryManager.clearSelectedInventoryItem(state, actionLine);
  EventsManager.selectDefaultVerb(state, actionLine, true);
}

// -------------------------------------------------------
// MUESTRA UN MENSAJE TEMPORAL EN LA ACTION LINE <refactor>
// -------------------------------------------------------
function showTemporaryMessage(text, state, actionLine) {
  if (window.DialogueManager?.isActive()) {
    return false;
  }

  // Cancelar un posible temporizador antiguo
  if (state.messageTimeout) {
    clearTimeout(state.messageTimeout);
    state.messageTimeout = null;
  }

  if (actionLine) {
    actionLine.textContent = text;
  }

  // Marcar que hay un mensaje temporal activo
  state.messageTimeout = true;
  return true;
}

// -------------------------------------------------------
// INTERACCIÓN CON HOTSPOTS
// -------------------------------------------------------
function handleHotspotInteraction(
  hotspot,
  state,
  actionLine,
  currentMapName = null,
  mapData = null,
) {
  if (
    blockInteractionInDarkness(
      hotspot,
      state,
      actionLine,
      currentMapName,
      mapData,
    )
  ) {
    return;
  }

  const hotspotItem = InteractionManager.getHotspotLibraryItem(hotspot);

  if (!hotspotItem) return;

  const verb = state.currentVerb.toLowerCase();

  
  // WHAT IS
  if (verb === "what is") {
    InteractionManager.showTemporaryMessage(
      hotspotItem.description,
      state,
      actionLine,
    );

    EventsManager.selectDefaultVerb(state, actionLine, true);

    return;
  }

  if (verb === "use") {
    const message = getInvalidUseMessage(
      state.selectedInventoryItem,
      "hotspot",
      hotspot,
    );

    if (message) {
      InteractionManager.showTemporaryMessage(message, state, actionLine);
    } else if (actionLine) {
      actionLine.textContent = window.VerbManager.formatTarget(
        state.currentVerb,
        hotspotItem.name,
      );
    }

    InventoryManager.clearSelectedInventoryItem(state, actionLine);
    return;
  }

  // ---------------------------------------------------
  // RESTO DE VERBOS
  // ---------------------------------------------------
  if (actionLine) {
    actionLine.textContent = window.VerbManager.formatTarget(
      state.currentVerb,
      hotspotItem.name,
    );
  }

}

// -------------------------------------------------------
// INTERACCIÓN CON OBJETOS / VERBOS
// -------------------------------------------------------
function handleObjectInteraction(
  obj,
  state,
  actionLine,
  currentMapName,
  mapData,
  ctx,
  canvas,
  mapImageLoaded,
  mapImage,
  objectSprites,
  playerSprites,
  foregroundGraphicSprites,
  npcSprites,
  MAP_SCALE,
  PLAYER_SCALE,
  FRAME_WIDTH,
  FRAME_HEIGHT,
  getVerbLabel,
  changeMap,
) {
  const verb = state.currentVerb.toLowerCase();
  const libraryItem = getObjectLibraryItem(obj);
  const requiredItem = obj.requiredItem ?? libraryItem?.requiredItem ?? null;
  const interactionFacing =
    obj.interactionFacing ?? libraryItem?.interactionFacing;

  if (
    blockInteractionInDarkness(
      obj,
      state,
      actionLine,
      currentMapName,
      mapData,
    )
  ) {
    return false;
  }

  const blockingNpc =
    window.NpcManager?.getBlockingNpcForObject?.(obj, mapData) ?? null;
  if (blockingNpc && ["walk to", "pick up"].includes(verb)) {
    faceActiveCharacterTowardsNpc(state, blockingNpc);
    InteractionManager.showTemporaryMessage(
      getBlockedByNpcMessage(obj, state),
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return false;
  }

  if (["up", "down", "left", "right"].includes(interactionFacing)) {
    faceActiveCharacter(state, interactionFacing);
  }

  // Usar un objeto del inventario sobre el cofre es una combinación, no una
  // orden directa para abrirlo. Esta comprobación debe preceder a USE y OPEN.
  if (
    libraryItem?.id === "000" &&
    state.selectedInventoryItem &&
    (verb === "use" || verb === "open")
  ) {
    InteractionManager.showTemporaryMessage(
      "No puedo usar eso con el Cofre Mágico",
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return;
  }

  // ---------------------------------------------------
  // WALK TO SOBRE UNA PUERTA ABIERTA
  // ---------------------------------------------------
  console.log(obj.id, "opened =", obj.opened, "pair =", obj.doorPair);
  if (
    verb === "walk to" &&
    obj.type === "door" &&
    obj.opened &&
    obj.teleportTo
  ) {
    changeMap(
      obj.teleportTo,
      obj.teleportX,
      obj.teleportY,
      obj.teleportDirection ?? "down",
    );

    return;
  }

  // ---------------------------------------------------
  // WHAT IS
  // ---------------------------------------------------
  if (verb === "what is") {
    InteractionManager.showTemporaryMessage(
      getObjectDescription(obj),
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);
    return;
  }

  // ---------------------------------------------------
  // PICK UP
  // ---------------------------------------------------
  if (verb === "pick up") {
    return InventoryManager.handlePickUp(
      obj,
      state,
      actionLine,
      currentMapName,
    );
  }

  // ---------------------------------------------------
  // USE
  // ---------------------------------------------------
  if (
    window.StatefulObjectManager?.isLightSwitch?.(obj) &&
    ["use", "turn on", "turn off"].includes(verb)
  ) {
    const requestedState =
      verb === "turn on"
        ? "encendido"
        : verb === "turn off"
          ? "apagado"
          : obj.state === "encendido"
            ? "apagado"
            : "encendido";

    if (obj.state === requestedState) {
      InteractionManager.showTemporaryMessage(
        requestedState === "encendido"
          ? "Ya está encendido."
          : "Ya está apagado.",
        state,
        actionLine,
      );
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return true;
    }

    StatefulObjectManager.setObjectState(
      obj,
      requestedState,
      mapData?.objects,
      currentMapName,
    );
    InteractionManager.showTemporaryMessage(
      requestedState === "encendido"
        ? "Has encendido la luz."
        : "Has apagado la luz.",
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);

    RenderManager.render(
      ctx,
      canvas,
      mapImageLoaded,
      mapImage,
      state,
      mapData,
      objectSprites,
      playerSprites,
      MAP_SCALE,
      PLAYER_SCALE,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      state.companions.find((c) => c.id === state.activeCharacter) ??
        state.player,
      foregroundGraphicSprites,
      npcSprites,
    );

    return true;
  }

  if (verb === "use") {
    if (libraryItem?.id === "000") {
      faceActiveCharacter(state, "up");
      ChestManager.open(state, actionLine);
      return;
    }

    // ¿Se ha seleccionado un objeto del inventario?
    if (!state.selectedInventoryItem) {
      if (actionLine) {
        actionLine.textContent = "¿Usar qué?";
      }

      return;
    }

    // -------------------------------------------------
    // PUERTA SIN POMO: FORZAR CON LA BARRA DE METAL
    // -------------------------------------------------
    if (
      libraryItem?.forceOpenItem &&
      state.selectedInventoryItem.typeId === libraryItem.forceOpenItem
    ) {
      if (DoorManager.isDoorForcedOpen(obj.doorPair)) {
        InteractionManager.showTemporaryMessage(
          "La puerta ya está abierta y forzada.",
          state,
          actionLine,
        );
      } else {
        faceActiveCharacter(state, "right");
        DoorManager.forceDoorOpen(obj.doorPair, mapData?.objects);
        DoorManager.persistObjectState(obj, currentMapName);

        InteractionManager.showTemporaryMessage(
          "Con la barra de metal consigo forzar la puerta.",
          state,
          actionLine,
        );
      }

      EventsManager.selectDefaultVerb(state, actionLine, true);

      RenderManager.render(
        ctx,
        canvas,
        mapImageLoaded,
        mapImage,
        state,
        mapData,
        objectSprites,
        playerSprites,
        MAP_SCALE,
        PLAYER_SCALE,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        state.companions.find((c) => c.id === state.activeCharacter) ??
          state.player,
        foregroundGraphicSprites,
        npcSprites,
      );

      return;
    }

    // -------------------------------------------------
    // ¿Este objeto necesita una llave?
    // -------------------------------------------------
    if (
      requiredItem &&
      state.selectedInventoryItem.typeId === requiredItem
    ) {
      if (libraryItem?.id === "door_0") {
        faceActiveCharacter(state, "up");
      }

      const unlockOnly = libraryItem?.unlockOnly === true;

      // La puerta principal conserva su patrón de apertura inmediata. Las
      // puertas `unlockOnly` quedan cerradas y listas para Abrir después.
      DoorManager.setDoorState(
        obj.doorPair,
        unlockOnly ? obj.opened : true,
        false,
        mapData?.objects,
      );

      // Guardar el nuevo estado de esta puerta
      DoorManager.persistObjectState(obj, currentMapName);

      if (actionLine) {
        InteractionManager.showTemporaryMessage(
          unlockOnly
            ? "La puerta está desbloqueada."
            : `${getObjectName(obj)} se ha abierto.`,
          state,
          actionLine,
        );
      }

      EventsManager.selectDefaultVerb(state, actionLine, true);

      RenderManager.render(
        ctx,
        canvas,
        mapImageLoaded,
        mapImage,
        state,
        mapData,
        objectSprites,
        playerSprites,
        MAP_SCALE,
        PLAYER_SCALE,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        state.companions.find((c) => c.id === state.activeCharacter) ??
          state.player,
        foregroundGraphicSprites,
        npcSprites,
      );

      return;
    }

    // -------------------------------------------------
    // Objeto incorrecto
    // -------------------------------------------------
    const message =
      getInvalidUseMessage(state.selectedInventoryItem, "object", obj) ??
      `No puedo usar ${state.selectedInventoryItem.name} con ${getObjectName(obj)}.`;

    InteractionManager.showTemporaryMessage(message, state, actionLine);

    EventsManager.selectDefaultVerb(state, actionLine, true);

    return;
  }

  // ---------------------------------------------------
  // OPEN
  // ---------------------------------------------------
  if (verb === "open") {
    if (libraryItem?.id === "000") {
      faceActiveCharacter(state, "up");
      ChestManager.open(state, actionLine);
      return;
    }

    if (libraryItem?.id === "!buzon") {
      if (obj.state === "abierto") {
        InteractionManager.showTemporaryMessage(
          "El buzón ya está abierto.",
          state,
          actionLine,
        );
      } else {
        StatefulObjectManager.setObjectState(
          obj,
          "abierto",
          mapData?.objects,
          currentMapName,
        );
        InteractionManager.showTemporaryMessage(
          "Has abierto el buzón.",
          state,
          actionLine,
        );
      }

      RenderManager.render(
        ctx,
        canvas,
        mapImageLoaded,
        mapImage,
        state,
        mapData,
        objectSprites,
        playerSprites,
        MAP_SCALE,
        PLAYER_SCALE,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        state.companions.find((c) => c.id === state.activeCharacter) ??
          state.player,
        foregroundGraphicSprites,
        npcSprites,
      );
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return;
    }

    if (obj.type !== "door") {
      actionLine.textContent = `No puedo abrir ${getObjectName(obj)}.`;
      return;
    }

    if (obj.opened) {
      actionLine.textContent = `${getObjectName(obj)} ya está abierta.`;
      return;
    }

    if (DoorManager.requiresForcedOpen(obj.doorPair)) {
      const libraryItem = getObjectLibraryItem(obj);
      const message = libraryItem?.forceOpenItem
        ? "No puedo abrirla, no tiene pomo."
        : "No puedo abrirla, está bloqueada desde el otro lado.";

      InteractionManager.showTemporaryMessage(message, state, actionLine);
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return;
    }

    // Solo la puerta con llave
    if (requiredItem && obj.locked) {
      actionLine.textContent =
        libraryItem?.id === "door_8"
          ? "Está cerrada con llave."
          : "Parece que está cerrada con llave.";
      return;
    }

    // Puertas normales
    DoorManager.setDoorState(obj.doorPair, true, false, mapData?.objects);

    RenderManager.render(
      ctx,
      canvas,
      mapImageLoaded,
      mapImage,
      state,
      mapData,
      objectSprites,
      playerSprites,
      MAP_SCALE,
      PLAYER_SCALE,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      state.companions.find((c) => c.id === state.activeCharacter) ??
        state.player,
      foregroundGraphicSprites,
      npcSprites,
    );

    InteractionManager.showTemporaryMessage(
  `${getObjectName(obj)} se ha abierto.`,
  state,
  actionLine,
);

EventsManager.selectDefaultVerb(state, actionLine, true);;

    return;
  }

  // ---------------------------------------------------
  // CLOSE
  // ---------------------------------------------------
  if (verb === "close") {
    if (libraryItem?.id === "!buzon") {
      if (obj.state === "cerrado") {
        InteractionManager.showTemporaryMessage(
          "El buzón ya está cerrado.",
          state,
          actionLine,
        );
      } else {
        StatefulObjectManager.setObjectState(
          obj,
          "cerrado",
          mapData?.objects,
          currentMapName,
        );
        InteractionManager.showTemporaryMessage(
          "Has cerrado el buzón.",
          state,
          actionLine,
        );
      }

      RenderManager.render(
        ctx,
        canvas,
        mapImageLoaded,
        mapImage,
        state,
        mapData,
        objectSprites,
        playerSprites,
        MAP_SCALE,
        PLAYER_SCALE,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        state.companions.find((c) => c.id === state.activeCharacter) ??
          state.player,
        foregroundGraphicSprites,
        npcSprites,
      );
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return;
    }

    if (obj.type !== "door") {
      InteractionManager.showTemporaryMessage(
        `No puedo cerrar ${getObjectName(obj)}.`,
        state,
        actionLine,
      );
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return;
    }

    if (DoorManager.isDoorForcedOpen(obj.doorPair)) {
      InteractionManager.showTemporaryMessage(
        "La puerta ha quedado forzada y ya no se puede cerrar.",
        state,
        actionLine,
      );
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return;
    }

    if (!obj.opened) {
      InteractionManager.showTemporaryMessage(
        "La puerta ya está cerrada.",
        state,
        actionLine,
      );
      EventsManager.selectDefaultVerb(state, actionLine, true);
      return;
    }

    const requiresItem = window.ObjectLibrary?.some(
      (item) =>
        item.type === "door" &&
        item.doorPair === obj.doorPair &&
        Boolean(item.requiredItem) &&
        item.relockOnClose !== false,
    );

    DoorManager.setDoorState(
      obj.doorPair,
      false,
      Boolean(requiresItem),
      mapData?.objects,
    );
    DoorManager.persistObjectState(obj, currentMapName);

    RenderManager.render(
      ctx,
      canvas,
      mapImageLoaded,
      mapImage,
      state,
      mapData,
      objectSprites,
      playerSprites,
      MAP_SCALE,
      PLAYER_SCALE,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      state.companions.find((c) => c.id === state.activeCharacter) ??
        state.player,
      foregroundGraphicSprites,
      npcSprites,
    );

    InteractionManager.showTemporaryMessage(
      "Puerta se ha cerrado.",
      state,
      actionLine,
    );
    EventsManager.selectDefaultVerb(state, actionLine, true);

    return;
  }

  // ---------------------------------------------------
  // RESTO DE VERBOS
  // ---------------------------------------------------
  if (actionLine) {
    actionLine.textContent = `${getVerbLabel(state.currentVerb)} ${getObjectName(obj)}`;
  }
}

// -------------------------------------------------------
// Manager
// -------------------------------------------------------
window.InteractionManager = {
  getObjectAt,
  getObjectLibraryItem,
  getObjectName,
  getObjectDescription,
  getActiveCharacterFromState,
  faceActiveCharacter,
  faceActiveCharacterTowardsNpc,
  getBlockedByNpcMessage,
  getInvalidUseMessage,
  getActiveCharacterTypeId,
  getNpcTalkMessage,
  getNpcTalkDialogue,
  blockInteractionInDarkness,
  handlePlantSalad,
  handlePlantInsecticide,
  getHotspotAt,
  getHotspotLibraryItem,
  getNpcAt,
  showTemporaryMessage,
  handleHotspotInteraction,
  handleNpcInteraction,
  handleObjectInteraction,
};
