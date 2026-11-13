window.EditorModule = (() => {
  let canvas, ctx;
  let image = null;

  const TILE_W = 24;
  const TILE_H = 30;
  const DISPLAY_SCALE = 2;

  let grid = [];
  let cols = 0;
  let rows = 0;

  let drawing = false;
  let showGrid = true;

  // -------------------------------------------------------
  // HERRAMIENTA ACTIVA
  // -------------------------------------------------------
  let currentTool = "paint";

  // paint
  // erase
  // object
  // hotspot-create
  // hotspot-edit
  // npc
  // teleport

  // -------------------------------------------------------
  // OBJETOS DEL EDITOR
  // -------------------------------------------------------
  let editorObjects = [];
  let objectSprites = {};

  // -------------------------------------------------------
  // GRÁFICOS TRASPASABLES DE PRIMER PLANO
  // -------------------------------------------------------
  let editorForegroundGraphics = [];
  let foregroundGraphicSprites = {};
  let selectedForegroundGraphic = null;
  let draggingForegroundGraphic = false;
  let foregroundDragOffsetX = 0;
  let foregroundDragOffsetY = 0;
  let pendingForegroundTypeId = null;

  // -------------------------------------------------------
  // NPC DEL EDITOR
  // -------------------------------------------------------
  let editorNpcs = [];
  let npcSprites = {};
  let selectedNpc = null;
  let draggingNpc = false;
  let npcDragOffsetX = 0;
  let npcDragOffsetY = 0;
  let pendingNpcTypeId = null;

  // -------------------------------------------------------
  // HOTSPOTS DEL EDITOR
  // -------------------------------------------------------
  let editorHotspots = [];

  let drawingHotspot = false;
  let hotspotStart = null;
  let hotspotPreview = null;
  let selectedHotspot = null;

  // -------------------------------------------------------
  // PORTAL DE PUERTAS
  // -------------------------------------------------------
  let drawingPortal = false;
  let portalStart = null;
  let portalPreview = null;

  // -------------------------------------------------------
  // SELECCIÓN DE OBJETOS
  // -------------------------------------------------------
  let selectedObject = null;
  let draggingObject = false;

  let draggingHotspot = false;

  let hotspotOffsetX = 0;
  let hotspotOffsetY = 0;

  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const DEFAULT_OBJECT_ID = "key";

  function start() {
    canvas = document.getElementById("editor-canvas");
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    window.ObjectLibrary.forEach((item) => {
      loadEditorObjectSprite(item.sprite);
      Object.values(item.stateSprites ?? {}).forEach((sprite) => {
        loadEditorObjectSprite(sprite);
      });
    });
    window.ForegroundGraphicLibrary.forEach((item) => {
      loadEditorForegroundGraphicSprite(item);
    });
    window.NpcLibrary.forEach((item) => {
      loadEditorNpcSprite(item);
    });
    bindEvents();
    updateInspector();
  }

  function bindEvents() {
    const uploadInput = document.getElementById("map-upload");
    const editMapBtn = document.getElementById("edit-map-btn");
    const saveBtn = document.getElementById("save-map-btn");

    const toggleGridBtn = document.getElementById("toggle-grid-btn");
    const addForegroundGraphicBtn = document.getElementById(
      "add-foreground-graphic-btn",
    );
    const editForegroundGraphicBtn = document.getElementById(
      "edit-foreground-graphic-btn",
    );
    const deleteForegroundGraphicBtn = document.getElementById(
      "delete-foreground-graphic-mode-btn",
    );
    const addNpcBtn = document.getElementById("add-npc-btn");
    const editNpcBtn = document.getElementById("edit-npc-btn");
    const deleteNpcBtn = document.getElementById("delete-npc-btn");
    const paintBtn = document.getElementById("paint-collision-btn");
    const eraseBtn = document.getElementById("erase-mode-btn");

    const editObjectBtn = document.getElementById("edit-object-btn");
    const addObjectBtn = document.getElementById("add-object-btn");
    const deleteObjectBtn = document.getElementById("delete-object-btn");

    const editHotspotBtn = document.getElementById("btn-edit-hotspots");
    const addHotspotBtn = document.getElementById("btn-add-hotspot");
    const deleteHotspotBtn = document.getElementById("btn-delete-hotspot");

    // ----------------------------------------------------
    // CARGAR MAPA
    // ----------------------------------------------------
    if (uploadInput && !uploadInput.dataset.bound) {
      uploadInput.addEventListener("change", loadImage);
      uploadInput.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // GUARDAR MAPA
    // ----------------------------------------------------
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.addEventListener("click", saveMap);
      saveBtn.dataset.bound = "true";
    }

    // --------------------------------------
    // EDITAR MAPA
    // --------------------------------------

    if (editMapBtn && !editMapBtn.dataset.bound) {
      editMapBtn.addEventListener("click", () => {
        openEditorPopup("Abrir mapa");
      });

      editMapBtn.dataset.bound = "true";
    }

    // --------------------------------------
    // CERRAR POPUP
    // --------------------------------------

    const popupCloseBtn = document.getElementById("editor-popup-close");

    if (popupCloseBtn && !popupCloseBtn.dataset.bound) {
      popupCloseBtn.addEventListener("click", () => {
        closeEditorPopup();
      });

      popupCloseBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // MOSTRAR / OCULTAR REJILLA
    // ----------------------------------------------------
    if (toggleGridBtn && !toggleGridBtn.dataset.bound) {
      toggleGridBtn.addEventListener("click", () => {
        showGrid = !showGrid;

        toggleGridBtn.textContent = showGrid ? "Quitar rejilla" : "Ver rejilla";

        draw();
      });

      toggleGridBtn.dataset.bound = "true";
    }

    if (addForegroundGraphicBtn && !addForegroundGraphicBtn.dataset.bound) {
      addForegroundGraphicBtn.addEventListener("click", () => {
        openForegroundGraphicPopup();
      });
      addForegroundGraphicBtn.dataset.bound = "true";
    }

    if (editForegroundGraphicBtn && !editForegroundGraphicBtn.dataset.bound) {
      editForegroundGraphicBtn.addEventListener("click", () => {
        activateTool("foreground-edit");
      });
      editForegroundGraphicBtn.dataset.bound = "true";
    }

    if (
      deleteForegroundGraphicBtn &&
      !deleteForegroundGraphicBtn.dataset.bound
    ) {
      deleteForegroundGraphicBtn.addEventListener("click", () => {
        activateTool("foreground-delete");
      });
      deleteForegroundGraphicBtn.dataset.bound = "true";
    }

    if (addNpcBtn && !addNpcBtn.dataset.bound) {
      addNpcBtn.addEventListener("click", () => {
        openNpcPopup();
      });
      addNpcBtn.dataset.bound = "true";
    }

    if (editNpcBtn && !editNpcBtn.dataset.bound) {
      editNpcBtn.addEventListener("click", () => {
        activateTool("npc-edit");
      });
      editNpcBtn.dataset.bound = "true";
    }

    if (deleteNpcBtn && !deleteNpcBtn.dataset.bound) {
      deleteNpcBtn.addEventListener("click", () => {
        activateTool("npc-delete");
      });
      deleteNpcBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // PINTAR COLISIONES
    // ----------------------------------------------------
    if (paintBtn && !paintBtn.dataset.bound) {
      paintBtn.addEventListener("click", () => {
        currentTool = "paint";

        selectedObject = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;

        updateToolButtons();
        updateInspector();
        draw();
      });

      paintBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // BORRAR COLISIONES
    // ----------------------------------------------------
    if (eraseBtn && !eraseBtn.dataset.bound) {
      eraseBtn.addEventListener("click", () => {
        currentTool = "erase";

        selectedObject = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;

        updateToolButtons();
        updateInspector();
        draw();
      });

      eraseBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // EDITAR OBJETOS
    // ----------------------------------------------------
    if (editObjectBtn && !editObjectBtn.dataset.bound) {
      editObjectBtn.addEventListener("click", () => {
        currentTool = "object";
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;
        updateToolButtons();
        updateInspector();
        draw();
      });

      editObjectBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // AÑADIR OBJETO
    // ----------------------------------------------------
    if (addObjectBtn && !addObjectBtn.dataset.bound) {
      addObjectBtn.addEventListener("click", () => {
        currentTool = "object-create";
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;
        updateToolButtons();
        addDefaultObject();
      });

      addObjectBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // ELIMINAR OBJETO
    // ----------------------------------------------------
    if (deleteObjectBtn && !deleteObjectBtn.dataset.bound) {
      deleteObjectBtn.addEventListener("click", () => {
        currentTool = "object-delete";

        selectedObject = null;
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;

        updateInspector();
        updateToolButtons();
        draw();
      });

      deleteObjectBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // AÑADIR HOTSPOT
    // ----------------------------------------------------
    if (addHotspotBtn && !addHotspotBtn.dataset.bound) {
      addHotspotBtn.addEventListener("click", () => {
        currentTool = "hotspot-create";

        selectedObject = null;
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;

        updateInspector();
        updateToolButtons();
        draw();
      });

      addHotspotBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // EDITAR HOTSPOT
    // ----------------------------------------------------
    if (editHotspotBtn && !editHotspotBtn.dataset.bound) {
      editHotspotBtn.addEventListener("click", () => {
        currentTool = "hotspot-edit";

        selectedObject = null;
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;

        updateInspector();
        updateToolButtons();

        draw();
      });

      editHotspotBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // ELIMINAR HOTSPOT
    // ----------------------------------------------------
    if (deleteHotspotBtn && !deleteHotspotBtn.dataset.bound) {
      deleteHotspotBtn.addEventListener("click", () => {
        currentTool = "hotspot-delete";

        selectedObject = null;
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        selectedNpc = null;

        updateToolButtons();
        updateInspector();

        draw();
      });

      deleteHotspotBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // EVENTOS DEL CANVAS
    // ----------------------------------------------------
    if (canvas && !canvas.dataset.bound) {
      canvas.addEventListener("mousedown", (e) => {
        if (currentTool === "npc-create" && pendingNpcTypeId) {
          addNpcAtPoint(pendingNpcTypeId, getCanvasPoint(e));
          return;
        }

        if (
          currentTool === "foreground-create" &&
          pendingForegroundTypeId
        ) {
          addForegroundGraphicAtPoint(
            pendingForegroundTypeId,
            getCanvasPoint(e),
          );
          return;
        }

        // ---------------------------------------------------
        // EMPEZAR A DIBUJAR PORTAL
        // ---------------------------------------------------

        if (drawingPortal && selectedObject) {
          const point = getCanvasPoint(e);

          portalStart = point;

          portalPreview = {
            x: point.x,
            y: point.y,

            width: 0,
            height: 0,
          };

          return;
        }
        // ---------------------------------------------------
        // EMPEZAR A CREAR HOTSPOT
        // ---------------------------------------------------
        if (currentTool === "hotspot-create") {
          if (!image) return;

          const point = getCanvasPoint(e);

          drawingHotspot = true;

          hotspotStart = {
            x: point.x,
            y: point.y,
          };

          hotspotPreview = {
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
          };

          draw();
          return;
        }

        // ---------------------------------------------------
        // SELECCIONAR OBJETOS
        // ---------------------------------------------------
        if (trySelectHotspot(e)) {
          return;
        }

        if (tryDeleteHotspot(e)) {
          return;
        }

        if (tryDeleteObject(e)) {
          return;
        }

        if (tryDeleteForegroundGraphic(e)) {
          return;
        }

        if (tryDeleteNpc(e)) {
          return;
        }

        if (trySelectForegroundGraphic(e)) {
          return;
        }

        if (trySelectNpc(e)) {
          return;
        }

        if (trySelectObject(e)) {
          return;
        }

        // ---------------------------------------------------
        // PINTAR O BORRAR COLISIONES
        // ---------------------------------------------------
        drawing = true;
        paintAtEvent(e);
      });

      canvas.addEventListener("mousemove", (e) => {
        // ---------------------------------------------------
        // PREVISUALIZAR PORTAL
        // ---------------------------------------------------

        if (drawingPortal && portalStart) {
          const point = getCanvasPoint(e);

          portalPreview = {
            x: Math.min(point.x, portalStart.x),

            y: Math.min(point.y, portalStart.y),

            width: Math.abs(point.x - portalStart.x),

            height: Math.abs(point.y - portalStart.y),
          };

          draw();

          return;
        }
        // ---------------------------------------------------
        // ACTUALIZAR RECTÁNGULO DEL HOTSPOT
        // ---------------------------------------------------
        if (
          currentTool === "hotspot-create" &&
          drawingHotspot &&
          hotspotStart
        ) {
          const point = getCanvasPoint(e);

          hotspotPreview = {
            x: Math.min(hotspotStart.x, point.x),
            y: Math.min(hotspotStart.y, point.y),

            width: Math.abs(point.x - hotspotStart.x),
            height: Math.abs(point.y - hotspotStart.y),
          };

          draw();
          return;
        }

        // ---------------------------------------------------
        // ARRASTRAR OBJETO
        // ---------------------------------------------------
        if (draggingObject) {
          dragSelectedObject(e);
          return;
        }

        if (draggingForegroundGraphic) {
          dragSelectedForegroundGraphic(e);
          return;
        }

        if (draggingNpc) {
          dragSelectedNpc(e);
          return;
        }

        // ---------------------------------------------------
        // ARRASTRAR HOTSPOT
        // ---------------------------------------------------

        if (draggingHotspot && selectedHotspot) {
          const point = getCanvasPoint(e);

          selectedHotspot.x = Math.round(point.x - hotspotOffsetX);

          selectedHotspot.y = Math.round(point.y - hotspotOffsetY);

          draw();

          return;
        }

        // ---------------------------------------------------
        // PINTAR O BORRAR COLISIONES
        // ---------------------------------------------------
        if (!drawing) return;

        paintAtEvent(e);
      });

      window.addEventListener("mouseup", () => {
        // ---------------------------------------------------
        // TERMINAR PORTAL
        // ---------------------------------------------------

        if (drawingPortal && portalPreview && selectedObject) {
          selectedObject.portal = {
            x: portalPreview.x,

            y: portalPreview.y,

            width: portalPreview.width,

            height: portalPreview.height,
          };

          drawingPortal = false;

          portalStart = null;

          portalPreview = null;

          updateInspector();

          draw();
        }
        // ---------------------------------------------------
        // TERMINAR CREACIÓN DEL HOTSPOT
        // ---------------------------------------------------
        if (
          currentTool === "hotspot-create" &&
          drawingHotspot &&
          hotspotPreview
        ) {
          drawingHotspot = false;

          // Evitar zonas creadas accidentalmente con un solo clic
          if (hotspotPreview.width >= 4 && hotspotPreview.height >= 4) {
            const hotspotNumber = editorHotspots.length + 1;

            const defaultHotspot = window.HotspotLibrary?.[0];

            const newHotspot = {
              id: `hotspot_${hotspotNumber}`,

              typeId: defaultHotspot?.id ?? null,

              x: hotspotPreview.x,
              y: hotspotPreview.y,

              width: hotspotPreview.width,
              height: hotspotPreview.height,
            };

            editorHotspots.push(newHotspot);

            selectedHotspot = newHotspot;
            selectedObject = null;

            updateInspector();
          }

          hotspotStart = null;
          hotspotPreview = null;

          draw();
        }

        drawing = false;

        draggingObject = false;
        draggingHotspot = false;
        draggingForegroundGraphic = false;
        draggingNpc = false;
      });
      canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      canvas.dataset.bound = "true";
    }

    updateToolButtons();
  }

  function activateTool(tool) {
    currentTool = tool;

    selectedObject = null;
    selectedHotspot = null;
    selectedForegroundGraphic = null;
    selectedNpc = null;

    draggingObject = false;
    draggingHotspot = false;
    draggingForegroundGraphic = false;
    draggingNpc = false;
    pendingForegroundTypeId = null;
    pendingNpcTypeId = null;

    updateInspector();
    updateToolButtons();
    draw();
  }

  function updateToolButtons() {
    const paintBtn = document.getElementById("paint-collision-btn");
    const eraseBtn = document.getElementById("erase-mode-btn");
    const editObjectBtn = document.getElementById("edit-object-btn");
    const addObjectBtn = document.getElementById("add-object-btn");
    const deleteObjectBtn = document.getElementById("delete-object-btn");
    const addHotspotBtn = document.getElementById("btn-add-hotspot");
    const editHotspotBtn = document.getElementById("btn-edit-hotspots");
    const deleteHotspotBtn = document.getElementById("btn-delete-hotspot");
    const addForegroundGraphicBtn = document.getElementById(
      "add-foreground-graphic-btn",
    );
    const editForegroundGraphicBtn = document.getElementById(
      "edit-foreground-graphic-btn",
    );
    const deleteForegroundGraphicBtn = document.getElementById(
      "delete-foreground-graphic-mode-btn",
    );
    const addNpcBtn = document.getElementById("add-npc-btn");
    const editNpcBtn = document.getElementById("edit-npc-btn");
    const deleteNpcBtn = document.getElementById("delete-npc-btn");

    // --------------------------------------
    // HABILITAR / DESHABILITAR ELIMINAR
    // --------------------------------------
    //deleteObjectBtn.disabled = selectedObject === null;

    paintBtn.style.outline = "none";
    eraseBtn.style.outline = "none";

    editObjectBtn.style.outline = "none";
    addObjectBtn.style.outline = "none";
    deleteObjectBtn.style.outline = "none";

    editHotspotBtn.style.outline = "none";

    addHotspotBtn.style.outline = "none";
    deleteHotspotBtn.style.outline = "none";
    addForegroundGraphicBtn.style.outline = "none";
    editForegroundGraphicBtn.style.outline = "none";
    deleteForegroundGraphicBtn.style.outline = "none";
    addNpcBtn.style.outline = "none";
    editNpcBtn.style.outline = "none";
    deleteNpcBtn.style.outline = "none";

    if (currentTool === "paint") {
      paintBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "erase") {
      eraseBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "object") {
      editObjectBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "object-create") {
      addObjectBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "object-delete") {
      deleteObjectBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "hotspot-edit") {
      editHotspotBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "hotspot-create") {
      addHotspotBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "hotspot-delete") {
      deleteHotspotBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "foreground-create") {
      addForegroundGraphicBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "foreground-edit") {
      editForegroundGraphicBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "foreground-delete") {
      deleteForegroundGraphicBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "npc-create") {
      addNpcBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "npc-edit") {
      editNpcBtn.style.outline = "6px solid #000000";
    }

    if (currentTool === "npc-delete") {
      deleteNpcBtn.style.outline = "6px solid #000000";
    }
  }

  function loadImage(e) {
    const file = e.target.files[0];
    currentMapImage = file.name;
    if (!file) return;

    const img = new Image();

    img.onload = () => {
      image = img;

      // Tamaño lógico del mapa
      canvas.width = img.width;
      canvas.height = img.height;

      // Tamaño visual ampliado x2
      canvas.style.width = `${img.width * DISPLAY_SCALE}px`;
      canvas.style.height = `${img.height * DISPLAY_SCALE}px`;

      cols = Math.floor(img.width / TILE_W);
      rows = Math.floor(img.height / TILE_H);

      grid = Array.from({ length: rows }, () => Array(cols).fill(0));

      draw();
    };

    img.src = URL.createObjectURL(file);
  }

  // -------------------------------------------------------
  // OBTENER POSICIÓN DEL RATÓN DENTRO DEL CANVAS
  // -------------------------------------------------------
  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }

  function paintAtEvent(e) {
    if (currentTool !== "paint" && currentTool !== "erase") {
      return;
    }

    if (!image) return;

    const rect = canvas.getBoundingClientRect();

    // Convertimos del tamaño visual al tamaño lógico real del canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(mouseX / TILE_W);
    const row = Math.floor(mouseY / TILE_H);

    if (col < 0 || row < 0 || col >= cols || row >= rows) return;

    grid[row][col] = currentTool === "paint" ? 1 : 0;

    draw();
  }

  // -------------------------------------------------------
  // CARGA SPRITE DE OBJETO PARA EL EDITOR
  // -------------------------------------------------------
  function loadEditorObjectSprite(spriteName, onLoaded = null) {
    if (objectSprites[spriteName]) {
      if (onLoaded) {
        onLoaded(objectSprites[spriteName]);
      }

      draw();
      return;
    }

    const img = new Image();

    img.onload = () => {
      objectSprites[spriteName] = img;

      if (onLoaded) {
        onLoaded(img);
      }

      draw();
    };

    img.onerror = () => {
      console.warn(`No se pudo cargar el sprite del objeto: ${spriteName}`);
    };

    img.src = `./img/objects/${spriteName}`;
  }

  function loadEditorForegroundGraphicSprite(libraryItem) {
    if (!libraryItem?.sprite || foregroundGraphicSprites[libraryItem.id]) {
      return;
    }

    const img = new Image();

    img.onload = () => {
      foregroundGraphicSprites[libraryItem.id] = img;
      draw();
    };

    img.onerror = () => {
      console.warn(
        `No se pudo cargar el gráfico traspasable: ${libraryItem.sprite}`,
      );
    };

    img.src = `./img/traspasables/${libraryItem.sprite}`;
  }

  function getForegroundLibraryItem(typeId) {
    return window.ForegroundGraphicLibrary.find((item) => item.id === typeId);
  }

  function getForegroundGraphicSize(graphic) {
    const libraryItem = getForegroundLibraryItem(graphic.typeId);
    const sprite = foregroundGraphicSprites[graphic.typeId];

    return {
      width:
        graphic.width ??
        libraryItem?.defaultSpriteWidth ??
        sprite?.naturalWidth ??
        48,
      height:
        graphic.height ??
        libraryItem?.defaultSpriteHeight ??
        sprite?.naturalHeight ??
        48,
    };
  }

  function createForegroundGraphicId(typeId) {
    let number = 1;
    let id = `${typeId}_${number}`;

    while (editorForegroundGraphics.some((graphic) => graphic.id === id)) {
      number += 1;
      id = `${typeId}_${number}`;
    }

    return id;
  }

  function addForegroundGraphicAtPoint(typeId, point) {
    const libraryItem = getForegroundLibraryItem(typeId);
    if (!image || !libraryItem) return;

    const graphic = {
      id: createForegroundGraphicId(typeId),
      typeId,
      x: point.x,
      y: point.y,
    };

    editorForegroundGraphics.push(graphic);
    selectedForegroundGraphic = graphic;
    selectedObject = null;
    selectedHotspot = null;

    updateInspector();
    updateToolButtons();
    draw();
  }

  function loadEditorNpcSprite(libraryItem) {
    if (!libraryItem?.sprite || npcSprites[libraryItem.id]) return;

    const img = new Image();

    img.onload = () => {
      npcSprites[libraryItem.id] = img;
      draw();
    };

    img.onerror = () => {
      console.warn(`No se pudo cargar el sprite del NPC: ${libraryItem.sprite}`);
    };

    img.src = `./img/npcs/${libraryItem.sprite}`;
  }

  function getNpcLibraryItem(typeId) {
    return window.NpcLibrary.find((item) => item.id === typeId);
  }

  function getEditorNpcSize(npc) {
    const libraryItem = getNpcLibraryItem(npc.typeId);

    return {
      width:
        npc.spriteWidth ??
        libraryItem?.defaultSpriteWidth ??
        libraryItem?.frameWidth ??
        24,
      height:
        npc.spriteHeight ??
        libraryItem?.defaultSpriteHeight ??
        libraryItem?.frameHeight ??
        60,
    };
  }

  function cloneEditorNpcCollision(collision) {
    return {
      offsetX: Number(collision?.offsetX) || 0,
      offsetY: Number(collision?.offsetY) || 0,
      width: Math.max(1, Number(collision?.width) || 1),
      height: Math.max(1, Number(collision?.height) || 1),
    };
  }

  function getEditorNpcCollisionRect(npc) {
    const libraryItem = getNpcLibraryItem(npc.typeId);
    const collision = cloneEditorNpcCollision(
      npc.collision ?? libraryItem?.defaultCollision,
    );

    return {
      x: npc.x + collision.offsetX,
      y: npc.y + collision.offsetY,
      width: collision.width,
      height: collision.height,
    };
  }

  function createNpcId(typeId) {
    let number = 1;
    let id = `${typeId}_instance_${number}`;

    while (editorNpcs.some((npc) => npc.id === id)) {
      number += 1;
      id = `${typeId}_instance_${number}`;
    }

    return id;
  }

  function addNpcAtPoint(typeId, point) {
    const libraryItem = getNpcLibraryItem(typeId);
    if (!image || !libraryItem) return;

    const npc = {
      id: createNpcId(typeId),
      typeId,
      x: point.x,
      y: point.y,
      collision: cloneEditorNpcCollision(libraryItem.defaultCollision),
    };

    editorNpcs.push(npc);
    selectedNpc = npc;
    selectedObject = null;
    selectedHotspot = null;
    selectedForegroundGraphic = null;

    updateInspector();
    updateToolButtons();
    draw();
  }

  // -------------------------------------------------------
  // DEVUELVE UN OBJETO DEL CATÁLOGO POR ID
  // -------------------------------------------------------
  function getObjectLibraryItemById(id) {
    return window.ObjectLibrary.find((item) => item.id === id);
  }

  // -------------------------------------------------------
  // CREA UN OBJETO BÁSICO EN EL CENTRO DEL MAPA
  // -------------------------------------------------------
  function addDefaultObject() {
    if (!image) {
      return;
    }

    const libraryItem = getObjectLibraryItemById(DEFAULT_OBJECT_ID);

    if (!libraryItem) {
      console.warn("No existe el objeto por defecto en OBJECT_LIBRARY.");
      return;
    }

    const objectNumber = editorObjects.length + 1;

    const obj = {
      id: `object_${objectNumber}`,
      name: libraryItem.name,
      description: "Objeto creado desde el editor.",

      x: Math.round(canvas.width / 2 - 8),
      y: Math.round(canvas.height / 2 - 8),

      spriteWidth: libraryItem.defaultSpriteWidth,
      spriteHeight: libraryItem.defaultSpriteHeight,

      hitboxWidth: libraryItem.defaultHitboxWidth,
      hitboxHeight: libraryItem.defaultHitboxHeight,

      type: libraryItem.type ?? "item",
      sprite: libraryItem.sprite,
      state: libraryItem.defaultState ?? null,
      stateSprites: libraryItem.stateSprites
        ? { ...libraryItem.stateSprites }
        : null,
      containedObjectId: null,
      blockedByNpcId: null,
      alwaysOnTop: libraryItem.alwaysOnTop ?? false,
      worldRenderWidth: libraryItem.worldRenderWidth ?? null,
      worldRenderHeight: libraryItem.worldRenderHeight ?? null,

      visible: true,

      pickup: libraryItem.pickup ?? false,
      collected: false,

      locked: libraryItem.locked ?? false,
      opened: libraryItem.opened ?? false,

      requiredItem: libraryItem.requiredItem ?? null,

      openSprite: libraryItem.openSprite ?? null,

      closedSprite: libraryItem.closedSprite ?? null,

      doorPair: libraryItem.doorPair ?? null,

      typeId: libraryItem.id,

      teleportTo: libraryItem.teleportTo ?? null,
      teleportX: libraryItem.teleportX ?? 0,
      teleportY: libraryItem.teleportY ?? 0,
      teleportDirection: libraryItem.teleportDirection ?? "down",
      interactionMode: libraryItem.interactionMode ?? "front",
      teleportMode: libraryItem.teleportMode ?? "front",

      interactionTileX: null,
      interactionTileY: null,

      portal: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    };

    editorObjects.push(obj);

    selectedObject = obj;

    loadEditorObjectSprite(obj.sprite);

    updateInspector();
    updateToolButtons();
    draw();
  }

  function draw() {
    if (!image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(image, 0, 0);

    drawCollisionOverlay();

    drawEditorObjects();

    drawEditorNpcs();

    drawEditorForegroundGraphics();

    // ------------------------------------------
    // HOTSPOTS YA CREADOS
    // ------------------------------------------

    drawEditorHotspots();

    // ------------------------------------------
    // HOTSPOT QUE SE ESTÁ DIBUJANDO
    // ------------------------------------------

    drawHotspotPreview();

    drawPortalPreview();

    if (showGrid) {
      drawGrid();

      drawColumnNumbers();
    }
  }

  function drawCollisionOverlay() {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (grid[row][col] === 1) {
          ctx.fillStyle = "rgba(0, 255, 0, 0.45)";
          ctx.fillRect(col * TILE_W, row * TILE_H, TILE_W, TILE_H);
        }
      }
    }
  }

  // -------------------------------------------------------
  // DIBUJA OBJETOS DEL EDITOR
  // -------------------------------------------------------
  function isEditorObjectAlwaysOnTop(obj) {
    if (typeof obj?.alwaysOnTop === "boolean") return obj.alwaysOnTop;

    return (
      window.ObjectLibrary.find((item) => item.id === obj?.typeId)
        ?.alwaysOnTop === true
    );
  }

  function getEditorWorldRenderSize(obj) {
    const libraryItem = window.ObjectLibrary.find(
      (item) => item.id === obj?.typeId,
    );

    return {
      width:
        obj?.worldRenderWidth ??
        libraryItem?.worldRenderWidth ??
        obj?.spriteWidth ??
        obj?.hitboxWidth ??
        0,
      height:
        obj?.worldRenderHeight ??
        libraryItem?.worldRenderHeight ??
        obj?.spriteHeight ??
        obj?.hitboxHeight ??
        0,
    };
  }

  function getEditorObjectsInDrawOrder() {
    return [
      ...editorObjects.filter((obj) => !isEditorObjectAlwaysOnTop(obj)),
      ...editorObjects.filter((obj) => isEditorObjectAlwaysOnTop(obj)),
    ];
  }

  function drawEditorObjects() {
    getEditorObjectsInDrawOrder().forEach((obj) => {
      const sprite = objectSprites[obj.sprite];
      const worldRenderSize = getEditorWorldRenderSize(obj);

      ctx.save();

      // --------------------------------------------
      // MODO COLISIONES
      // --------------------------------------------
      if (currentTool === "paint" || currentTool === "erase") {
        ctx.globalAlpha = 0.35;
      }

      // --------------------------------------------
      // DIBUJAR SPRITE
      // --------------------------------------------
      if (sprite) {
        ctx.drawImage(
          sprite,
          obj.x,
          obj.y,
          worldRenderSize.width,
          worldRenderSize.height,
        );
        // --------------------------------------------
        // PORTAL
        // --------------------------------------------

        if (obj.portal && obj.portal.width > 0 && obj.portal.height > 0) {
          ctx.fillStyle = "rgba(255,0,180,0.25)";

          ctx.strokeStyle = "#ff00b4";

          ctx.lineWidth = 2;

          ctx.fillRect(
            obj.portal.x,

            obj.portal.y,

            obj.portal.width,

            obj.portal.height,
          );

          ctx.strokeRect(
            obj.portal.x,

            obj.portal.y,

            obj.portal.width,

            obj.portal.height,
          );
        }
      }

      // --------------------------------------------
      // HITBOX
      // --------------------------------------------
      ctx.strokeStyle = obj === selectedObject ? "#ffff00" : "#00ff00";

      ctx.lineWidth = 1;

      ctx.strokeRect(
        obj.x,
        obj.y,
        worldRenderSize.width,
        worldRenderSize.height,
      );

      // --------------------------------------------
      // ID
      // --------------------------------------------
      ctx.fillStyle = "#00ff00";
      ctx.font = "10px Courier New";

      ctx.fillText(obj.id, obj.x, obj.y - 4);

      ctx.restore();
    });
  }

  function drawEditorForegroundGraphics() {
    editorForegroundGraphics.forEach((graphic) => {
      const libraryItem = getForegroundLibraryItem(graphic.typeId);
      const sprite = foregroundGraphicSprites[graphic.typeId];
      const size = getForegroundGraphicSize(graphic);

      ctx.save();

      if (sprite) {
        ctx.drawImage(sprite, graphic.x, graphic.y, size.width, size.height);
      } else {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "#ff9d00";
        ctx.strokeRect(graphic.x, graphic.y, size.width, size.height);
        ctx.fillStyle = "#ff9d00";
        ctx.font = "10px Courier New";
        ctx.fillText("PNG pendiente", graphic.x + 2, graphic.y + 12);
      }

      ctx.setLineDash([]);
      ctx.strokeStyle =
        graphic === selectedForegroundGraphic ? "#ffff00" : "#ff9d00";
      ctx.strokeRect(graphic.x, graphic.y, size.width, size.height);
      ctx.fillStyle = "#ff9d00";
      ctx.font = "10px Courier New";
      ctx.fillText(
        `${graphic.id}${libraryItem ? "" : " (tipo desconocido)"}`,
        graphic.x,
        graphic.y - 4,
      );

      ctx.restore();
    });
  }

  function drawEditorNpcs() {
    editorNpcs.forEach((npc) => {
      const libraryItem = getNpcLibraryItem(npc.typeId);
      const sprite = npcSprites[npc.typeId];
      const size = getEditorNpcSize(npc);
      const collision = getEditorNpcCollisionRect(npc);

      ctx.save();

      if (sprite && libraryItem) {
        ctx.drawImage(
          sprite,
          0,
          (libraryItem.animationRow ?? 0) * libraryItem.frameHeight,
          libraryItem.frameWidth,
          libraryItem.frameHeight,
          npc.x,
          npc.y,
          size.width,
          size.height,
        );
      } else {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = "#00aaff";
        ctx.strokeRect(npc.x, npc.y, size.width, size.height);
        ctx.fillStyle = "#00aaff";
        ctx.font = "10px Courier New";
        ctx.fillText("PNG NPC pendiente", npc.x + 2, npc.y + 12);
      }

      ctx.setLineDash([]);
      ctx.strokeStyle = npc === selectedNpc ? "#ffff00" : "#00aaff";
      ctx.strokeRect(npc.x, npc.y, size.width, size.height);

      ctx.fillStyle = "rgba(255, 0, 0, 0.25)";
      ctx.strokeStyle = "#ff3333";
      ctx.fillRect(collision.x, collision.y, collision.width, collision.height);
      ctx.strokeRect(collision.x, collision.y, collision.width, collision.height);

      ctx.fillStyle = "#00aaff";
      ctx.font = "10px Courier New";
      ctx.fillText(npc.id, npc.x, npc.y - 4);

      ctx.restore();
    });
  }

  // -------------------------------------------------------
  // DIBUJAR HOTSPOTS
  // -------------------------------------------------------
  function drawEditorHotspots() {
    ctx.save();

    editorHotspots.forEach((hotspot) => {
      if (hotspot === selectedHotspot) {
        // Hotspot seleccionado
        ctx.fillStyle = "rgba(0,255,255,0.35)";
        ctx.strokeStyle = "#00ffff";
      } else {
        // Hotspots existentes
        ctx.fillStyle = "rgba(0,180,255,0.22)";
        ctx.strokeStyle = "#00d8ff";
      }

      ctx.lineWidth = 2;

      ctx.fillRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);

      ctx.strokeRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
    });

    ctx.restore();
  }

  // -------------------------------------------------------
  // PREVISUALIZACIÓN DEL HOTSPOT
  // -------------------------------------------------------

  function drawHotspotPreview() {
    if (!hotspotPreview) return;

    ctx.save();

    ctx.fillStyle = "rgba(255,255,0,0.25)";

    ctx.strokeStyle = "#ffff00";

    ctx.lineWidth = 2;

    ctx.fillRect(
      hotspotPreview.x,

      hotspotPreview.y,

      hotspotPreview.width,

      hotspotPreview.height,
    );

    ctx.strokeRect(
      hotspotPreview.x,

      hotspotPreview.y,

      hotspotPreview.width,

      hotspotPreview.height,
    );

    ctx.restore();
  }

  // -------------------------------------------------------
  // PREVISUALIZACIÓN DEL PORTAL
  // -------------------------------------------------------

  function drawPortalPreview() {
    if (!portalPreview) return;

    ctx.save();

    ctx.fillStyle = "rgba(255,0,180,0.25)";

    ctx.strokeStyle = "#ff00b4";

    ctx.lineWidth = 2;

    ctx.fillRect(
      portalPreview.x,
      portalPreview.y,
      portalPreview.width,
      portalPreview.height,
    );

    ctx.strokeRect(
      portalPreview.x,
      portalPreview.y,
      portalPreview.width,
      portalPreview.height,
    );

    ctx.restore();
  }

  // -------------------------------------------------------
  // SELECCIONAR OBJETO
  // -------------------------------------------------------
  function trySelectObject(e) {
    // Solo se pueden seleccionar objetos en modo OBJETO
    if (currentTool !== "object") {
      return false;
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    selectedObject = null;

    const objectsInDrawOrder = getEditorObjectsInDrawOrder();

    for (let i = objectsInDrawOrder.length - 1; i >= 0; i--) {
      const obj = objectsInDrawOrder[i];
      const worldRenderSize = getEditorWorldRenderSize(obj);

      if (
        mouseX >= obj.x &&
        mouseX <= obj.x + worldRenderSize.width &&
        mouseY >= obj.y &&
        mouseY <= obj.y + worldRenderSize.height
      ) {
        selectedObject = obj;
        selectedHotspot = null;

        updateInspector();
        updateToolButtons();

        draggingObject = true;

        dragOffsetX = mouseX - obj.x;
        dragOffsetY = mouseY - obj.y;

        draw();

        return true;
      }
    }

    return false;
  }

  function trySelectForegroundGraphic(e) {
    if (currentTool !== "foreground-edit") {
      return false;
    }

    const point = getCanvasPoint(e);
    selectedForegroundGraphic = null;

    for (let i = editorForegroundGraphics.length - 1; i >= 0; i -= 1) {
      const graphic = editorForegroundGraphics[i];
      const size = getForegroundGraphicSize(graphic);

      if (
        point.x >= graphic.x &&
        point.x <= graphic.x + size.width &&
        point.y >= graphic.y &&
        point.y <= graphic.y + size.height
      ) {
        selectedForegroundGraphic = graphic;
        selectedObject = null;
        selectedHotspot = null;
        draggingForegroundGraphic = true;
        foregroundDragOffsetX = point.x - graphic.x;
        foregroundDragOffsetY = point.y - graphic.y;

        updateInspector();
        draw();
        return true;
      }
    }

    updateInspector();
    draw();
    return false;
  }

  function tryDeleteForegroundGraphic(e) {
    if (currentTool !== "foreground-delete") {
      return false;
    }

    const point = getCanvasPoint(e);

    for (let i = editorForegroundGraphics.length - 1; i >= 0; i -= 1) {
      const graphic = editorForegroundGraphics[i];
      const size = getForegroundGraphicSize(graphic);

      if (
        point.x >= graphic.x &&
        point.x <= graphic.x + size.width &&
        point.y >= graphic.y &&
        point.y <= graphic.y + size.height
      ) {
        editorForegroundGraphics.splice(i, 1);
        selectedForegroundGraphic = null;
        updateInspector();
        draw();
        return true;
      }
    }

    return false;
  }

  function trySelectNpc(e) {
    if (currentTool !== "npc-edit") return false;

    const point = getCanvasPoint(e);
    selectedNpc = null;

    for (let i = editorNpcs.length - 1; i >= 0; i -= 1) {
      const npc = editorNpcs[i];
      const size = getEditorNpcSize(npc);

      if (
        point.x >= npc.x &&
        point.x <= npc.x + size.width &&
        point.y >= npc.y &&
        point.y <= npc.y + size.height
      ) {
        selectedNpc = npc;
        selectedObject = null;
        selectedHotspot = null;
        selectedForegroundGraphic = null;
        draggingNpc = true;
        npcDragOffsetX = point.x - npc.x;
        npcDragOffsetY = point.y - npc.y;

        updateInspector();
        draw();
        return true;
      }
    }

    updateInspector();
    draw();
    return false;
  }

  function tryDeleteNpc(e) {
    if (currentTool !== "npc-delete") return false;

    const point = getCanvasPoint(e);

    for (let i = editorNpcs.length - 1; i >= 0; i -= 1) {
      const npc = editorNpcs[i];
      const size = getEditorNpcSize(npc);

      if (
        point.x >= npc.x &&
        point.x <= npc.x + size.width &&
        point.y >= npc.y &&
        point.y <= npc.y + size.height
      ) {
        editorNpcs.splice(i, 1);
        selectedNpc = null;
        updateInspector();
        draw();
        return true;
      }
    }

    return false;
  }

  // -------------------------------------------------------
  // ELIMINAR OBJETO
  // -------------------------------------------------------
  function tryDeleteObject(e) {
    if (currentTool !== "object-delete") {
      return false;
    }

    const point = getCanvasPoint(e);

    for (let i = editorObjects.length - 1; i >= 0; i--) {
      const obj = editorObjects[i];

      if (
        point.x >= obj.x &&
        point.x <= obj.x + obj.hitboxWidth &&
        point.y >= obj.y &&
        point.y <= obj.y + obj.hitboxHeight
      ) {
        editorObjects.splice(i, 1);

        selectedObject = null;

        updateInspector();
        draw();

        return true;
      }
    }

    return false;
  }

  // -------------------------------------------------------
  // SELECCIONAR HOTSPOT
  // -------------------------------------------------------

  function trySelectHotspot(e) {
    if (currentTool !== "hotspot-edit") return false;

    const point = getCanvasPoint(e);

    selectedHotspot = null;

    for (let i = editorHotspots.length - 1; i >= 0; i--) {
      const hotspot = editorHotspots[i];

      if (
        point.x >= hotspot.x &&
        point.x <= hotspot.x + hotspot.width &&
        point.y >= hotspot.y &&
        point.y <= hotspot.y + hotspot.height
      ) {
        selectedHotspot = hotspot;
        selectedObject = null;

        draggingHotspot = true;

        hotspotOffsetX = point.x - hotspot.x;
        hotspotOffsetY = point.y - hotspot.y;

        updateInspector();

        draw();

        return true;
      }
    }

    return false;
  }

  // -------------------------------------------------------
  // ELIMINAR HOTSPOT
  // -------------------------------------------------------
  function tryDeleteHotspot(e) {
    if (currentTool !== "hotspot-delete") return false;

    const point = getCanvasPoint(e);

    for (let i = editorHotspots.length - 1; i >= 0; i--) {
      const hotspot = editorHotspots[i];

      if (
        point.x >= hotspot.x &&
        point.x <= hotspot.x + hotspot.width &&
        point.y >= hotspot.y &&
        point.y <= hotspot.y + hotspot.height
      ) {
        editorHotspots.splice(i, 1);

        selectedHotspot = null;

        updateInspector();

        draw();

        return true;
      }
    }

    return false;
  }

  // -------------------------------------------------------
  // MOVER OBJETO
  // -------------------------------------------------------
  function dragSelectedObject(e) {
    if (currentTool !== "object") {
      return;
    }

    if (!selectedObject) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    selectedObject.x = Math.round(mouseX - dragOffsetX);
    selectedObject.y = Math.round(mouseY - dragOffsetY);

    draw();
  }

  function dragSelectedForegroundGraphic(e) {
    if (currentTool !== "foreground-edit" || !selectedForegroundGraphic) {
      return;
    }

    const point = getCanvasPoint(e);
    selectedForegroundGraphic.x = Math.round(
      point.x - foregroundDragOffsetX,
    );
    selectedForegroundGraphic.y = Math.round(
      point.y - foregroundDragOffsetY,
    );

    draw();
  }

  function dragSelectedNpc(e) {
    if (currentTool !== "npc-edit" || !selectedNpc) return;

    const point = getCanvasPoint(e);
    selectedNpc.x = Math.round(point.x - npcDragOffsetX);
    selectedNpc.y = Math.round(point.y - npcDragOffsetY);

    draw();
  }

  // -------------------------------------------------------
  // ACTUALIZAR INSPECTOR
  // -------------------------------------------------------
  function updateInspector() {
    const inspector = document.getElementById("editor-inspector");

    if (!inspector) return;

    if (selectedNpc) {
      const libraryItem = getNpcLibraryItem(selectedNpc.typeId);
      const collision = cloneEditorNpcCollision(
        selectedNpc.collision ?? libraryItem?.defaultCollision,
      );

      inspector.innerHTML = `
        <strong>ID NPC</strong>
        <p>${selectedNpc.id}</p>

        <hr>

        <strong>TIPO</strong>
        <p>${libraryItem?.name ?? selectedNpc.typeId}</p>

        <hr>

        <strong>COLISIÓN RELATIVA</strong>

        <label for="npc-collision-offset-x">Desplazamiento X</label>
        <input id="npc-collision-offset-x" class="editor-input" type="number"
          value="${collision.offsetX}">

        <label for="npc-collision-offset-y">Desplazamiento Y</label>
        <input id="npc-collision-offset-y" class="editor-input" type="number"
          value="${collision.offsetY}">

        <label for="npc-collision-width">Anchura</label>
        <input id="npc-collision-width" class="editor-input" type="number"
          min="1" value="${collision.width}">

        <label for="npc-collision-height">Altura</label>
        <input id="npc-collision-height" class="editor-input" type="number"
          min="1" value="${collision.height}">
      `;

      selectedNpc.collision = collision;
      bindNpcInspectorEvents();
      return;
    }

    if (selectedForegroundGraphic) {
      const options = window.ForegroundGraphicLibrary.map(
        (item) => `
          <option
            value="${item.id}"
            ${item.id === selectedForegroundGraphic.typeId ? "selected" : ""}
          >
            ${item.id} - ${item.name}
          </option>
        `,
      ).join("");

      inspector.innerHTML = `
        <strong>ID GRÁFICO TRASPASABLE</strong>
        <p>${selectedForegroundGraphic.id}</p>

        <hr>

        <strong>TIPO DE GRÁFICO</strong>
        <select id="foreground-graphic-type" class="editor-input">
          ${options}
        </select>

        <button id="delete-foreground-graphic-btn">
          Eliminar gráfico traspasable
        </button>
      `;

      bindForegroundGraphicInspectorEvents();
      return;
    }

    // -------------------------------------------------------
    // HOTSPOT SELECCIONADO
    // -------------------------------------------------------

    if (selectedHotspot) {
      const options = window.HotspotLibrary.map((item) => {
        const selected = item.id === selectedHotspot.typeId ? "selected" : "";

        return `
            <option value="${item.id}" ${selected}>
                ${item.name}
            </option>
        `;
      }).join("");

      inspector.innerHTML = `

        <strong>ID HOTSPOT MAP</strong>

        <p>${selectedHotspot.id}</p>

        <hr>

        <strong>SELECCIONAR HOTSPOT</strong>

        <select
            id="hotspot-type"
            class="editor-select">

            ${options}

        </select>

    `;

      bindHotspotInspectorEvents();

      return;
    }

    // --------------------------------------------
    // NO HAY OBJETO SELECCIONADO
    // --------------------------------------------
    if (!selectedObject) {
      inspector.innerHTML = `
            <p class="editor-placeholder">
                No hay ningún objeto seleccionado.
            </p>
        `;

      return;
    }

    // --------------------------------------------
    // MOSTRAR DATOS DEL OBJETO
    // --------------------------------------------
    const interactionButton =
      selectedObject.type === "door"
        ? `
          <hr>

          <button
            id="btn-set-interaction"
            class="editor-button"
          >
            Definir zona portal
          </button>
          `
        : "";

    const statefulFields =
      selectedObject.type === "stateful"
        ? `
          <hr>

          <strong>ESTADO INICIAL</strong>
          <p>${selectedObject.state ?? "Sin estado"}</p>

          <strong>ID DEL OBJETO CONTENIDO</strong>
          <input
            id="inspector-contained-object-id"
            class="editor-input"
            type="text"
            value="${selectedObject.containedObjectId ?? ""}"
            placeholder="Ej.: object_2"
          >
          `
        : "";

    inspector.innerHTML = `

    <strong>ID ITEM MAP</strong>
      <p>${selectedObject.id}</p>

    <hr>

    <strong>ITEM + SPRITE</strong>

    <select
      id="inspector-sprite"
      class="editor-input"
    >

${window.ObjectLibrary.map(
  (item) => `
<option
    value="${item.sprite}"
    ${selectedObject.sprite === item.sprite ? "selected" : ""}
>
    ${item.id} - ${item.name}
</option>
`,
).join("")}

</select>

${interactionButton}

${statefulFields}

<hr>

<label>
  <input
    id="inspector-always-on-top"
    type="checkbox"
    ${isEditorObjectAlwaysOnTop(selectedObject) ? "checked" : ""}
  >
  Siempre por encima
</label>

<hr>

<strong>ID DEL NPC BLOQUEADOR</strong>
<input
  id="inspector-blocked-by-npc-id"
  class="editor-input"
  type="text"
  value="${selectedObject.blockedByNpcId ?? ""}"
  placeholder="Ej.: NPC_1_instance_1"
>

`;

    bindInspectorEvents();
  }

  function bindInspectorEvents() {
    const spriteSelect = document.getElementById("inspector-sprite");
    const interactionBtn = document.getElementById("btn-set-interaction");
    const containedObjectIdInput = document.getElementById(
      "inspector-contained-object-id",
    );
    const alwaysOnTopInput = document.getElementById(
      "inspector-always-on-top",
    );
    const blockedByNpcIdInput = document.getElementById(
      "inspector-blocked-by-npc-id",
    );
    if (!selectedObject) return;

    // ---------------------------------------------------
    // CAMBIAR SPRITE
    // ---------------------------------------------------
    if (spriteSelect) {
      spriteSelect.addEventListener("change", () => {
        selectedObject.sprite = spriteSelect.value;

        const libraryItem = window.ObjectLibrary.find(
          (item) => item.sprite === selectedObject.sprite,
        );

        selectedObject.typeId = libraryItem.id;
        selectedObject.state = libraryItem.defaultState ?? null;
        selectedObject.stateSprites = libraryItem.stateSprites
          ? { ...libraryItem.stateSprites }
          : null;
        selectedObject.containedObjectId =
          libraryItem.type === "stateful" ? "" : null;
        selectedObject.blockedByNpcId = null;
        selectedObject.alwaysOnTop = libraryItem.alwaysOnTop ?? false;
        selectedObject.worldRenderWidth = libraryItem.worldRenderWidth ?? null;
        selectedObject.worldRenderHeight =
          libraryItem.worldRenderHeight ?? null;
        selectedObject.doorPair = libraryItem.doorPair ?? null;
        selectedObject.closedSprite = libraryItem.closedSprite ?? null;
        selectedObject.requiredItem = libraryItem.requiredItem ?? null;
        selectedObject.locked = libraryItem.locked ?? false;
        selectedObject.opened = libraryItem.opened ?? false;

        if (!libraryItem) return;

        // hereda atributos de los objetos del catálogo
        selectedObject.name = libraryItem.name;
        selectedObject.type = libraryItem.type ?? "item";
        selectedObject.description = libraryItem.description ?? "";
        selectedObject.spriteWidth = libraryItem.defaultSpriteWidth;
        selectedObject.spriteHeight = libraryItem.defaultSpriteHeight;
        selectedObject.hitboxWidth = libraryItem.defaultHitboxWidth;
        selectedObject.hitboxHeight = libraryItem.defaultHitboxHeight;
        selectedObject.pickup = libraryItem.pickup ?? false;
        selectedObject.locked = libraryItem.locked ?? false;
        selectedObject.opened = libraryItem.opened ?? false;
        selectedObject.requiredItem = libraryItem.requiredItem ?? null;
        selectedObject.openSprite = libraryItem.openSprite ?? null;
        selectedObject.closedSprite = libraryItem.closedSprite ?? null;
        selectedObject.doorPair = libraryItem.doorPair ?? null;
        selectedObject.typeId = libraryItem.id;
        selectedObject.teleportTo = libraryItem.teleportTo ?? null;
        selectedObject.teleportX = libraryItem.teleportX ?? 0;
        selectedObject.teleportY = libraryItem.teleportY ?? 0;
        selectedObject.teleportDirection =
          libraryItem.teleportDirection ?? "down";
        selectedObject.interactionMode = libraryItem.interactionMode ?? "front";
        selectedObject.teleportMode = libraryItem.teleportMode ?? "front";
        selectedObject.interactionTileX = libraryItem.interactionTileX ?? null;
        selectedObject.interactionTileY = libraryItem.interactionTileY ?? null;

        loadEditorObjectSprite(selectedObject.sprite);
        Object.values(selectedObject.stateSprites ?? {}).forEach((sprite) => {
          loadEditorObjectSprite(sprite);
        });

        updateInspector();
        updateToolButtons();

        draw();
      });
    }

    if (containedObjectIdInput) {
      containedObjectIdInput.addEventListener("input", () => {
        selectedObject.containedObjectId =
          containedObjectIdInput.value.trim() || null;
      });
    }

    if (alwaysOnTopInput) {
      alwaysOnTopInput.addEventListener("change", () => {
        selectedObject.alwaysOnTop = alwaysOnTopInput.checked;
        draw();
      });
    }

    if (blockedByNpcIdInput) {
      blockedByNpcIdInput.addEventListener("input", () => {
        selectedObject.blockedByNpcId =
          blockedByNpcIdInput.value.trim() || null;
      });
    }

    // ---------------------------------------------------
    // DEFINIR PUNTO DE INTERACCIÓN
    // ---------------------------------------------------

    if (interactionBtn) {
      interactionBtn.addEventListener("click", () => {
        drawingPortal = true;

        interactionBtn.textContent = "Arrastra para crear portal";
      });
    }
  }

  // -------------------------------------------------------
  // EVENTOS DEL INSPECTOR DEL HOTSPOT
  // -------------------------------------------------------

  function bindHotspotInspectorEvents() {
    const select = document.getElementById("hotspot-type");

    if (!select) return;

    select.addEventListener("change", () => {
      selectedHotspot.typeId = select.value;

      draw();
    });
  }

  function bindForegroundGraphicInspectorEvents() {
    const typeSelect = document.getElementById("foreground-graphic-type");
    const deleteButton = document.getElementById(
      "delete-foreground-graphic-btn",
    );

    if (typeSelect) {
      typeSelect.addEventListener("change", () => {
        selectedForegroundGraphic.typeId = typeSelect.value;
        loadEditorForegroundGraphicSprite(
          getForegroundLibraryItem(selectedForegroundGraphic.typeId),
        );
        draw();
      });
    }

    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        editorForegroundGraphics = editorForegroundGraphics.filter(
          (graphic) => graphic !== selectedForegroundGraphic,
        );
        selectedForegroundGraphic = null;
        updateInspector();
        draw();
      });
    }
  }

  function bindNpcInspectorEvents() {
    const fields = [
      ["npc-collision-offset-x", "offsetX", false],
      ["npc-collision-offset-y", "offsetY", false],
      ["npc-collision-width", "width", true],
      ["npc-collision-height", "height", true],
    ];

    fields.forEach(([id, property, positive]) => {
      const input = document.getElementById(id);
      if (!input) return;

      input.addEventListener("input", () => {
        if (!selectedNpc) return;

        const value = Number(input.value);
        if (!Number.isFinite(value)) return;

        selectedNpc.collision[property] = positive ? Math.max(1, value) : value;
        draw();
      });
    });
  }

  // -------------------------------------------------------
  // DIBUJAR REJILLA
  // -------------------------------------------------------
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(13, 255, 0, 0.95)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= cols * TILE_W; x += TILE_W) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, rows * TILE_H);
      ctx.stroke();
    }

    for (let y = 0; y <= rows * TILE_H; y += TILE_H) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(cols * TILE_W, y + 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawColumnNumbers() {
    ctx.save();
    ctx.fillStyle = "#ff2a2a";
    ctx.font = "16px Courier New";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let col = 0; col < cols; col += 1) {
      const x = col * TILE_W + TILE_W / 2;
      ctx.fillText(String(col + 1), x, 4);
    }

    ctx.restore();
  }

  // -------------------------------------------------------
  // GUARDAR MAPA en json con todos sus objetos
  // -------------------------------------------------------
  function saveMap() {
    // -------------------------------------------------------
    // SINCRONIZAR TODOS LOS OBJETOS CON EL CATÁLOGO
    // -------------------------------------------------------
    editorObjects.forEach((obj) => {
      const libraryItem = window.ObjectLibrary.find(
        (item) => item.id === obj.typeId,
      );

      if (!libraryItem) {
        return;
      }

      obj.name = libraryItem.name;
      obj.description = libraryItem.description ?? "";
      obj.spriteWidth = libraryItem.defaultSpriteWidth;
      obj.spriteHeight = libraryItem.defaultSpriteHeight;
      obj.hitboxWidth = libraryItem.defaultHitboxWidth;
      obj.hitboxHeight = libraryItem.defaultHitboxHeight;
      obj.pickup = libraryItem.pickup ?? false;
      obj.locked = libraryItem.locked ?? false;
      obj.opened = libraryItem.opened ?? false;
      obj.requiredItem = libraryItem.requiredItem ?? null;
      obj.openSprite = libraryItem.openSprite ?? null;
      obj.closedSprite = libraryItem.closedSprite ?? null;
      obj.doorPair = libraryItem.doorPair ?? null;
      obj.typeId = libraryItem.id;
      obj.type = libraryItem.type ?? "item";
      obj.state ??= libraryItem.defaultState ?? null;
      obj.stateSprites = libraryItem.stateSprites
        ? { ...libraryItem.stateSprites }
        : null;
      obj.containedObjectId =
        libraryItem.type === "stateful"
          ? obj.containedObjectId ?? null
          : null;
      obj.blockedByNpcId = obj.blockedByNpcId?.trim() || null;
      obj.alwaysOnTop ??= libraryItem.alwaysOnTop ?? false;
      obj.worldRenderWidth ??= libraryItem.worldRenderWidth ?? null;
      obj.worldRenderHeight ??= libraryItem.worldRenderHeight ?? null;
      obj.sprite =
        obj.stateSprites?.[obj.state] ?? libraryItem.sprite;
      obj.name = libraryItem.name;
      obj.requiredItem = libraryItem.requiredItem ?? null;
      obj.locked = libraryItem.locked ?? false;
      obj.opened = libraryItem.opened ?? false;
      obj.teleportTo = libraryItem.teleportTo ?? null;
      obj.teleportX = libraryItem.teleportX ?? 0;
      obj.teleportY = libraryItem.teleportY ?? 0;
      obj.teleportDirection = libraryItem.teleportDirection ?? "down";
      obj.interactionMode = libraryItem.interactionMode ?? "front";
      obj.teleportMode = libraryItem.teleportMode ?? "front";
    });

    const data = {
      image: currentMapImage,

      tileWidth: TILE_W,
      tileHeight: TILE_H,

      cols: cols,
      rows: rows,

      walkable: grid,

      objects: editorObjects,

      hotspots: editorHotspots,

      foregroundGraphics: editorForegroundGraphics.map((graphic) => ({
        id: graphic.id,
        typeId: graphic.typeId,
        x: graphic.x,
        y: graphic.y,
        ...(graphic.width == null ? {} : { width: graphic.width }),
        ...(graphic.height == null ? {} : { height: graphic.height }),
      })),

      npcs: editorNpcs.map((npc) => ({
        id: npc.id,
        typeId: npc.typeId,
        x: npc.x,
        y: npc.y,
        collision: cloneEditorNpcCollision(npc.collision),
        ...(npc.spriteWidth == null ? {} : { spriteWidth: npc.spriteWidth }),
        ...(npc.spriteHeight == null ? {} : { spriteHeight: npc.spriteHeight }),
      })),
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],

      {
        type: "application/json",
      },
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = currentMapImage.replace(".png", ".json");
    a.click();
  }

  // =======================================================
  // ABRIR POPUP
  // =======================================================

  function openEditorPopup(title = "Ventana") {
    const popup = document.getElementById("editor-popup");

    const popupTitle = document.getElementById("editor-popup-title");

    const popupContent = document.getElementById("editor-popup-content");

    popupTitle.textContent = title;

    popupContent.innerHTML = "";

    //----------------------------------------------------

    const list = document.createElement("div");

    list.className = "editor-map-list";

    window.MapLibrary.forEach((map) => {
      const card = document.createElement("div");

      card.className = "editor-map-card";

      card.innerHTML = `

    <img src="img/maps/${map.image}">

    <div class="editor-map-info">

        <h3>${map.name}</h3>

        <p>${map.image}</p>

    </div>

    `;
      const loadButton = document.createElement("button");

      loadButton.textContent = "Cargar";

      loadButton.addEventListener("click", () => {
        loadEditorMap(map);
      });

      card.appendChild(loadButton);
      list.appendChild(card);
    });

    popupContent.appendChild(list);

    //----------------------------------------------------

    popup.classList.remove("hidden");
  }

  function openForegroundGraphicPopup() {
    const popup = document.getElementById("editor-popup");
    const popupTitle = document.getElementById("editor-popup-title");
    const popupContent = document.getElementById("editor-popup-content");

    popupTitle.textContent = "Añadir traspasable";
    popupContent.innerHTML = "";

    const list = document.createElement("div");
    list.className = "foreground-graphic-list";

    window.ForegroundGraphicLibrary.forEach((item) => {
      const card = createVisualCatalogCard(
        item,
        "./img/traspasables/",
        () => {
        activateTool("foreground-create");
        pendingForegroundTypeId = item.id;
        closeEditorPopup();
        },
      );
      list.appendChild(card);
    });

    popupContent.appendChild(list);
    popup.classList.remove("hidden");
  }

  function openNpcPopup() {
    const popup = document.getElementById("editor-popup");
    const popupTitle = document.getElementById("editor-popup-title");
    const popupContent = document.getElementById("editor-popup-content");

    popupTitle.textContent = "Crear NPC";
    popupContent.innerHTML = "";

    const list = document.createElement("div");
    list.className = "foreground-graphic-list";

    window.NpcLibrary.forEach((item) => {
      const card = createVisualCatalogCard(item, "./img/npcs/", () => {
        activateTool("npc-create");
        pendingNpcTypeId = item.id;
        closeEditorPopup();
      });

      list.appendChild(card);
    });

    popupContent.appendChild(list);
    popup.classList.remove("hidden");
  }

  function createVisualCatalogCard(item, imageFolder, onSelect) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "foreground-graphic-card";

    const preview = document.createElement("span");
    preview.className = "foreground-graphic-preview";

    const thumbnail = document.createElement("img");
    thumbnail.className = "foreground-graphic-thumbnail";
    thumbnail.alt = item.name;

    const unavailable = document.createElement("span");
    unavailable.className = "foreground-graphic-unavailable is-hidden";
    unavailable.textContent = "Imagen no disponible";

    thumbnail.addEventListener("error", () => {
      thumbnail.classList.add("is-hidden");
      unavailable.classList.remove("is-hidden");
    });
    thumbnail.src = `${imageFolder}${item.sprite}`;

    preview.appendChild(thumbnail);
    preview.appendChild(unavailable);

    const info = document.createElement("span");
    info.className = "foreground-graphic-info";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const id = document.createElement("small");
    id.textContent = item.id;

    info.appendChild(name);
    info.appendChild(id);

    card.addEventListener("click", onSelect);
    card.appendChild(preview);
    card.appendChild(info);

    return card;
  }

  // =======================================================
  // CERRAR POPUP
  // =======================================================

  function closeEditorPopup() {
    document.getElementById("editor-popup").classList.add("hidden");
  }

  // =======================================================
  // CARGAR MAPA DEL EDITOR
  // =======================================================

  async function loadEditorMap(map) {
    currentMapImage = map.image;

    //--------------------------------------------------
    // Cargar imagen
    //--------------------------------------------------

    image = new Image();

    image.src = "img/maps/" + map.image;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    //--------------------------------------------------
    // Configurar canvas
    //--------------------------------------------------

    canvas.width = image.width;
    canvas.height = image.height;

    canvas.style.width = `${image.width * DISPLAY_SCALE}px`;
    canvas.style.height = `${image.height * DISPLAY_SCALE}px`;

    //--------------------------------------------------
    // Cargar JSON
    //--------------------------------------------------

    const response = await fetch("data/maps/" + map.json);

    const data = await response.json();

    //--------------------------------------------------
    // Sustituir datos
    //--------------------------------------------------

    cols = data.cols;
    rows = data.rows;
    grid = data.walkable;
    editorObjects = data.objects ?? [];
    editorForegroundGraphics = data.foregroundGraphics ?? [];
    editorNpcs = data.npcs ?? [];

    // --------------------------------------------------
    // COMPLETAR DATOS DESDE EL CATÁLOGO
    // --------------------------------------------------

    editorObjects.forEach((obj) => {
      const libraryItem = window.ObjectLibrary.find((item) => {
        // Mapas nuevos
        if (obj.typeId) {
          return item.id === obj.typeId;
        }

        // Compatibilidad con mapas antiguos
        return item.sprite === obj.sprite;
      });

      console.log(obj.sprite, libraryItem);

      if (!libraryItem) {
        return;
      }

      obj.typeId ??= libraryItem.id;
      obj.type ??= libraryItem.type ?? "item";
      obj.state ??= libraryItem.defaultState ?? null;
      obj.stateSprites ??= libraryItem.stateSprites
        ? { ...libraryItem.stateSprites }
        : null;
      obj.containedObjectId ??= null;
      obj.blockedByNpcId ??= null;
      obj.alwaysOnTop ??= libraryItem.alwaysOnTop ?? false;
      obj.worldRenderWidth ??= libraryItem.worldRenderWidth ?? null;
      obj.worldRenderHeight ??= libraryItem.worldRenderHeight ?? null;
      obj.sprite = obj.stateSprites?.[obj.state] ?? obj.sprite;
      if (libraryItem.type === "stateful") {
        obj.spriteWidth = libraryItem.defaultSpriteWidth;
        obj.spriteHeight = libraryItem.defaultSpriteHeight;
      }
      obj.pickup ??= libraryItem.pickup ?? false;
      obj.locked ??= libraryItem.locked ?? false;
      obj.opened ??= libraryItem.opened ?? false;
      obj.requiredItem ??= libraryItem.requiredItem ?? null;
      obj.closedSprite ??= libraryItem.closedSprite ?? null;
      obj.openSprite ??= libraryItem.openSprite ?? null;
      obj.doorPair ??= libraryItem.doorPair ?? null;
      obj.interactionMode ??= libraryItem.interactionMode ?? "front";
      obj.teleportMode ??= libraryItem.teleportMode ?? "front";
      if (libraryItem.interactionTileX !== undefined) {
        obj.interactionTileX = libraryItem.interactionTileX;
      }

      if (libraryItem.interactionTileY !== undefined) {
        obj.interactionTileY = libraryItem.interactionTileY;
      }

      obj.portal ??= {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    });

    editorHotspots = data.hotspots ?? [];

    editorNpcs.forEach((npc) => {
      const libraryItem = getNpcLibraryItem(npc.typeId);
      npc.collision = cloneEditorNpcCollision(
        npc.collision ?? libraryItem?.defaultCollision,
      );
    });

    selectedObject = null;
    selectedHotspot = null;
    selectedForegroundGraphic = null;
    selectedNpc = null;
    pendingForegroundTypeId = null;
    pendingNpcTypeId = null;
    //--------------------------------------------------
    // Cargar sprites de los objetos
    //--------------------------------------------------

    editorObjects.forEach((obj) => {
      loadEditorObjectSprite(obj.sprite);
      Object.values(obj.stateSprites ?? {}).forEach((sprite) => {
        loadEditorObjectSprite(sprite);
      });
    });

    editorForegroundGraphics.forEach((graphic) => {
      loadEditorForegroundGraphicSprite(
        getForegroundLibraryItem(graphic.typeId),
      );
    });

    editorNpcs.forEach((npc) => {
      loadEditorNpcSprite(getNpcLibraryItem(npc.typeId));
    });

    updateInspector();
    draw();
    closeEditorPopup();
  }

  return { start };
})();
