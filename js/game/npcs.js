// =======================================================
// GESTOR DE NPC
// =======================================================

const activeOverlayNpcs = new Set();

function getNpcLibraryItem(npcOrTypeId) {
  const typeId =
    typeof npcOrTypeId === "string" ? npcOrTypeId : npcOrTypeId?.typeId;

  return window.NpcLibrary?.find((item) => item.id === typeId) ?? null;
}

function isNpcActive(npc) {
  if (npc?.typeId === "NPC_1") {
    return (
      window.GameVariables?.get("plantaViva") !== false &&
      window.GameVariables?.get("plantaAmiga") !== true
    );
  }

  return true;
}

function getBlockingNpcForObject(obj, mapData) {
  if (!obj?.blockedByNpcId || !Array.isArray(mapData?.npcs)) return null;

  const npc = mapData.npcs.find((item) => item.id === obj.blockedByNpcId);
  return npc && NpcManager.isActive(npc) ? npc : null;
}

function createNpcInventoryItem(npcOrTypeId) {
  const definition = getNpcLibraryItem(npcOrTypeId)?.inventoryItem;

  if (!definition) return null;

  return {
    ...definition,
    inventoryFrame: definition.inventoryFrame
      ? { ...definition.inventoryFrame }
      : undefined,
  };
}

function cloneNpcCollision(collision) {
  return {
    offsetX: Number(collision?.offsetX) || 0,
    offsetY: Number(collision?.offsetY) || 0,
    width: Math.max(1, Number(collision?.width) || 1),
    height: Math.max(1, Number(collision?.height) || 1),
  };
}

function normalizeNpcInstance(npc) {
  const libraryItem = NpcManager.getLibraryItem(npc);
  if (!libraryItem) return npc;

  npc.collision = NpcManager.cloneCollision(
    npc.collision ?? libraryItem.defaultCollision,
  );
  npc._animationElapsed ??= 0;
  npc._animationFrame ??= 0;
  npc._overlayAnimationId ??= null;
  npc._overlayAnimationElapsed ??= 0;
  npc._overlayAnimationFrame ??= 0;
  npc._overlayAnimationOnComplete ??= null;
  npc._friendshipEventPending ??= false;
  npc._insecticideEventPending ??= false;

  return npc;
}

function getOverlayAnimationDefinition(npc, animationId = null) {
  const id = animationId ?? npc?._overlayAnimationId;
  if (!id) return null;

  return NpcManager.getLibraryItem(npc)?.overlayAnimations?.[id] ?? null;
}

function startOverlayAnimation(npc, animationId, onComplete = null) {
  if (!npc || !NpcManager.getOverlayAnimationDefinition(npc, animationId)) {
    return false;
  }

  NpcManager.normalizeInstance(npc);
  npc._overlayAnimationId = animationId;
  npc._overlayAnimationElapsed = 0;
  npc._overlayAnimationFrame = 0;
  npc._overlayAnimationOnComplete =
    typeof onComplete === "function" ? onComplete : null;
  activeOverlayNpcs.add(npc);
  return true;
}

function stopOverlayAnimation(npc) {
  if (!npc) return false;

  npc._overlayAnimationId = null;
  npc._overlayAnimationElapsed = 0;
  npc._overlayAnimationFrame = 0;
  npc._overlayAnimationOnComplete = null;
  activeOverlayNpcs.delete(npc);
  return true;
}

function isOverlayAnimationActive(npc, animationId = null) {
  if (!npc?._overlayAnimationId) return false;
  return animationId ? npc._overlayAnimationId === animationId : true;
}

function setFriendshipEventPending(npc, pending) {
  if (!npc) return false;
  npc._friendshipEventPending = pending === true;
  return true;
}

function isFriendshipEventPending(npc) {
  return npc?._friendshipEventPending === true;
}

function setInsecticideEventPending(npc, pending) {
  if (!npc) return false;
  npc._insecticideEventPending = pending === true;
  return true;
}

function isInsecticideEventPending(npc = null) {
  if (npc) return npc._insecticideEventPending === true;

  return [...activeOverlayNpcs].some(
    (item) => item._insecticideEventPending === true,
  );
}

function isPlantEventPending(npc) {
  return (
    NpcManager.isFriendshipEventPending(npc) ||
    NpcManager.isInsecticideEventPending(npc) ||
    NpcManager.isInsecticideEventPending()
  );
}

function getNpcSpriteSize(npc) {
  const libraryItem = NpcManager.getLibraryItem(npc);

  return {
    width:
      npc?.spriteWidth ??
      libraryItem?.defaultSpriteWidth ??
      libraryItem?.frameWidth ??
      24,
    height:
      npc?.spriteHeight ??
      libraryItem?.defaultSpriteHeight ??
      libraryItem?.frameHeight ??
      60,
  };
}

function getNpcCollisionRect(npc) {
  const libraryItem = NpcManager.getLibraryItem(npc);
  const collision = NpcManager.cloneCollision(
    npc?.collision ?? libraryItem?.defaultCollision,
  );

  return {
    x: npc.x + collision.offsetX,
    y: npc.y + collision.offsetY,
    width: collision.width,
    height: collision.height,
  };
}

function isPointBlockedByNpc(worldX, worldY, mapData) {
  if (!Array.isArray(mapData?.npcs)) return false;

  return mapData.npcs.some((npc) => {
    if (!NpcManager.isActive(npc)) return false;

    const libraryItem = NpcManager.getLibraryItem(npc);
    if (!libraryItem || libraryItem.traspasable !== false) return false;

    const rect = NpcManager.getCollisionRect(npc);

    return (
      worldX >= rect.x &&
      worldX <= rect.x + rect.width &&
      worldY >= rect.y &&
      worldY <= rect.y + rect.height
    );
  });
}

function updateAnimations(npcs, deltaSeconds) {
  if (!Array.isArray(npcs)) return;

  const npcsToUpdate = [...new Set([...npcs, ...activeOverlayNpcs])];
  npcsToUpdate.forEach((npc) => {
    NpcManager.normalizeInstance(npc);
    const libraryItem = NpcManager.getLibraryItem(npc);

    if (
      NpcManager.isActive(npc) &&
      libraryItem?.animated &&
      libraryItem.animationFrames > 1
    ) {
      const frameDuration = Math.max(1, libraryItem.frameDuration || 1000);
      npc._animationElapsed += deltaSeconds * 1000;

      while (npc._animationElapsed >= frameDuration) {
        npc._animationElapsed -= frameDuration;

        if (libraryItem.loop === false) {
          npc._animationFrame = Math.min(
            npc._animationFrame + 1,
            libraryItem.animationFrames - 1,
          );
        } else {
          npc._animationFrame =
            (npc._animationFrame + 1) % libraryItem.animationFrames;
        }
      }
    }

    const overlay = NpcManager.getOverlayAnimationDefinition(npc);
    if (!overlay || overlay.animationFrames <= 1) return;

    const overlayFrameDuration = Math.max(1, overlay.frameDuration || 1000);
    npc._overlayAnimationElapsed += deltaSeconds * 1000;

    while (npc._overlayAnimationElapsed >= overlayFrameDuration) {
      npc._overlayAnimationElapsed -= overlayFrameDuration;

      if (overlay.loop === false) {
        if (npc._overlayAnimationFrame < overlay.animationFrames - 1) {
          npc._overlayAnimationFrame += 1;
        } else {
          const onComplete = npc._overlayAnimationOnComplete;
          NpcManager.stopOverlayAnimation(npc);
          onComplete?.();
          break;
        }
      } else {
        npc._overlayAnimationFrame =
          (npc._overlayAnimationFrame + 1) % overlay.animationFrames;
      }
    }
  });
}

window.NpcManager = {
  getLibraryItem: getNpcLibraryItem,
  createInventoryItem: createNpcInventoryItem,
  isActive: isNpcActive,
  getBlockingNpcForObject,
  cloneCollision: cloneNpcCollision,
  normalizeInstance: normalizeNpcInstance,
  getOverlayAnimationDefinition,
  startOverlayAnimation,
  stopOverlayAnimation,
  isOverlayAnimationActive,
  setFriendshipEventPending,
  isFriendshipEventPending,
  setInsecticideEventPending,
  isInsecticideEventPending,
  isPlantEventPending,
  getSpriteSize: getNpcSpriteSize,
  getCollisionRect: getNpcCollisionRect,
  isPointBlockedByNpc,
  updateAnimations,
};
