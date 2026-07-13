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
  // HOTSPOTS DEL EDITOR
  // -------------------------------------------------------
  let editorHotspots = [];

  let drawingHotspot = false;
  let hotspotStart = null;
  let hotspotPreview = null;
  let selectedHotspot = null;

  // -------------------------------------------------------
  // SELECCIÓN DE OBJETOS
  // -------------------------------------------------------
  let selectedObject = null;
  let draggingObject = false;

  let draggingHotspot = false;
  let settingInteractionPoint = false;

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
    });
    bindEvents();
    updateInspector();
  }

  function bindEvents() {
    const uploadInput = document.getElementById("map-upload");
    const editMapBtn = document.getElementById("edit-map-btn");
    const saveBtn = document.getElementById("save-map-btn");

    const toggleGridBtn = document.getElementById("toggle-grid-btn");
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

    // ----------------------------------------------------
    // PINTAR COLISIONES
    // ----------------------------------------------------
    if (paintBtn && !paintBtn.dataset.bound) {
      paintBtn.addEventListener("click", () => {
        currentTool = "paint";

        selectedObject = null;

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
        // ---------------------------------------------------
        // DEFINIR PUNTO DE INTERACCIÓN
        // ---------------------------------------------------

        if (settingInteractionPoint && selectedObject) {
          const point = getCanvasPoint(e);

          const col = Math.floor(point.x / TILE_W);

          const row = Math.floor(point.y / TILE_H);

          selectedObject.interactionTileX = col;

          selectedObject.interactionTileY = row;

          settingInteractionPoint = false;

          updateInspector();

          draw();

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

    draggingObject = false;
    draggingHotspot = false;

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

      visible: true,

      pickup: libraryItem.pickup ?? false,
      collected: false,

      locked: libraryItem.locked ?? false,
      opened: libraryItem.opened ?? false,

      requiredItem: libraryItem.requiredItem ?? null,

      openSprite: libraryItem.openSprite ?? null,

      teleportTo: libraryItem.teleportTo ?? null,
      teleportX: libraryItem.teleportX ?? 0,
      teleportY: libraryItem.teleportY ?? 0,
      teleportDirection: libraryItem.teleportDirection ?? "down",
      interactionMode: libraryItem.interactionMode ?? "front",
      teleportMode: libraryItem.teleportMode ?? "front",

      interactionTileX: null,
      interactionTileY: null,
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

    // ------------------------------------------
    // HOTSPOTS YA CREADOS
    // ------------------------------------------

    drawEditorHotspots();

    // ------------------------------------------
    // HOTSPOT QUE SE ESTÁ DIBUJANDO
    // ------------------------------------------

    drawHotspotPreview();

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
  function drawEditorObjects() {
    editorObjects.forEach((obj) => {
      const sprite = objectSprites[obj.sprite];

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
        ctx.drawImage(sprite, obj.x, obj.y, obj.spriteWidth, obj.spriteHeight);
      }

      // --------------------------------------------
      // PUNTO DE INTERACCIÓN
      // --------------------------------------------

      if (
        Number.isInteger(obj.interactionTileX) &&
        Number.isInteger(obj.interactionTileY)
      ) {
        const x = obj.interactionTileX * TILE_W + TILE_W / 2;

        const y = obj.interactionTileY * TILE_H + TILE_H / 2;

        ctx.strokeStyle = "#ff0000";

        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6);
        ctx.lineTo(x + 6, y + 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 6, y - 6);
        ctx.lineTo(x - 6, y + 6);
        ctx.stroke();
      }

      // --------------------------------------------
      // HITBOX
      // --------------------------------------------
      ctx.strokeStyle = obj === selectedObject ? "#ffff00" : "#00ff00";

      ctx.lineWidth = 1;

      ctx.strokeRect(obj.x, obj.y, obj.hitboxWidth, obj.hitboxHeight);

      // --------------------------------------------
      // ID
      // --------------------------------------------
      ctx.fillStyle = "#00ff00";
      ctx.font = "10px Courier New";

      ctx.fillText(obj.id, obj.x, obj.y - 4);

      ctx.restore();
    });
  }

  // -------------------------------------------------------
  // DIBUJAR HOTSPOTS
  // -------------------------------------------------------
  function drawEditorHotspots() {
    ctx.save();

    editorHotspots.forEach((hotspot) => {
      // color
      if (hotspot === selectedHotspot) {
        ctx.fillStyle = "rgba(0,255,255,0.35)";
        ctx.strokeStyle = "#00ffff";
      } else {
        ctx.fillStyle = "rgba(255,255,0,0.25)";
        ctx.strokeStyle = "#ffff00";
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

    for (let i = editorObjects.length - 1; i >= 0; i--) {
      const obj = editorObjects[i];

      if (
        mouseX >= obj.x &&
        mouseX <= obj.x + obj.hitboxWidth &&
        mouseY >= obj.y &&
        mouseY <= obj.y + obj.hitboxHeight
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

  // -------------------------------------------------------
  // ACTUALIZAR INSPECTOR
  // -------------------------------------------------------
  function updateInspector() {
    const inspector = document.getElementById("editor-inspector");

    if (!inspector) return;

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
            Definir punto interacción
          </button>
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

`;

    bindInspectorEvents();
  }

  function bindInspectorEvents() {
    const spriteSelect = document.getElementById("inspector-sprite");
    const interactionBtn = document.getElementById("btn-set-interaction");
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
        selectedObject.teleportTo = libraryItem.teleportTo ?? null;
        selectedObject.teleportX = libraryItem.teleportX ?? 0;
        selectedObject.teleportY = libraryItem.teleportY ?? 0;
        selectedObject.teleportDirection = libraryItem.teleportDirection ?? "down";
        selectedObject.interactionMode = libraryItem.interactionMode ?? "front";
        selectedObject.teleportMode = libraryItem.teleportMode ?? "front";
        selectedObject.interactionTileX = libraryItem.interactionTileX ?? null;
        selectedObject.interactionTileY = libraryItem.interactionTileY ?? null;

        loadEditorObjectSprite(selectedObject.sprite);

        updateInspector();
        updateToolButtons();

        draw();
      });
    }

    // ---------------------------------------------------
    // DEFINIR PUNTO DE INTERACCIÓN
    // ---------------------------------------------------

    if (interactionBtn) {
      interactionBtn.addEventListener("click", () => {
        settingInteractionPoint = true;

        interactionBtn.textContent = "Haz click en el mapa...";
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
        (item) => item.sprite === obj.sprite,
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

    // --------------------------------------------------
    // COMPLETAR DATOS DESDE EL CATÁLOGO
    // --------------------------------------------------

    editorObjects.forEach((obj) => {
      const libraryItem = window.ObjectLibrary.find(
        (item) => item.sprite === obj.sprite,
      );

      if (!libraryItem) {
        return;
      }

      obj.type = libraryItem.type ?? "item";
      obj.type ??= libraryItem.type ?? "item";
      obj.pickup ??= libraryItem.pickup ?? false;
      obj.locked ??= libraryItem.locked ?? false;
      obj.opened ??= libraryItem.opened ?? false;
      obj.interactionMode ??= libraryItem.interactionMode ?? "front";
      obj.teleportMode ??= libraryItem.teleportMode ?? "front";
    });

    editorHotspots = data.hotspots ?? [];

    selectedObject = null;
    selectedHotspot = null;
    //--------------------------------------------------
    // Cargar sprites de los objetos
    //--------------------------------------------------

    editorObjects.forEach((obj) => {
      loadEditorObjectSprite(obj.sprite);
    });

    updateInspector();
    draw();
    closeEditorPopup();
  }

  return { start };
})();
