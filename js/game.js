window.GameModule = (() => {
  // -------------------------------------------------------//
  // REFERENCIAS GENERALES
  //  -------------------------------------------------------//
  let canvas;
  let ctx;
  let actionLine;
  let verbButtons;
  let running = false;

  // -------------------------------------------------------
  // RECURSOS GRÁFICOS GENERALES
  // -------------------------------------------------------

  // -------------------------------------------------------
  // SPRITES DE PERSONAJES
  // -------------------------------------------------------
  let playerSprites = {};

  let spriteLoaded = {
    p1: false,
    p2: false,
    p3: false,
  };

  let currentMapImage = "";
  let mapImage = null;
  let mapImageLoaded = false;
  let mapData = null;
  let currentMapName = "map1";

  // -------------------------------------------------------
  // SPRITES DE OBJETOS DEL MAPA
  // -------------------------------------------------------
  let objectSprites = {};

  // -------------------------------------------------------
  // MEDIDAS DEL SPRITE DEL PERSONAJE
  // -------------------------------------------------------
  const FRAME_WIDTH = 24;
  const FRAME_HEIGHT = 60;

  // -------------------------------------------------------
  // ESCALA VISUAL
  // -------------------------------------------------------
  const PLAYER_SCALE = 3;
  const MAP_SCALE = 3;

  // -------------------------------------------------------
  // OPCIONES DE DEPURACIÓN
  // -------------------------------------------------------
  const DEBUG = {
    showObjectBounds: true,
  };

  // -------------------------------------------------------
  // AJUSTES DE MOVIMIENTO Y COLISIÓN
  // -------------------------------------------------------
  const FOOT_OFFSET_Y = 6;
  const TARGET_REACHED_DIST = 5;
  const BLOCKED_EPSILON = 0.05;

  // -------------------------------------------------------
  // ESTADO GLOBAL DEL JUEGO
  // -------------------------------------------------------
  const state = {
    currentVerb: "Walk to",
    lastTime: 0,
    messageTimeout: null,

    // -------------------------------------------------------
    // CÁMARA
    // -------------------------------------------------------
    camera: {
      x: 0,
      y: 0,
    },

    // -------------------------------------------------------
    // PERSONAJE PRINCIPAL CON QUE SE EMPIEZA (CONTROLABLE)
    // -------------------------------------------------------
    player: {
      id: "slot1",
      sprite: "pj1",

      x: 0,
      y: 0,

      width: 24,
      height: 60,

      speed: 180,

      direction: "down",
      moving: false,

      animTimer: 0,
      animFrame: 0,

      currentMap: "map1",
    },

    // -------------------------------------------------------
    // PERSONAJES SECUNDARIOS DEL GRUPO
    // -------------------------------------------------------
    companions: [
      {
        id: "slot2",
        sprite: "pj2",

        x: 0,
        y: 0,

        width: 24,
        height: 60,

        speed: 180,

        direction: "down",
        moving: false,

        animTimer: 0,
        animFrame: 0,

        currentMap: "map1",
      },

      {
        id: "slot3",
        sprite: "pj3",

        x: 0,
        y: 0,

        width: 24,
        height: 60,

        speed: 180,

        direction: "down",
        moving: false,

        animTimer: 0,
        animFrame: 0,

        currentMap: "map1",
      },
    ],

    // -------------------------------------------------------
    // DESTINO DEL CLICK DEL RATÓN
    // -------------------------------------------------------
    target: {
      active: false,
      x: 0,
      y: 0,
    },

    // -------------------------------------------------------
    // RUTA CALCULADA MEDIANTE A*
    // -------------------------------------------------------
    path: [],
    pathIndex: 0,

    // -------------------------------------------------------
    // INTERACCIÓN PENDIENTE
    // -------------------------------------------------------
    pendingInteraction: null,
    pendingTeleport: null,
    pendingHotspot: null,

    // -------------------------------------------------------
    // INVENTARIO POR PERSONAJE
    // -------------------------------------------------------
    inventory: {
      slot1: [],
      slot2: [],
      slot3: [],
    },

    // -----------------------------------------
    // OBJETO SELECCIONADO DEL INVENTARIO
    // -----------------------------------------

    selectedInventoryItem: null,

    activeCharacter: "slot1",
  };

  // -------------------------------------------------------
  // INICIALIZACIÓN DEL MÓDULO
  // -------------------------------------------------------
  async function init() {
    canvas = document.getElementById("game-canvas");
    actionLine = document.getElementById("action-line");
    createVerbButtons();

    if (!canvas) return;

    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    EventsManager.bindGameEvents(
      canvas,
      state,
      actionLine,
      verbButtons,
      () => mapData,
      () => currentMapName,
      getWorldPointFromClick,
      getVerbLabel,
      getActiveCharacter,
      changeMap,
      changeMapKeepingPosition,
      FOOT_OFFSET_Y,
    );
    await loadGameAssets();
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
      getActiveCharacter(),
    );
  }

  // -------------------------------------------------------
  // CREA LOS BOTONES DE VERBOS DESDE EL CATÁLOGO
  // -------------------------------------------------------
  function createVerbButtons() {
    const verbsPanel = document.getElementById("verbs-panel");

    if (!verbsPanel) {
      return;
    }

    verbsPanel.innerHTML = "";

    window.VerbLibrary.forEach((verb) => {
      const button = document.createElement("button");

      button.className = "verb-btn";

      button.dataset.verb = verb.id;

      button.textContent = verb.label;

      verbsPanel.appendChild(button);
    });

    verbButtons = verbsPanel.querySelectorAll(".verb-btn");
  }

  // -------------------------------------------------------
  // CARGA TODOS LOS RECURSOS NECESARIOS
  // -------------------------------------------------------
  async function loadGameAssets() {
    await Promise.all([loadPlayerSprite(), loadMapData()]);

    if (mapData) {
      DoorManager.applyPersistentObjectStates(currentMapName, mapData?.objects);

      await loadMapImage();

      objectSprites = {};

      await loadObjectSprites();

      placePlayerAtSpawn();
      CameraManager.centerCameraOnPlayer(
        getActiveCharacter(),
        state,
        canvas,
        mapData,
        MAP_SCALE,
      );
    }
  }

  // -------------------------------------------------------
  // CONFIGURA EL GRUPO SELECCIONADO
  // -------------------------------------------------------
  function setupSelectedParty() {
    const savedParty = JSON.parse(localStorage.getItem("selectedParty"));

    if (!savedParty || savedParty.length < 3) {
      return;
    }

    state.player.sprite = `pj${savedParty[0]}`;
    state.companions[0].sprite = `pj${savedParty[1]}`;
    state.companions[1].sprite = `pj${savedParty[2]}`;

    updatePartyButtons();

    state.activeCharacter = "slot1";
  }

  // -------------------------------------------------------
  // ACTUALIZA LOS NOMBRES DE LOS BOTONES DE PERSONAJES
  // -------------------------------------------------------
  function updatePartyButtons() {
    const descriptions = {
      1: { name: "Ryan" },
      2: { name: "April" },
      3: { name: "Milton" },
      4: { name: "Hank" },
      5: { name: "Spike" },
      6: { name: "Robin" },
    };

    const savedParty = JSON.parse(localStorage.getItem("selectedParty"));

    if (!savedParty) return;

    const buttons = document.querySelectorAll(".player-btn");

    buttons.forEach((button, index) => {
      const id = savedParty[index];

      button.textContent = descriptions[id].name;
    });
  }

  // -------------------------------------------------------
  // CARGA LOS SPRITES DE LOS PERSONAJES
  // -------------------------------------------------------
  function loadPlayerSprite() {
    const characters = [
      { id: "pj1", file: "PJ1.png" },
      { id: "pj2", file: "PJ2.png" },
      { id: "pj3", file: "PJ3.png" },
      { id: "pj4", file: "PJ4.png" },
      { id: "pj5", file: "PJ5.png" },
      { id: "pj6", file: "PJ6.png" },
    ];

    const promises = characters.map((char) => {
      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          playerSprites[char.id] = img;
          spriteLoaded[char.id] = true;

          resolve();
        };

        img.onerror = () => {
          console.warn(`No se pudo cargar ${char.file}`);
          resolve();
        };

        img.src = `./img/personajes/${char.file}`;
      });
    });

    return Promise.all(promises);
  }

  // -------------------------------------------------------
  // CARGA EL JSON DEL MAPA
  // -------------------------------------------------------
  async function loadMapData(mapName = "map1") {
    try {
      const response = await fetch(`./data/maps/${mapName}.json`);
      mapData = await response.json();
      currentMapName = mapName;

      if (!mapData.tileWidth) mapData.tileWidth = 24;
      if (!mapData.tileHeight) mapData.tileHeight = 30;
      if (!mapData.image) mapData.image = "map1.png";

      if (!mapData.cols && mapData.walkable?.[0]?.length) {
        mapData.cols = mapData.walkable[0].length;
      }

      if (!mapData.rows && mapData.walkable?.length) {
        mapData.rows = mapData.walkable.length;
      }

      if (!mapData.spawn) {
        mapData.spawn = {
          x: Math.max(1, (mapData.cols || 10) - 4),
          y: Math.max(1, (mapData.rows || 10) - 1),
        };
      }
    } catch (error) {
      console.error(`Error cargando ${mapName}.json:`, error);
      mapData = null;
    }
  }

  // -------------------------------------------------------
  // DEVUELVE EL TEXTO VISIBLE DE UN VERBO
  // -------------------------------------------------------
  function getVerbLabel(id) {
    const verb = window.VerbLibrary.find((v) => v.id === id);

    return verb?.label ?? id;
  }

  // -------------------------------------------------------
  // CARGA LA IMAGEN DEL MAPA
  // -------------------------------------------------------
  function loadMapImage() {
    return new Promise((resolve) => {
      if (!mapData?.image) {
        resolve();
        return;
      }

      mapImage = new Image();

      mapImage.onload = () => {
        mapImageLoaded = true;
        resolve();
      };

      mapImage.onerror = () => {
        console.warn(`No se pudo cargar la imagen del mapa: ${mapData.image}`);
        resolve();
      };

      mapImage.src = `./img/maps/${mapData.image}`;
    });
  }

  // -------------------------------------------------------
  // CAMBIA DE MAPA
  // -------------------------------------------------------
  async function changeMap(mapName, spawnX, spawnY, direction = "down") {
    // Cargar JSON del nuevo mapa
    await loadMapData(mapName);

    // Aplicar primero los estados persistentes
    DoorManager.applyPersistentObjectStates(currentMapName, mapData?.objects);
    // Cargar imagen del mapa
    await loadMapImage();

    // Vaciar y cargar los sprites del estado correcto
    objectSprites = {};

    await loadObjectSprites();

    // -------------------------------------------------------
    // MOVER SOLO AL PERSONAJE ACTIVO
    // -------------------------------------------------------
    const player = getActiveCharacter();

    player.currentMap = mapName;

    player.x = spawnX * mapData.tileWidth + mapData.tileWidth / 2;
    player.y = (spawnY + 1) * mapData.tileHeight;
    player.direction = direction;
    player.moving = false;

    // Cancelar acciones anteriores
    state.target.active = false;
    state.pendingInteraction = null;
    state.pendingTeleport = null;
    state.path = [];
    state.pathIndex = 0;
    state.pendingHotspot = null;

    CameraManager.centerCameraOnPlayer(
      getActiveCharacter(),
      state,
      canvas,
      mapData,
      MAP_SCALE,
    );
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
      getActiveCharacter(),
    );
  }

  // -------------------------------------------------------
  // CAMBIA DE MAPA CONSERVANDO LA POSICIÓN EXACTA
  // Se usa al cambiar de personaje.
  // -------------------------------------------------------
  async function changeMapKeepingPosition(
    mapName,
    worldX,
    worldY,
    direction = "down",
  ) {
    await loadMapData(mapName);

    DoorManager.applyPersistentObjectStates(currentMapName, mapData?.objects);

    await loadMapImage();

    objectSprites = {};

    await loadObjectSprites();

    const player = getActiveCharacter();

    player.currentMap = mapName;

    // Mantener coordenadas EXACTAS
    player.x = worldX;
    player.y = worldY;

    player.direction = direction;
    player.moving = false;

    // Cancelar acciones anteriores
    state.target.active = false;
    state.pendingInteraction = null;
    state.pendingTeleport = null;
    state.pendingHotspot = null;

    state.path = [];
    state.pathIndex = 0;

    CameraManager.centerCameraOnPlayer(
      player,
      state,
      canvas,
      mapData,
      MAP_SCALE,
    );

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
      player,
    );
  }

  // -------------------------------------------------------
  // CARGA LOS SPRITES DE LOS OBJETOS
  // -------------------------------------------------------
  async function loadObjectSprites() {
    if (!mapData?.objects) return;

    const promises = mapData.objects.map((obj) => {
      return new Promise((resolve) => {
        if (!obj.sprite) {
          resolve();
          return;
        }

        const img = new Image();

        img.onload = () => {
          objectSprites[obj.sprite] = img;
          resolve();
        };

        img.onerror = () => {
          console.warn(`No se pudo cargar el objeto: ${obj.sprite}`);
          resolve();
        };

        img.src = `./img/objects/${obj.sprite}`;
      });
    });

    await Promise.all(promises);
  }

  // -------------------------------------------------------
  // CARGA UN SPRITE INDIVIDUAL
  // -------------------------------------------------------
  function loadObjectSprite(spriteName) {
    if (objectSprites[spriteName]) {
      return;
    }

    const img = new Image();

    img.src = `./img/objects/${spriteName}`;

    objectSprites[spriteName] = img;
  }

  // -------------------------------------------------------
  // ARRANCA EL GAME LOOP
  // -------------------------------------------------------
  function start() {
    if (!canvas || !ctx) return;
    if (running) return;

    running = true;
    state.lastTime = 0;
    requestAnimationFrame(gameLoop);
  }

  // -------------------------------------------------------
  // DETIENE EL GAME LOOP
  // -------------------------------------------------------
  function stop() {
    running = false;

    state.player.moving = false;
    state.player.animFrame = 0;
    state.player.animTimer = 0;
    state.target.active = false;
  }

  // -------------------------------------------------------
  // GESTIONA EL VERBO PICK UP SOBRE OBJETOS
  // -------------------------------------------------------
  function handleObjectPickUp(obj) {
    return InventoryManager.handlePickUp(
      obj,
      state,
      actionLine,
      currentMapName,
    );
  }

  // -------------------------------------------------------
  // CONVIERTE UN CLIC DEL CANVAS A COORDENADAS DEL MUNDO
  // -------------------------------------------------------
  function getWorldPointFromClick(event) {
    if (!mapData) return null;

    const rect = canvas.getBoundingClientRect();

    const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);

    const worldX = state.camera.x + canvasX / MAP_SCALE;
    const worldY = state.camera.y + canvasY / MAP_SCALE;

    return {
      x: CameraManager.clamp(
        worldX,
        state.player.width / 2,
        CameraManager.getWorldWidth(mapData, canvas) - state.player.width / 2,
      ),
      y: CameraManager.clamp(
        worldY,
        state.player.height,
        CameraManager.getWorldHeight(mapData, canvas),
      ),
    };
  }

  // -------------------------------------------------------
  // GAME LOOP PRINCIPAL
  // -------------------------------------------------------
  function gameLoop(timestamp) {
    if (!running) return;

    const delta = (timestamp - state.lastTime) / 1000 || 0;
    state.lastTime = timestamp;

    update(delta);
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
      getActiveCharacter(),
    );

    requestAnimationFrame(gameLoop);
  }

  // -------------------------------------------------------
  // CREA EL CONTEXTO NECESARIO PARA PLAYER CONTROLLER
  // -------------------------------------------------------
  function getPlayerControllerContext() {
    return {
      state,
      mapData,
      actionLine,
      currentMapName,
      ctx,
      canvas,
      mapImageLoaded,
      mapImage,
      objectSprites,
      playerSprites,
      MAP_SCALE,
      PLAYER_SCALE,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      FOOT_OFFSET_Y,
      TARGET_REACHED_DIST,
      getVerbLabel,
      getActiveCharacter,
      changeMap,
    };
  }

  // -------------------------------------------------------
  // UPDATE GENERAL
  // -------------------------------------------------------
  function update(delta) {
    if (!mapData) return;

    const controllerContext = getPlayerControllerContext();

    if (state.path.length > 0) {
      PlayerController.updatePlayerByPath(delta, controllerContext);
    } else {
      // -----------------------------------------
      // Ya estamos colocados para interactuar
      // -----------------------------------------
      if (state.pendingInteraction) {
        InteractionManager.handleObjectInteraction(
          state.pendingInteraction,
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
          MAP_SCALE,
          PLAYER_SCALE,
          FRAME_WIDTH,
          FRAME_HEIGHT,
          getVerbLabel,
          changeMap,
        );

        state.pendingInteraction = null;
      }

      if (state.pendingHotspot) {
        InteractionManager.handleHotspotInteraction(
          state.pendingHotspot,
          state,
          actionLine,
        );

        state.pendingHotspot = null;
      }

      PlayerController.updatePlayerByMouseTarget(delta, controllerContext);
    }

    MovementManager.updatePlayerAnimation(delta, getActiveCharacter());

    CameraManager.updateCamera(
      getActiveCharacter(),
      state,
      canvas,
      mapData,
      MAP_SCALE,
    );
  }

  // -------------------------------------------------------
  // COLOCA AL PERSONAJE EN EL SPAWN DEL JSON
  // -------------------------------------------------------
  function placePlayerAtSpawn() {
    if (!mapData) return;

    const tileW = mapData.tileWidth;
    const tileH = mapData.tileHeight;

    const spawnCol = CameraManager.clamp(
      mapData.spawn?.x ?? Math.max(1, (mapData.cols || 10) - 4),
      0,
      Math.max(0, mapData.cols - 1),
    );

    const spawnRow = CameraManager.clamp(
      mapData.spawn?.y ?? Math.max(1, (mapData.rows || 10) - 1),
      0,
      Math.max(0, mapData.rows - 1),
    );

    state.player.x = spawnCol * tileW + tileW / 2;
    state.player.y = (spawnRow + 1) * tileH;

    // -------------------------------------------------------
    // POSICIONAR COMPAÑEROS CERCA DEL JUGADOR
    // -------------------------------------------------------
    state.companions[0].x = state.player.x - 30;
    state.companions[0].y = state.player.y;

    state.companions[1].x = state.player.x + 30;
    state.companions[1].y = state.player.y;
  }

  // -------------------------------------------------------
  // DEVUELVE EL PERSONAJE ACTIVO
  // -------------------------------------------------------
  function getActiveCharacter() {
    if (state.activeCharacter === "slot1") {
      return state.player;
    }

    return state.companions.find((c) => c.id === state.activeCharacter);
  }

  // -------------------------------------------------------
  // API PÚBLICA
  // -------------------------------------------------------
  return {
    init,
    start,
    stop,
    setupSelectedParty,
  };
})();
