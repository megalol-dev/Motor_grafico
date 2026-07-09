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
    // INTERACCIÓN PENDIENTE
    // -------------------------------------------------------
    pendingInteraction: null,

    // -------------------------------------------------------
    // INVENTARIO POR PERSONAJE
    // -------------------------------------------------------
    inventory: {
      slot1: [],
      slot2: [],
      slot3: [],
    },

    activeCharacter: "slot1",
  };

  // -------------------------------------------------------
  // INICIALIZACIÓN DEL MÓDULO
  // -------------------------------------------------------
  async function init() {
    canvas = document.getElementById("game-canvas");
    actionLine = document.getElementById("action-line");
    verbButtons = document.querySelectorAll(".verb-btn");

    if (!canvas) return;

    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    bindGameEvents();
    await loadGameAssets();
    render();
  }

  // -------------------------------------------------------
  // CARGA TODOS LOS RECURSOS NECESARIOS
  // -------------------------------------------------------
  async function loadGameAssets() {
    await Promise.all([loadPlayerSprite(), loadMapData()]);

    if (mapData) {
      await loadMapImage();
      await loadObjectSprites();

      placePlayerAtSpawn();
      centerCameraOnPlayer();
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

    state.activeCharacter = "slot1";
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
  async function loadMapData() {
    try {
      const response = await fetch("./data/maps/map1.json");
      mapData = await response.json();

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
      console.error("Error cargando map1.json:", error);
      mapData = null;
    }
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
          actionLine.textContent = `${state.currentVerb} ...`;
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
          actionLine.textContent = `${state.currentVerb} ...`;
        }
      }

      const worldPoint = getWorldPointFromClick(event);
      if (!worldPoint) return;

      // ---------------------------------------------------
      // COMPROBAR SI SE HA CLICADO UN OBJETO
      // ---------------------------------------------------
      const clickedObject = getObjectAt(worldPoint.x, worldPoint.y);

      if (clickedObject) {
        const verb = state.currentVerb.toLowerCase();

        // ---------------------------------------------------
        // WHAT IS -> NO CAMINAR
        // ---------------------------------------------------
        if (verb === "what is") {
          showTemporaryMessage(clickedObject.description, 2000);

          return;
        }

        // ---------------------------------------------------
        // PICK UP -> CAMINAR HASTA EL OBJETO
        // ---------------------------------------------------
        if (verb === "pick up") {
          const interactionTile = findInteractionTileForObject(clickedObject);

          if (!interactionTile) {
            showTemporaryMessage(
              `No puedo llegar a ${clickedObject.name}`,
              2000,
            );

            return;
          }

          state.target.x =
            interactionTile.col * mapData.tileWidth + mapData.tileWidth / 2;

          state.target.y =
            (interactionTile.row + 1) * mapData.tileHeight + FOOT_OFFSET_Y;

          state.target.active = true;
          state.pendingInteraction = clickedObject;

          const dx = state.target.x - state.player.x;
          const dy = state.target.y - state.player.y;

          updateDirectionFromVector(dx, dy);

          return;
        }

        // ---------------------------------------------------
        // RESTO DE VERBOS
        // ---------------------------------------------------
        showTemporaryMessage(
          `${state.currentVerb} ${clickedObject.name}`,
          2000,
        );

        return;
      }

      // ---------------------------------------------------
      // MOVIMIENTO DEL PERSONAJE
      // ---------------------------------------------------
      const clickedCol = Math.floor(worldPoint.x / mapData.tileWidth);
      const clickedRow = Math.floor(
        (worldPoint.y - FOOT_OFFSET_Y) / mapData.tileHeight,
      );

      const targetTile = findNearestWalkableTile(clickedCol, clickedRow, 6);

      if (!targetTile) {
        state.target.active = false;
        state.player.moving = false;

        return;
      }

      state.target.x =
        targetTile.col * mapData.tileWidth + mapData.tileWidth / 2;

      state.target.y =
        (targetTile.row + 1) * mapData.tileHeight + FOOT_OFFSET_Y;

      state.target.active = true;

      const player = getActiveCharacter();

      const dx = state.target.x - player.x;
      const dy = state.target.y - player.y;

      updateDirectionFromVector(dx, dy);

      state.currentVerb = "Walk to";

      if (actionLine) {
        actionLine.textContent = `${state.currentVerb} ...`;
      }
    });

    // ---------------------------------------------------
    // HOVER SOBRE OBJETOS
    // ---------------------------------------------------
    canvas.addEventListener("mousemove", (event) => {
      const isGameVisible = document
        .getElementById("game-screen")
        ?.classList.contains("active");
      if (!isGameVisible || !mapData) return;

      const worldPoint = getWorldPointFromClick(event);
      if (!worldPoint) return;

      const hoveredObject = getObjectAt(worldPoint.x, worldPoint.y);

      // ---------------------------------------------------
      // SI HAY OBJETO BAJO EL RATÓN
      // ---------------------------------------------------
      if (hoveredObject) {
        if (actionLine) {
          actionLine.textContent = `${state.currentVerb} ${hoveredObject.name}`;
        }

        return;
      }

      // ---------------------------------------------------
      // SI NO HAY OBJETO
      // ---------------------------------------------------
      if (actionLine) {
        actionLine.textContent = `${state.currentVerb} ...`;
      }
    });

    // ---------------------------------------------------
    // BOTONES DE VERBOS
    // ---------------------------------------------------
    verbButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.currentVerb = button.textContent;

        if (actionLine) {
          actionLine.textContent = `${state.currentVerb} ...`;
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
        state.target.active = false;

        console.log("Personaje activo:", state.activeCharacter);

        refreshInventoryUI();
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
      x: clamp(
        worldX,
        state.player.width / 2,
        getWorldWidth() - state.player.width / 2,
      ),
      y: clamp(worldY, state.player.height, getWorldHeight()),
    };
  }

  // -------------------------------------------------------
  // COMPRUEBA SI UNA CELDA ES CAMINABLE
  // -------------------------------------------------------
  function isWalkableTile(col, row) {
    if (!mapData?.walkable) return false;

    if (row < 0 || col < 0 || row >= mapData.rows || col >= mapData.cols) {
      return false;
    }

    return mapData.walkable[row]?.[col] === 1;
  }

  // -------------------------------------------------------
  // BUSCA LA CELDA CAMINABLE MÁS CERCANA
  // -------------------------------------------------------
  function findNearestWalkableTile(startCol, startRow, maxRadius = 6) {
    if (isWalkableTile(startCol, startRow)) {
      return { col: startCol, row: startRow };
    }

    let best = null;
    let bestDist = Infinity;

    for (let radius = 1; radius <= maxRadius; radius += 1) {
      for (let row = startRow - radius; row <= startRow + radius; row += 1) {
        for (let col = startCol - radius; col <= startCol + radius; col += 1) {
          if (!isWalkableTile(col, row)) continue;

          const dx = col - startCol;
          const dy = row - startRow;
          const dist = Math.hypot(dx, dy);

          if (dist < bestDist) {
            bestDist = dist;
            best = { col, row };
          }
        }
      }

      if (best) return best;
    }

    return null;
  }

  // -------------------------------------------------------
  // BUSCA UNA CELDA CAMINABLE CERCA DE UN OBJETO
  // -------------------------------------------------------
  function findInteractionTileForObject(obj) {
    const tileW = mapData.tileWidth;
    const tileH = mapData.tileHeight;

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
      if (isWalkableTile(tile.col, tile.row)) {
        return tile;
      }
    }

    // Si ninguna cercana vale, buscamos una caminable alrededor
    return findNearestWalkableTile(objectCol, objectRow, 8);
  }

  // -------------------------------------------------------
  // GAME LOOP PRINCIPAL
  // -------------------------------------------------------
  function gameLoop(timestamp) {
    if (!running) return;

    const delta = (timestamp - state.lastTime) / 1000 || 0;
    state.lastTime = timestamp;

    update(delta);
    render();

    requestAnimationFrame(gameLoop);
  }

  // -------------------------------------------------------
  // UPDATE GENERAL
  // -------------------------------------------------------
  function update(delta) {
    if (!mapData) return;

    const usedKeyboard = updatePlayerByKeyboard(delta);

    if (!usedKeyboard) {
      updatePlayerByMouseTarget(delta);
    }

    updatePlayerAnimation(delta);
    updateCamera();
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

    updateDirectionFromVector(moveX, moveY);

    const step = player.speed * delta;

    const nextX = player.x + moveX * step;
    const nextY = player.y + moveY * step;

    const oldX = player.x;
    const oldY = player.y;

    // movimiento libre actual
    player.x = nextX;
    player.y = nextY;

    const movedDistance = Math.hypot(player.x - oldX, player.y - oldY);

    player.moving = movedDistance > BLOCKED_EPSILON;

    return true;
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
        handleObjectInteraction(state.pendingInteraction);

        state.pendingInteraction = null;
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

    updateDirectionFromVector(moveX, moveY);

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

    /*
        tryMovePlayer(nextX, nextY);
        */

    player.x = nextX;
    player.y = nextY;

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
  // INTENTA MOVER AL JUGADOR USANDO LA MATRIZ WALKABLE
  // -------------------------------------------------------
  function tryMovePlayer(nextX, nextY) {
    if (canStandAt(nextX, state.player.y)) {
      state.player.x = nextX;
    }

    if (canStandAt(state.player.x, nextY)) {
      state.player.y = nextY;
    }
  }

  // -------------------------------------------------------
  // COMPRUEBA SI EL PERSONAJE PUEDE ESTAR DE PIE EN ESA POSICIÓN
  // -------------------------------------------------------
  function canStandAt(worldX, worldY) {
    if (!mapData?.walkable) return true;

    const tileW = mapData.tileWidth;
    const tileH = mapData.tileHeight;

    const footX = worldX;
    const footY = worldY - FOOT_OFFSET_Y;

    const col = Math.floor(footX / tileW);
    const row = Math.floor(footY / tileH);

    if (row < 0 || col < 0 || row >= mapData.rows || col >= mapData.cols) {
      return false;
    }

    return mapData.walkable[row]?.[col] === 1;
  }

  // -------------------------------------------------------
  // DIRECCIÓN VISUAL SEGÚN VECTOR
  // -------------------------------------------------------
  function updateDirectionFromVector(moveX, moveY) {
    const player = getActiveCharacter();

    if (Math.abs(moveX) > Math.abs(moveY)) {
      player.direction = moveX < 0 ? "left" : "right";
    } else {
      player.direction = moveY < 0 ? "up" : "down";
    }
  }

  // -------------------------------------------------------
  // ANIMACIÓN DEL PERSONAJE
  // -------------------------------------------------------
  // -------------------------------------------------------
  // ANIMACIÓN DEL PERSONAJE
  // -------------------------------------------------------
  function updatePlayerAnimation(delta) {
    const player = getActiveCharacter();

    if (!player.moving) {
      player.animFrame = 0;
      player.animTimer = 0;

      return;
    }

    player.animTimer += delta;

    if (player.animTimer >= 0.12) {
      player.animTimer = 0;

      player.animFrame = (player.animFrame + 1) % 4;
    }
  }

  // -------------------------------------------------------
  // COLOCA AL PERSONAJE EN EL SPAWN DEL JSON
  // -------------------------------------------------------
  function placePlayerAtSpawn() {
    if (!mapData) return;

    const tileW = mapData.tileWidth;
    const tileH = mapData.tileHeight;

    const spawnCol = clamp(
      mapData.spawn?.x ?? Math.max(1, (mapData.cols || 10) - 4),
      0,
      Math.max(0, mapData.cols - 1),
    );

    const spawnRow = clamp(
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
  // CENTRA LA CÁMARA EN EL JUGADOR AL INICIO
  // -------------------------------------------------------
  function centerCameraOnPlayer() {
    const viewportWidth = canvas.width / MAP_SCALE;
    const viewportHeight = canvas.height / MAP_SCALE;

    state.camera.x = clamp(
      state.player.x - viewportWidth / 2,
      0,
      Math.max(0, getWorldWidth() - viewportWidth),
    );

    state.camera.y = clamp(
      state.player.y - viewportHeight / 2,
      0,
      Math.max(0, getWorldHeight() - viewportHeight),
    );
  }

  // -------------------------------------------------------
  // ACTUALIZA LA CÁMARA PARA SEGUIR AL PERSONAJE ACTIVO
  // -------------------------------------------------------
  function updateCamera() {
    const player = getActiveCharacter();

    const viewportWidth = canvas.width / MAP_SCALE;
    const viewportHeight = canvas.height / MAP_SCALE;

    const targetCameraX = player.x - viewportWidth / 2;

    const targetCameraY = player.y - viewportHeight / 2;

    state.camera.x = clamp(
      targetCameraX,
      0,
      Math.max(0, getWorldWidth() - viewportWidth),
    );

    state.camera.y = clamp(
      targetCameraY,
      0,
      Math.max(0, getWorldHeight() - viewportHeight),
    );
  }

  // -------------------------------------------------------
  // RENDER GENERAL
  // -------------------------------------------------------
  function render() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap();
    drawObjects();
    drawCompanions();
    drawPlayer();
  }

  // -------------------------------------------------------
  // DIBUJA EL MAPA TENIENDO EN CUENTA LA CÁMARA
  // -------------------------------------------------------
  function drawMap() {
    if (mapImageLoaded && mapImage) {
      ctx.drawImage(
        mapImage,
        Math.floor(state.camera.x),
        Math.floor(state.camera.y),
        Math.floor(canvas.width / MAP_SCALE),
        Math.floor(canvas.height / MAP_SCALE),
        0,
        0,
        canvas.width,
        canvas.height,
      );
      return;
    }

    ctx.fillStyle = "#22c75a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // -------------------------------------------------------
  // DIBUJA EL PERSONAJE AJUSTADO A LA CÁMARA
  // -------------------------------------------------------
  function drawPlayer() {
    const p = getActiveCharacter();

    const drawWidth = p.width * PLAYER_SCALE;
    const drawHeight = p.height * PLAYER_SCALE;

    const screenX = Math.round(
      (p.x - state.camera.x) * MAP_SCALE - drawWidth / 2,
    );

    const screenY = Math.round((p.y - state.camera.y) * MAP_SCALE - drawHeight);

    // -------------------------------------------------------
    // OBTENER EL SPRITE DEL PERSONAJE ACTUAL
    // -------------------------------------------------------
    const sprite = playerSprites[p.sprite];

    if (!sprite) {
      drawFallbackPlayer(screenX, screenY, PLAYER_SCALE);
      return;
    }

    const frame = getPlayerFrame();

    ctx.drawImage(
      sprite,
      frame.sx,
      frame.sy,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      screenX,
      screenY,
      drawWidth,
      drawHeight,
    );
  }

  // -------------------------------------------------------
  // DIBUJA LOS PERSONAJES SECUNDARIOS
  // -------------------------------------------------------
  function drawCompanions() {
    state.companions.forEach((companion) => {
      // -------------------------------------------------------
      // NO DIBUJAR EL PERSONAJE ACTIVO
      // -------------------------------------------------------
      if (companion.id === state.activeCharacter) {
        return;
      }

      // -------------------------------------------------------
      // USAR LOS SPRITES YA CARGADOS
      // -------------------------------------------------------
      const sprite = playerSprites[companion.sprite];

      if (!sprite) {
        return;
      }

      const drawWidth = companion.width * PLAYER_SCALE;

      const drawHeight = companion.height * PLAYER_SCALE;

      const screenX = Math.round(
        (companion.x - state.camera.x) * MAP_SCALE - drawWidth / 2,
      );

      const screenY = Math.round(
        (companion.y - state.camera.y) * MAP_SCALE - drawHeight,
      );

      const frame = getFrameForCharacter(companion);

      ctx.drawImage(
        sprite,
        frame.sx,
        frame.sy,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        screenX,
        screenY,
        drawWidth,
        drawHeight,
      );
    });

    // -------------------------------------------------------
    // DIBUJAR P1 SI NO ES EL ACTIVO
    // -------------------------------------------------------
    if (state.activeCharacter !== "slot1") {
      const p1 = state.player;

      const sprite = playerSprites[p1.sprite];

      if (!sprite) return;

      const drawWidth = p1.width * PLAYER_SCALE;

      const drawHeight = p1.height * PLAYER_SCALE;

      const screenX = Math.round(
        (p1.x - state.camera.x) * MAP_SCALE - drawWidth / 2,
      );

      const screenY = Math.round(
        (p1.y - state.camera.y) * MAP_SCALE - drawHeight,
      );

      const frame = getFrameForCharacter(p1);

      ctx.drawImage(
        sprite,
        frame.sx,
        frame.sy,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        screenX,
        screenY,
        drawWidth,
        drawHeight,
      );
    }
  }

  // -------------------------------------------------------
  // SELECCIONA EL FRAME CORRECTO DEL SPRITE
  // -------------------------------------------------------
  // -------------------------------------------------------
  // SELECCIONA EL FRAME CORRECTO DEL SPRITE
  // -------------------------------------------------------
  function getPlayerFrame() {
    const player = getActiveCharacter();

    const directionMap = {
      down: { idleCol: 0, animRow: 1 },
      up: { idleCol: 1, animRow: 4 },
      left: { idleCol: 2, animRow: 2 },
      right: { idleCol: 3, animRow: 3 },
    };

    const config = directionMap[player.direction] || directionMap.down;

    if (!player.moving) {
      return {
        sx: config.idleCol * FRAME_WIDTH,
        sy: 0,
      };
    }

    return {
      sx: player.animFrame * FRAME_WIDTH,
      sy: config.animRow * FRAME_HEIGHT,
    };
  }

  // -------------------------------------------------------
  // FRAME PARA CUALQUIER PERSONAJE
  // -------------------------------------------------------
  function getFrameForCharacter(character) {
    const directionMap = {
      down: { idleCol: 0, animRow: 1 },
      up: { idleCol: 1, animRow: 4 },
      left: { idleCol: 2, animRow: 2 },
      right: { idleCol: 3, animRow: 3 },
    };

    const config = directionMap[character.direction] || directionMap.down;

    if (!character.moving) {
      return {
        sx: config.idleCol * FRAME_WIDTH,
        sy: 0,
      };
    }

    return {
      sx: character.animFrame * FRAME_WIDTH,
      sy: config.animRow * FRAME_HEIGHT,
    };
  }

  // -------------------------------------------------------
  // FALLBACK SI EL SPRITE NO CARGA
  // -------------------------------------------------------
  function drawFallbackPlayer(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "#1f4fff";
    ctx.fillRect(4, 18, 16, 20);

    ctx.fillStyle = "#1635c9";
    ctx.fillRect(5, 38, 5, 18);
    ctx.fillRect(14, 38, 5, 18);

    ctx.fillStyle = "#f08b6b";
    ctx.fillRect(5, 2, 14, 14);

    ctx.fillStyle = "#7a2f00";
    ctx.fillRect(4, 0, 16, 5);

    ctx.fillStyle = "#f08b6b";
    ctx.fillRect(1, 20, 3, 14);
    ctx.fillRect(20, 20, 3, 14);

    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(8, 20, 8, 12);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(4, 56, 7, 3);
    ctx.fillRect(13, 56, 7, 3);

    ctx.restore();
  }

  // -------------------------------------------------------
  // ANCHO TOTAL DEL MUNDO
  // -------------------------------------------------------
  function getWorldWidth() {
    if (!mapData) return canvas.width;
    return mapData.cols * mapData.tileWidth;
  }

  // -------------------------------------------------------
  // ALTO TOTAL DEL MUNDO
  // -------------------------------------------------------
  function getWorldHeight() {
    if (!mapData) return canvas.height;
    return mapData.rows * mapData.tileHeight;
  }

  // -------------------------------------------------------
  // LIMITA UN VALOR ENTRE MIN Y MAX
  // -------------------------------------------------------
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
  // DEVUELVE EL OBJETO SOBRE EL QUE SE HA HECHO CLICK
  // -------------------------------------------------------
  function getObjectAt(worldX, worldY) {
    if (!mapData?.objects) return null;

    for (let i = mapData.objects.length - 1; i >= 0; i--) {
      const obj = mapData.objects[i];

      if (!obj.visible) continue;
      if (obj.collected) continue;

      const inside =
        worldX >= obj.x &&
        worldX <= obj.x + obj.hitboxWidth &&
        worldY >= obj.y &&
        worldY <= obj.y + obj.hitboxHeight;

      if (inside) {
        return obj;
      }
    }

    return null;
  }

  // -------------------------------------------------------
  // INTERACCIÓN CON OBJETOS / VERBOS
  // -------------------------------------------------------
  function handleObjectInteraction(obj) {
    const verb = state.currentVerb.toLowerCase();

    // ---------------------------------------------------
    // WHAT IS
    // ---------------------------------------------------
    if (verb === "what is") {
      showTemporaryMessage(obj.description, 2000);

      return;
    }

    // ---------------------------------------------------
    // PICK UP
    // ---------------------------------------------------
    if (verb === "pick up") {
      if (!obj.pickup) {
        if (actionLine) {
          actionLine.textContent = `No puedo coger ${obj.name}`;
        }

        return;
      }

      obj.collected = true;
      obj.visible = false;

      // inventario PJ1
      state.inventory[state.activeCharacter].push({
        id: obj.id,
        name: obj.name,
        sprite: obj.sprite,
        description: obj.description,
      });

      refreshInventoryUI();

      console.log("Inventario P1:", state.inventory.p1);

      if (actionLine) {
        actionLine.textContent = `Has cogido ${obj.name}`;
      }

      return;
    }

    // ---------------------------------------------------
    // RESTO DE VERBOS
    // ---------------------------------------------------
    if (actionLine) {
      actionLine.textContent = `${state.currentVerb} ${obj.name}`;
    }
  }

  // -------------------------------------------------------
  // MUESTRA UN MENSAJE TEMPORAL EN LA ACTION LINE
  // -------------------------------------------------------
  function showTemporaryMessage(text, duration = 2000) {
    // limpiar timeout anterior
    if (state.messageTimeout) {
      clearTimeout(state.messageTimeout);
    }

    if (actionLine) {
      actionLine.textContent = text;
    }

    state.messageTimeout = setTimeout(() => {
      if (actionLine) {
        actionLine.textContent = `${state.currentVerb} ...`;
      }

      state.messageTimeout = null;
    }, duration);
  }

  // -------------------------------------------------------
  // ACTUALIZA VISUALMENTE EL INVENTARIO HTML
  // -------------------------------------------------------
  function refreshInventoryUI() {
    const slots = document.querySelectorAll(".inventory-slot");

    // limpiar slots
    slots.forEach((slot) => {
      slot.innerHTML = "";
    });

    // dibujar objetos del personaje 1
    const inventory = state.inventory[state.activeCharacter];

    inventory.forEach((obj, index) => {
      if (!slots[index]) return;

      const img = document.createElement("img");

      img.src = `./img/objects/${obj.sprite}`;
      img.classList.add("inventory-item");

      slots[index].appendChild(img);
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
