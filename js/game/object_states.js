// =======================================================
// GESTOR DE OBJETOS CON ESTADOS VISUALES
// =======================================================
// Mantiene una sola instancia interactiva y selecciona su sprite según
// `state`. También sincroniza la visibilidad de un contenido vinculado por
// el ID exacto de su instancia de mapa (`containedObjectId`).

function getStatefulObjectDefinition(obj) {
  return (
    window.ObjectLibrary?.find((item) => item.id === obj?.typeId) ?? null
  );
}

function isStatefulObject(obj) {
  return getStatefulObjectDefinition(obj)?.type === "stateful";
}

function isLightSwitch(obj) {
  return obj?.typeId === "!interruptor" && isStatefulObject(obj);
}

function getLightSwitch(mapData) {
  return (
    mapData?.objects?.find(
      (obj) =>
        isLightSwitch(obj) && obj.visible !== false && !obj.collected,
    ) ?? null
  );
}

function isMapDark(mapName, mapData) {
  if (mapName !== "map4") return false;

  const lightSwitch = getLightSwitch(mapData);
  if (!lightSwitch) return false;

  const definition = getStatefulObjectDefinition(lightSwitch);
  return (lightSwitch.state ?? definition?.defaultState) !== "encendido";
}

function getStateSprites(obj) {
  const definition = getStatefulObjectDefinition(obj);
  return obj?.stateSprites ?? definition?.stateSprites ?? null;
}

function applyVisualState(obj) {
  if (!isStatefulObject(obj)) return false;

  const definition = getStatefulObjectDefinition(obj);
  const stateSprites = getStateSprites(obj);
  obj.state ??= definition.defaultState;
  obj.stateSprites ??= { ...stateSprites };

  if (stateSprites?.[obj.state]) {
    obj.sprite = stateSprites[obj.state];
  }

  // El tamaño visual se toma del catálogo; la hitbox permanece independiente
  // para no modificar colisiones de instancias ya colocadas.
  obj.spriteWidth = definition.defaultSpriteWidth;
  obj.spriteHeight = definition.defaultSpriteHeight;

  if (definition.id === "!buzon") {
    GameVariables.set("buzonAbierto", obj.state === "abierto");
  }

  return true;
}

function isAlwaysOnTop(obj) {
  if (!obj) return false;
  if (typeof obj.alwaysOnTop === "boolean") return obj.alwaysOnTop;

  return getStatefulObjectDefinition(obj)?.alwaysOnTop === true;
}

function getWorldRenderSize(obj) {
  const definition = getStatefulObjectDefinition(obj);

  return {
    width:
      obj?.worldRenderWidth ??
      definition?.worldRenderWidth ??
      obj?.spriteWidth ??
      obj?.hitboxWidth ??
      0,
    height:
      obj?.worldRenderHeight ??
      definition?.worldRenderHeight ??
      obj?.spriteHeight ??
      obj?.hitboxHeight ??
      0,
  };
}

function getContainedObject(container, objects) {
  if (!container?.containedObjectId || !Array.isArray(objects)) return null;

  return (
    objects.find((obj) => obj.id === container.containedObjectId) ?? null
  );
}

function syncContainedObject(container, objects) {
  const containedObject = getContainedObject(container, objects);
  if (!containedObject) return null;

  const containerDefinition = getStatefulObjectDefinition(container);

  containedObject.containedBy = container.id;
  containedObject.containedByStatefulTypeId = container.typeId;
  containedObject.interactionAnchorId = container.id;
  containedObject.interactionSide =
    container.containedInteractionSide ??
    containerDefinition?.containedInteractionSide ??
    container.interactionSide ??
    containerDefinition?.interactionSide;
  containedObject.interactionFacing =
    container.containedInteractionFacing ??
    containerDefinition?.containedInteractionFacing ??
    container.interactionFacing ??
    containerDefinition?.interactionFacing;

  const wasCollected =
    containedObject.collected ||
    (container.typeId === "!buzon" &&
      containedObject.typeId === "key" &&
      GameVariables.get("tenemosLlave") === true);

  if (wasCollected) {
    containedObject.collected = true;
    containedObject.visible = false;
  } else {
    containedObject.visible = container.state === "abierto";
  }

  return containedObject;
}

function applyObjectStates(objects) {
  if (!Array.isArray(objects)) return;

  objects.forEach((obj) => applyVisualState(obj));
  objects
    .filter((obj) => isStatefulObject(obj))
    .forEach((obj) => syncContainedObject(obj, objects));
}

function setObjectState(obj, nextState, objects, mapName) {
  const stateSprites = getStateSprites(obj);
  if (!isStatefulObject(obj) || !stateSprites?.[nextState]) return false;

  obj.state = nextState;
  applyVisualState(obj);

  const containedObject = syncContainedObject(obj, objects);
  DoorManager.persistObjectState(obj, mapName);

  if (containedObject) {
    DoorManager.persistObjectState(containedObject, mapName);
  }

  return true;
}

function isMailboxKey(obj) {
  return (
    obj?.typeId === "key" && obj.containedByStatefulTypeId === "!buzon"
  );
}

function getObjectSpriteNames(obj) {
  const names = new Set();
  if (obj?.sprite) names.add(obj.sprite);

  Object.values(getStateSprites(obj) ?? {}).forEach((sprite) => {
    if (sprite) names.add(sprite);
  });

  return [...names];
}

window.StatefulObjectManager = {
  getDefinition: getStatefulObjectDefinition,
  isStatefulObject,
  isLightSwitch,
  getLightSwitch,
  isMapDark,
  getStateSprites,
  applyVisualState,
  getContainedObject,
  syncContainedObject,
  applyObjectStates,
  setObjectState,
  isMailboxKey,
  getObjectSpriteNames,
  isAlwaysOnTop,
  getWorldRenderSize,
};
