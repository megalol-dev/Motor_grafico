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
  const TARGET_REACHED_DIST = 10;
  const BLOCKED_EPSILON = 0.05;

  // -------------------------------------------------------
  // ESTADO GLOBAL DEL JUEGO
  // -------------------------------------------------------
  const state = {
    currentVerb: "Walk to",
    keys: new Set(),
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

    bindGameEvents();
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
      1: { name: "Alex" },
      2: { name: "Luna" },
      3: { name: "Rex" },
      4: { name: "Victor" },
      5: { name: "Neo" },
      6: { name: "Sara" },
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
    state.keys.clear();
    state.player.moving = false;
    state.player.animFrame = 0;
    state.player.animTimer = 0;
    state.target.active = false;
  }

  // -------------------------------------------------------
  // EVENTOS DEL JUEGO
  // -------------------------------------------------------
  function bindGameEvents() {
    // ---------------------------------------------------
    // TECLADO
    // ---------------------------------------------------
    document.addEventListener("keydown", (event) => {
      const isGameVisible = document
        .getElementById("game-screen")
        ?.classList.contains("active");
      if (!isGameVisible) return;

      const key = event.key.toLowerCase();

      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "w",
          "a",
          "s",
          "d",
        ].includes(key)
      ) {
        state.keys.add(key);
        state.target.active = false;
        state.path = [];
        state.pathIndex = 0;

        event.preventDefault();
      }
    });

    document.addEventListener("keyup", (event) => {
      state.keys.delete(event.key.toLowerCase());
    });

    // ---------------------------------------------------
    // CLICK EN EL CANVAS
    // ---------------------------------------------------
    canvas.addEventListener("click", (event) => {
      // evitar clicks de UI
      if (event.target.closest(".player-btn")) {
        return;
      }

      // cancelar mensajes temporales
      if (state.messageTimeout) {
        clearTimeout(state.messageTimeout);
        state.messageTimeout = null;

        if (actionLine) {
          actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
        }
      }

      const isGameVisible = document
        .getElementById("game-screen")
        ?.classList.contains("active");
      if (!isGameVisible || !mapData) return;

      // Cancelar mensaje temporal si existe
      if (state.messageTimeout) {
        clearTimeout(state.messageTimeout);
        state.messageTimeout = null;

        if (actionLine) {
          actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
        }
      }

      const worldPoint = getWorldPointFromClick(event);
      if (!worldPoint) return;

      // ---------------------------------------------------
      // COMPROBAR SI SE HA CLICADO UN OBJETO
      // ---------------------------------------------------
      const clickedObject = InteractionManager.getObjectAt(
        worldPoint.x,
        worldPoint.y,
        mapData,
      );
      const clickedHotspot = InteractionManager.getHotspotAt(
        worldPoint.x,
        worldPoint.y,
        mapData,
      );

      if (clickedObject) {
        const verb = state.currentVerb.toLowerCase();

        // ---------------------------------------------------
        // WHAT IS -> NO CAMINAR
        // ---------------------------------------------------
        if (verb === "what is") {
          InteractionManager.showTemporaryMessage(
            clickedObject.description,
            state,
            actionLine,
            2000,
          );

          return;
        }

        // ---------------------------------------------------
        // PICK UP -> CAMINAR HASTA EL OBJETO
        // ---------------------------------------------------
        if (verb === "pick up") {
          const interactionTile = findInteractionTileForObject(clickedObject);

          if (!interactionTile) {
            InteractionManager.showTemporaryMessage(
              `No puedo llegar a ${clickedObject.name}`,
              state,
              actionLine,
              2000,
            );

            return;
          }

          if (!createPathToTile(interactionTile.col, interactionTile.row)) {
            InteractionManager.showTemporaryMessage(
              "No encuentro un camino.",
              state,
              actionLine,
              2000,
            );

            return;
          }

          state.pendingInteraction = clickedObject;

          const dx = state.target.x - state.player.x;
          const dy = state.target.y - state.player.y;

          MovementManager.updateDirectionFromVector(
            dx,
            dy,
            getActiveCharacter(),
          );

          return;
        }

        // ---------------------------------------------------
        // USE -> CAMINAR HASTA EL OBJETO
        // ---------------------------------------------------
        if (verb === "use") {
          const interactionTile = findInteractionTileForObject(clickedObject);

          if (!interactionTile) {
            InteractionManager.showTemporaryMessage(
              `No puedo llegar a ${clickedObject.name}`,
              state,
              actionLine,
              2000,
            );

            return;
          }

          if (!createPathToTile(interactionTile.col, interactionTile.row)) {
            InteractionManager.showTemporaryMessage(
              "No encuentro un camino.",
              state,
              actionLine,
              2000,
            );

            return;
          }

          state.pendingInteraction = clickedObject;

          const dx = state.target.x - state.player.x;
          const dy = state.target.y - state.player.y;

          MovementManager.updateDirectionFromVector(
            dx,
            dy,
            getActiveCharacter(),
          );

          return;
        }

        // ---------------------------------------------------
        // WALK TO -> CAMINAR HASTA EL OBJETO
        // ---------------------------------------------------
        if (verb === "walk to") {
          const interactionTile = findInteractionTileForObject(clickedObject);

          if (!interactionTile) {
            InteractionManager.showTemporaryMessage(
              `No puedo llegar a ${clickedObject.name}`,
              state,
              actionLine,
              2000,
            );

            return;
          }

          if (!createPathToTile(interactionTile.col, interactionTile.row)) {
            InteractionManager.showTemporaryMessage(
              "No encuentro un camino.",
              state,
              actionLine,
              2000,
            );

            return;
          }

          // Al terminar la ruta se ejecutará la interacción con la puerta
          state.pendingInteraction = clickedObject;

          return;
        }

        // ---------------------------------------------------
        // OPEN, CLOSE, LOOK...
        // ---------------------------------------------------

        const interactionTile = findInteractionTileForObject(clickedObject);

        if (!interactionTile) {
          InteractionManager.handleObjectInteraction(
            clickedObject,
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
          );

          return;
        }

       if (!createPathToTile(interactionTile.col, interactionTile.row)) {
         InteractionManager.showTemporaryMessage(
           "No encuentro un camino.",
           state,
           actionLine,
           2000,
         );

         return;
       }

        state.pendingInteraction = clickedObject;

        return;

        return;
      }

      // ---------------------------------------------------
      // CLICK SOBRE HOTSPOT
      // ---------------------------------------------------
      if (clickedHotspot) {
        const verb = state.currentVerb.toLowerCase();

        // ---------------------------------------------------
        // WHAT IS -> NO CAMINAR
        // ---------------------------------------------------
        if (verb === "what is") {
          InteractionManager.handleHotspotInteraction(
            clickedHotspot,
            state,
            actionLine,
          );

          return;
        }
        const interactionTile = findInteractionTileForHotspot(clickedHotspot);

        if (!interactionTile) {
          InteractionManager.showTemporaryMessage(
            "No puedo llegar ahí.",
            state,
            actionLine,
            2000,
          );

          return;
        }

        if (!createPathToTile(interactionTile.col, interactionTile.row)) {
          InteractionManager.showTemporaryMessage(
            "No encuentro un camino.",
            state,
            actionLine,
            2000,
          );

          return;
        }

        state.pendingHotspot = clickedHotspot;

        return;
      }
      // ---------------------------------------------------
      // MOVIMIENTO DEL PERSONAJE
      // ---------------------------------------------------
      const clickedCol = Math.floor(worldPoint.x / mapData.tileWidth);

      const clickedRow = Math.floor(
        (worldPoint.y - FOOT_OFFSET_Y) / mapData.tileHeight,
      );

      const targetTile = WorldManager.findNearestWalkableTile(
        clickedCol,
        clickedRow,
        mapData,
        6,
      );

      if (!targetTile) {
        state.target.active = false;
        state.path = [];
        state.pathIndex = 0;

        return;
      }

     if (!createPathToTile(targetTile.col, targetTile.row)) {
       InteractionManager.showTemporaryMessage(
         "No encuentro un camino.",
         state,
         actionLine,
         2000,
       );

       return;
     }

      state.pendingInteraction = null;
      state.pendingHotspot = null;

      // Si estamos usando un objeto del inventario,
      // no cancelar el modo USE.
      if (
        state.currentVerb.toLowerCase() !== "use" ||
        !state.selectedInventoryItem
      ) {
        state.currentVerb = "Walk to";

        if (actionLine) {
          actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
        }
      }
    });

    // ---------------------------------------------------
    // HOVER SOBRE ELEMENTOS INTERACTIVOS
    // ---------------------------------------------------
    canvas.addEventListener("mousemove", (event) => {
      const isGameVisible = document
        .getElementById("game-screen")
        ?.classList.contains("active");

      if (!isGameVisible || !mapData) {
        return;
      }

      const worldPoint = getWorldPointFromClick(event);

      if (!worldPoint) {
        return;
      }

      const hoveredObject = InteractionManager.getObjectAt(
        worldPoint.x,
        worldPoint.y,
        mapData,
      );
      const hoveredHotspot = InteractionManager.getHotspotAt(
        worldPoint.x,
        worldPoint.y,
        mapData,
      );

      // ---------------------------------------------------
      // OBJETO BAJO EL RATÓN
      // ---------------------------------------------------
      if (hoveredObject) {
        if (actionLine) {
          if (
            state.currentVerb.toLowerCase() === "use" &&
            state.selectedInventoryItem
          ) {
            actionLine.textContent = `Use ${state.selectedInventoryItem.name} with ${hoveredObject.name}`;
          } else {
            actionLine.textContent = `${state.currentVerb} ${hoveredObject.name}`;
          }
        }

        return;
      }

      // ---------------------------------------------------
      // HOTSPOT BAJO EL RATÓN
      // ---------------------------------------------------
      if (hoveredHotspot) {
        const hotspotItem =
          InteractionManager.getHotspotLibraryItem(hoveredHotspot);

        if (hotspotItem && actionLine) {
          if (
            state.currentVerb.toLowerCase() === "use" &&
            state.selectedInventoryItem
          ) {
            actionLine.textContent = `Use ${state.selectedInventoryItem.name} with ${hotspotItem.name}`;
          } else {
            actionLine.textContent = `${state.currentVerb} ${hotspotItem.name}`;
          }
        }

        return;
      }

      // ---------------------------------------------------
      // NO HAY ELEMENTO INTERACTIVO
      // ---------------------------------------------------
      if (actionLine) {
        if (
          state.currentVerb.toLowerCase() === "use" &&
          state.selectedInventoryItem
        ) {
          actionLine.textContent = `Use ${state.selectedInventoryItem.name} with...`;
        }
      } else {
        actionLine.textContent = `${getVerbLabel(state.currentVerb)} ...`;
      }
    });

    // ---------------------------------------------------
    // BOTONES DE VERBOS
    // ---------------------------------------------------
    verbButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const verb = window.VerbLibrary.find(
          (v) => v.id === button.dataset.verb,
        );

        if (!verb) {
          return;
        }

        state.currentVerb = verb.id;

        if (state.currentVerb !== "use") {
          state.selectedInventoryItem = null;
          InventoryManager.refreshInventoryUI(state, actionLine);
        }

        if (actionLine) {
          actionLine.textContent = `${verb.label} ...`;
        }
      });
    });

    // ---------------------------------------------------
    // BOTONES DE PERSONAJES
    // ---------------------------------------------------
    const playerButtons = document.querySelectorAll(".player-btn");

    playerButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const selected = button.dataset.character;

        if (!selected) return;

        // cancelar movimiento anterior
        state.target.active = false;
        state.pendingInteraction = null;
        state.keys.clear();

        // parar todos los personajes
        state.player.moving = false;
        state.companions.forEach((companion) => {
          companion.moving = false;
        });

        state.activeCharacter = selected;
        const player = getActiveCharacter();

        changeMap(
          player.currentMap,
          Math.floor(player.x / mapData.tileWidth),
          Math.floor(player.y / mapData.tileHeight) - 1,
          player.direction,
        );
        state.target.active = false;

        InventoryManager.refreshInventoryUI(state, actionLine);
      });
    });
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
  // CALCULA UNA RUTA MEDIANTE A*
  // -------------------------------------------------------
  function findPathAStar(startCol, startRow, targetCol, targetRow) {
    if (!WorldManager.isWalkableTile(startCol, startRow, mapData)) {
      return [];
    }

    if (!WorldManager.isWalkableTile(targetCol, targetRow, mapData)) {
      return [];
    }

    const startKey = WorldManager.getTileKey(startCol, startRow);
    const targetKey = WorldManager.getTileKey(targetCol, targetRow);

    // Celdas pendientes de revisar
    const openSet = [
      {
        col: startCol,
        row: startRow,
        g: 0,
        h: Math.abs(targetCol - startCol) + Math.abs(targetRow - startRow),
        f: 0,
      },
    ];

    openSet[0].f = openSet[0].g + openSet[0].h;

    // Celdas ya revisadas
    const closedSet = new Set();

    // Guarda desde qué celda llegamos a cada posición
    const cameFrom = new Map();

    // Mejor coste conocido para cada celda
    const gScores = new Map();

    gScores.set(startKey, 0);

    // Movimiento en cuatro direcciones.
    // No usamos diagonales para evitar atravesar esquinas.
    const directions = [
      { col: 0, row: -1 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: -1, row: 0 },
    ];

    while (openSet.length > 0) {
      // Elegir la celda con menor coste total
      let bestIndex = 0;

      for (let i = 1; i < openSet.length; i += 1) {
        if (openSet[i].f < openSet[bestIndex].f) {
          bestIndex = i;
        }
      }

      const current = openSet.splice(bestIndex, 1)[0];
      const currentKey = WorldManager.getTileKey(current.col, current.row);

      // Hemos llegado al destino
      if (currentKey === targetKey) {
        const path = [];

        let reconstructionKey = targetKey;

        while (reconstructionKey !== startKey) {
          const [col, row] = reconstructionKey.split(",").map(Number);

          path.unshift({
            col,
            row,
          });

          reconstructionKey = cameFrom.get(reconstructionKey);

          if (!reconstructionKey) {
            return [];
          }
        }

        return path;
      }

      closedSet.add(currentKey);

      for (const direction of directions) {
        const nextCol = current.col + direction.col;
        const nextRow = current.row + direction.row;

        if (!WorldManager.isWalkableTile(nextCol, nextRow, mapData)) {
          continue;
        }

        const nextKey = WorldManager.getTileKey(nextCol, nextRow);

        if (closedSet.has(nextKey)) {
          continue;
        }

        // Cada desplazamiento ortogonal cuesta 1
        const tentativeG = current.g + 1;

        const previousG = gScores.get(nextKey);

        if (previousG !== undefined && tentativeG >= previousG) {
          continue;
        }

        cameFrom.set(nextKey, currentKey);
        gScores.set(nextKey, tentativeG);

        const h = Math.abs(targetCol - nextCol) + Math.abs(targetRow - nextRow);

        const existingNode = openSet.find(
          (node) => node.col === nextCol && node.row === nextRow,
        );

        if (existingNode) {
          existingNode.g = tentativeG;
          existingNode.h = h;
          existingNode.f = tentativeG + h;
        } else {
          openSet.push({
            col: nextCol,
            row: nextRow,
            g: tentativeG,
            h,
            f: tentativeG + h,
          });
        }
      }
    }

    // No existe ningún camino posible
    return [];
  }

  // -------------------------------------------------------
  // PREPARA UNA RUTA HACIA UNA CELDA
  // -------------------------------------------------------
  function createPathToTile(targetCol, targetRow) {
    const player = getActiveCharacter();

    const startTile = WorldManager.getCharacterTile(
      player,
      mapData,
      FOOT_OFFSET_Y,
    );

    const path = findPathAStar(
      startTile.col,
      startTile.row,
      targetCol,
      targetRow,
    );

    if (path.length === 0) {
      state.path = [];
      state.pathIndex = 0;
      state.target.active = false;

      return false;
    }

    state.path = path;
    state.pathIndex = 0;

    return true;
  }
  // -------------------------------------------------------
  // BUSCA UNA CELDA CAMINABLE CERCA DE UN OBJETO
  // -------------------------------------------------------
  function findInteractionTileForObject(obj) {
    const tileW = mapData.tileWidth;
    const tileH = mapData.tileHeight;

    // -------------------------------------------------------
    // OBJETOS QUE SE INTERACTÚAN DESDE DENTRO
    // -------------------------------------------------------

    if (obj.interactionMode === "inside") {
      // ---------------------------------------------------
      // Si el objeto define una casilla fija,
      // siempre usamos esa.
      // ---------------------------------------------------
      if (
        Number.isInteger(obj.interactionTileX) &&
        Number.isInteger(obj.interactionTileY)
      ) {
        return {
          col: obj.interactionTileX,
          row: obj.interactionTileY,
        };
      }

      // ---------------------------------------------------
      // Compatibilidad con objetos antiguos
      // ---------------------------------------------------
      const centerX = obj.x + obj.hitboxWidth / 2;

      const centerY = obj.y + obj.hitboxHeight / 2;

      return {
        col: Math.floor(centerX / tileW),

        row: Math.floor(centerY / tileH),
      };
    }

    const objectCenterX = obj.x + obj.hitboxWidth / 2;
    const objectBottomY = obj.y + obj.hitboxHeight;

    const objectCol = Math.floor(objectCenterX / tileW);
    const objectRow = Math.floor(objectBottomY / tileH);

    // Prioridad: debajo, izquierda, derecha, arriba
    const candidates = [
      { col: objectCol, row: objectRow + 1 },
      { col: objectCol - 1, row: objectRow + 1 },
      { col: objectCol + 1, row: objectRow + 1 },
      { col: objectCol - 1, row: objectRow },
      { col: objectCol + 1, row: objectRow },
      { col: objectCol, row: objectRow },
    ];

    for (const tile of candidates) {
      if (WorldManager.isWalkableTile(tile.col, tile.row, mapData)) {
        return tile;
      }
    }

    // Si ninguna cercana vale, buscamos una caminable alrededor
    return WorldManager.findNearestWalkableTile(
      objectCol,
      objectRow,
      mapData,
      8,
    );
  }

  // -------------------------------------------------------
  // BUSCA EL PUNTO MÁS CERCANO PARA INTERACTUAR CON UN HOTSPOT
  // -------------------------------------------------------
  function findInteractionTileForHotspot(hotspot) {
    const tileW = mapData.tileWidth;
    const tileH = mapData.tileHeight;

    const centerX = hotspot.x + hotspot.width / 2;
    const bottomY = hotspot.y + hotspot.height;

    const hotspotCol = Math.floor(centerX / tileW);
    const hotspotRow = Math.floor(bottomY / tileH);

    return WorldManager.findNearestWalkableTile(
      hotspotCol,
      hotspotRow,
      mapData,
      8,
    );
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
  // UPDATE GENERAL
  // -------------------------------------------------------
  function update(delta) {
    if (!mapData) return;

    const usedKeyboard = updatePlayerByKeyboard(delta);

    if (!usedKeyboard) {
      if (state.path.length > 0) {
        updatePlayerByPath(delta);
      } else {
        updatePlayerByMouseTarget(delta);
      }
    }

    MovementManager.updatePlayerAnimation(delta, getActiveCharacter());
    checkTeleportTrigger();
    CameraManager.updateCamera(
      getActiveCharacter(),
      state,
      canvas,
      mapData,
      MAP_SCALE,
    );
  }

  // -------------------------------------------------------
  // COMPRUEBA SI EL PERSONAJE ESTÁ PISANDO UN PORTAL
  // -------------------------------------------------------
  function checkTeleportTrigger() {
    const portal = InteractionManager.getTeleportUnderPlayer(
      getActiveCharacter(),
      mapData,
      FOOT_OFFSET_Y,
    );

    if (!portal) {
      return;
    }

    changeMap(
      portal.teleportTo,
      portal.teleportX,
      portal.teleportY,
      portal.teleportDirection ?? "down",
    );
  }

  // -------------------------------------------------------
  // MOVIMIENTO POR TECLADO
  // -------------------------------------------------------
  function updatePlayerByKeyboard(delta) {
    const player = getActiveCharacter();

    let moveX = 0;
    let moveY = 0;

    if (state.keys.has("arrowleft") || state.keys.has("a")) moveX -= 1;
    if (state.keys.has("arrowright") || state.keys.has("d")) moveX += 1;
    if (state.keys.has("arrowup") || state.keys.has("w")) moveY -= 1;
    if (state.keys.has("arrowdown") || state.keys.has("s")) moveY += 1;

    if (moveX === 0 && moveY === 0) {
      return false;
    }

    const length = Math.hypot(moveX, moveY) || 1;

    moveX /= length;
    moveY /= length;

    MovementManager.updateDirectionFromVector(moveX, moveY, player);

    const step = player.speed * delta;

    const nextX = player.x + moveX * step;
    const nextY = player.y + moveY * step;

    const oldX = player.x;
    const oldY = player.y;

    // movimiento libre actual
    MovementManager.tryMovePlayer(nextX, nextY, player, mapData, FOOT_OFFSET_Y);

    const movedDistance = Math.hypot(player.x - oldX, player.y - oldY);

    player.moving = movedDistance > BLOCKED_EPSILON;

    return true;
  }

  // -------------------------------------------------------
  // MOVIMIENTO SIGUIENDO UNA RUTA (A*)
  // -------------------------------------------------------
  function updatePlayerByPath(delta) {
    const player = getActiveCharacter();

    if (state.path.length === 0 || state.pathIndex >= state.path.length) {
      player.moving = false;
      return;
    }

    const node = state.path[state.pathIndex];

    const targetX = node.col * mapData.tileWidth + mapData.tileWidth / 2;

    const targetY = (node.row + 1) * mapData.tileHeight + FOOT_OFFSET_Y;

    const dx = targetX - player.x;
    const dy = targetY - player.y;

    const distance = Math.hypot(dx, dy);

    // -----------------------------------------
    // ¿HEMOS LLEGADO A ESTA CASILLA?
    // -----------------------------------------
    if (distance <= TARGET_REACHED_DIST) {
      state.pathIndex++;

      // -----------------------------------------
      // ¿HEMOS TERMINADO LA RUTA?
      // -----------------------------------------
      if (state.pathIndex >= state.path.length) {
        state.path = [];
        state.pathIndex = 0;

        player.moving = false;

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

        if (state.pendingTeleport) {
          const teleport = state.pendingTeleport;

          state.pendingTeleport = null;

          changeMap(
            teleport.teleportTo,
            teleport.teleportX,
            teleport.teleportY,
            teleport.teleportDirection ?? "down",
          );

          return;
        }

        return;
      }

      return;
    }

    const moveX = dx / distance;
    const moveY = dy / distance;

    MovementManager.updateDirectionFromVector(moveX, moveY, player);

    const step = player.speed * delta;
    const actualStep = Math.min(step, distance);

    player.x += moveX * actualStep;
    player.y += moveY * actualStep;

    player.moving = true;
  }

  // -------------------------------------------------------
  // MOVIMIENTO POR DESTINO DE RATÓN
  // -------------------------------------------------------
  function updatePlayerByMouseTarget(delta) {
    // personaje actualmente controlado
    const player = getActiveCharacter();

    if (!state.target.active) {
      player.moving = false;
      return;
    }

    const dx = state.target.x - player.x;
    const dy = state.target.y - player.y;

    const distance = Math.hypot(dx, dy);

    // ---------------------------------------------------
    // HA LLEGADO AL DESTINO
    // ---------------------------------------------------
    if (distance <= TARGET_REACHED_DIST) {
      state.target.active = false;
      player.moving = false;

      // ejecutar interacción pendiente
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
        );

        state.pendingInteraction = null;
      }

      // ---------------------------------------------------
      // HOTSPOT
      // ---------------------------------------------------
      if (state.pendingHotspot) {
        InteractionManager.handleHotspotInteraction(
          state.pendingHotspot,
          state,
          actionLine,
        );

        state.pendingHotspot = null;
      }

      // ---------------------------------------------------
      // TELETRANSPORTE PENDIENTE
      // ---------------------------------------------------
      if (state.pendingTeleport) {
        changeMap(
          state.pendingTeleport.teleportTo,
          state.pendingTeleport.teleportX,
          state.pendingTeleport.teleportY,
          state.pendingTeleport.teleportDirection ?? "down",
        );

        state.pendingTeleport = null;
      }

      return;
    }

    // ---------------------------------------------------
    // SEGURIDAD EXTRA
    // ---------------------------------------------------
    if (distance < 0.001) {
      state.target.active = false;
      player.moving = false;

      return;
    }

    const moveX = dx / distance;
    const moveY = dy / distance;

    MovementManager.updateDirectionFromVector(moveX, moveY, player);

    // dirección visual del personaje activo

    const step = player.speed * delta;
    const actualStep = Math.min(step, distance);

    const nextX = player.x + moveX * actualStep;
    const nextY = player.y + moveY * actualStep;

    const oldX = player.x;
    const oldY = player.y;

    // ---------------------------------------------------
    // MOVIMIENTO
    // ---------------------------------------------------

    MovementManager.tryMovePlayer(nextX, nextY, player, mapData, FOOT_OFFSET_Y);

    const movedDistance = Math.hypot(player.x - oldX, player.y - oldY);

    /*
        if (movedDistance < BLOCKED_EPSILON) {
    
            state.target.active = false;
            player.moving = false;
    
            return;
        }
        */

    player.moving = true;
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
    state.companions[0].y = state.player.y + 10;

    state.companions[1].x = state.player.x + 30;
    state.companions[1].y = state.player.y + 10;
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
  // DIBUJA LOS OBJETOS EN EL MAPA
  // -------------------------------------------------------
  function drawObjects() {
    if (!mapData?.objects) return;

    mapData.objects.forEach((obj) => {
      if (!obj.visible) return;
      if (obj.collected) return;

      // Una puerta abierta existe, pero su gráfico no se dibuja
      if (obj.type === "door" && obj.opened) {
        return;
      }

      const sprite = objectSprites[obj.sprite];
      if (!sprite) return;

      const screenX = Math.round((obj.x - state.camera.x) * MAP_SCALE);
      const screenY = Math.round((obj.y - state.camera.y) * MAP_SCALE);

      // ---------------------------------------------------
      // TAMAÑO VISUAL DEL SPRITE
      // ---------------------------------------------------
      const drawWidth = (obj.spriteWidth ?? obj.hitboxWidth) * MAP_SCALE;
      const drawHeight = (obj.spriteHeight ?? obj.hitboxHeight) * MAP_SCALE;

      // ---------------------------------------------------
      // DIBUJAR SPRITE
      // ---------------------------------------------------
      ctx.drawImage(sprite, screenX, screenY, drawWidth, drawHeight);
    });
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
