// =======================================================
// GESTOR DE PUERTAS Y ESTADO DE OBJETOS
// =======================================================
//
// Este módulo centraliza toda la lógica relacionada con:
//
// - Estado global de las puertas.
// - Sincronización de puertas enlazadas.
// - Persistencia del estado de los objetos.
// - Restauración del estado al cambiar de mapa.
//
// El motor principal (game.js) únicamente llama a este
// gestor y le proporciona la información necesaria.
// Este módulo no accede directamente a variables del
// motor como currentMapName o mapData.
//
// =======================================================

// -------------------------------------------------------
// OBTENER ESTADO DE UN MAPA 
// -------------------------------------------------------
function getMapState(mapName) {
  if (!GameState.maps[mapName]) {
    GameState.maps[mapName] = {
      objects: {},
    };
  }

  return GameState.maps[mapName];
}

// -------------------------------------------------------
// OBTENER ESTADO DE UN OBJETO 
// -------------------------------------------------------
function getObjectState(mapName, objectId) {
  const mapState = getMapState(mapName);

  if (!mapState.objects[objectId]) {
    mapState.objects[objectId] = {};
  }

  return mapState.objects[objectId];
}

// -------------------------------------------------------
// OBTENER ESTADO GLOBAL DE UNA PUERTA 
// -------------------------------------------------------
function getDoorState(doorPair) {
  if (!doorPair) {
    return null;
  }

  // Seguridad: crear el almacén de puertas si no existe
  GameState.doors ??= {};

  if (!GameState.doors[doorPair]) {
    GameState.doors[doorPair] = {
      opened: false,
      locked: true,
    };
  }

  return GameState.doors[doorPair];
}

// -------------------------------------------------------
// SINCRONIZA UNA PUERTA CON SU ESTADO GLOBAL 
// -------------------------------------------------------
function syncDoorState(obj) {
  if (obj.type !== "door" || !obj.doorPair) {
    return;
  }

  const doorState = getDoorState(obj.doorPair);

  obj.opened = doorState.opened;
  obj.locked = doorState.locked;

  // Cerrada: se interactúa desde delante.
  // Abierta: se puede entrar en la zona del portal.
  obj.interactionMode = obj.opened ? (obj.teleportMode ?? "inside") : "front";
}

// -------------------------------------------------------
// SINCRONIZAR TODAS LAS PUERTAS DEL MAPA 
// -------------------------------------------------------
function syncAllDoors(objects) {
  if (!Array.isArray(objects)) {
    return;
  }

  objects.forEach((obj) => {
    syncDoorState(obj);
  });
}

// -------------------------------------------------------
// CAMBIA EL ESTADO DE UNA PUERTA Y SINCRONIZA EL MAPA 
// -------------------------------------------------------
function setDoorState(doorPair, opened, locked, objects) {
  if (!doorPair) {
    return;
  }

  const doorState = getDoorState(doorPair);

  doorState.opened = opened;
  doorState.locked = locked;

  syncAllDoors(objects);
}

// -------------------------------------------------------
// CREA UNA COPIA SERIALIZABLE DE UN VALOR 
// -------------------------------------------------------
function cloneSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

// ----------------------------------------------------------------------
// GUARDA AUTOMÁTICAMENTE EL ESTADO COMPLETO DE UN OBJETO 
// ----------------------------------------------------------------------
function persistObjectState(obj, mapName) {
  if (!obj?.id) {
    console.warn("No se puede guardar un objeto sin id.");
    return;
  }

  const mapState = getMapState(mapName);

  mapState.objects[obj.id] = cloneSerializable(obj);
}

// -------------------------------------------------------
// APLICAR ESTADOS PERSISTENTES A LOS OBJETOS DEL MAPA
// -------------------------------------------------------
function applyPersistentObjectStates(mapName, objects) {
  if (!objects) {
    return;
  }

  const savedObjects = GameState.maps[mapName]?.objects ?? {};

  objects.forEach((obj) => {
    const savedObject = savedObjects[obj.id];

    if (savedObject) {
      Object.assign(obj, cloneSerializable(savedObject));
    }

    syncDoorState(obj);
  });
}

// -------------------------------------------------------
// MANAGER
// -------------------------------------------------------
window.DoorManager = {
  getMapState,
  getObjectState,
  getDoorState,
  syncDoorState,
  syncAllDoors,
  setDoorState,
  cloneSerializable,
  persistObjectState,
  applyPersistentObjectStates,
};
