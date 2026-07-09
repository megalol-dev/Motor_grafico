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
  // npc
  // teleport

  // -------------------------------------------------------
  // OBJETOS DEL EDITOR
  // -------------------------------------------------------
  let editorObjects = [];
  let objectSprites = {};

  // -------------------------------------------------------
  // SELECCIÓN DE OBJETOS
  // -------------------------------------------------------
  let selectedObject = null;
  let draggingObject = false;

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
        currentTool = "object";

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
        if (!selectedObject) {
          return;
        }

        const confirmar = confirm(`¿Eliminar "${selectedObject.name}"?`);

        if (!confirmar) {
          return;
        }

        editorObjects = editorObjects.filter((obj) => obj !== selectedObject);

        selectedObject = null;

        updateInspector();
        updateToolButtons();
        draw();
      });

      deleteObjectBtn.dataset.bound = "true";
    }

    // ----------------------------------------------------
    // EVENTOS DEL CANVAS
    // ----------------------------------------------------
    if (canvas && !canvas.dataset.bound) {
      canvas.addEventListener("mousedown", (e) => {
        if (trySelectObject(e)) {
          return;
        }

        drawing = true;
        paintAtEvent(e);
      });

      canvas.addEventListener("mousemove", (e) => {
        if (draggingObject) {
          dragSelectedObject(e);
          return;
        }

        if (!drawing) return;

        paintAtEvent(e);
      });

      window.addEventListener("mouseup", () => {
        drawing = false;
        draggingObject = false;
      });

      canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      canvas.dataset.bound = "true";
    }

    updateToolButtons();
  }

  function updateToolButtons() {
    const paintBtn = document.getElementById("paint-collision-btn");
    const eraseBtn = document.getElementById("erase-mode-btn");
    const editObjectBtn = document.getElementById("edit-object-btn");
    const addObjectBtn = document.getElementById("add-object-btn");
    const deleteObjectBtn = document.getElementById("delete-object-btn");

    // --------------------------------------
    // HABILITAR / DESHABILITAR ELIMINAR
    // --------------------------------------
    deleteObjectBtn.disabled = selectedObject === null;

    paintBtn.style.outline = "none";
    eraseBtn.style.outline = "none";

    editObjectBtn.style.outline = "none";
    addObjectBtn.style.outline = "none";
    deleteObjectBtn.style.outline = "none";

    if (currentTool === "paint") {
      paintBtn.style.outline = "3px solid #ffe600";
    }

    if (currentTool === "erase") {
      eraseBtn.style.outline = "3px solid #ffe600";
    }

    if (currentTool === "object") {
      editObjectBtn.style.outline = "3px solid #ffe600";
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
      alert("Primero carga un mapa.");
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

      sprite: libraryItem.sprite,

      visible: true,

      // -------------------------
      // COMPORTAMIENTO
      // -------------------------

      pickup: libraryItem.pickup ?? false,
      locked: libraryItem.locked ?? false,

      collected: false,
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
    inspector.innerHTML = `

    <strong>ID</strong>
    <p>${selectedObject.id}</p>

    <hr>

    <strong>Nombre</strong>

    <input
        id="inspector-name"
        class="editor-input"
        type="text"
        value="${selectedObject.name}"
    >

    <strong>Descripción</strong>

    <textarea
        id="inspector-description"
        class="editor-textarea"
    >${selectedObject.description}</textarea>

    <hr>

    <strong>SPRITE</strong>

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

    <p>
        ${selectedObject.spriteWidth}
        x
        ${selectedObject.spriteHeight}
    </p>

    <hr>

    <strong>HITBOX</strong>

    <p>
        ${selectedObject.hitboxWidth}
        x
        ${selectedObject.hitboxHeight}
    </p>

    `;

    bindInspectorEvents();
  }

  function bindInspectorEvents() {
    const nameInput = document.getElementById("inspector-name");

    const descriptionInput = document.getElementById("inspector-description");

    const spriteSelect = document.getElementById("inspector-sprite");

    if (!selectedObject) return;

    // ---------------------------------------------------
    // NOMBRE
    // ---------------------------------------------------
    if (nameInput) {
      nameInput.addEventListener("input", () => {
        selectedObject.name = nameInput.value;
      });
    }

    // ---------------------------------------------------
    // DESCRIPCIÓN
    // ---------------------------------------------------
    if (descriptionInput) {
      descriptionInput.addEventListener("input", () => {
        selectedObject.description = descriptionInput.value;
      });
    }

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

        selectedObject.spriteWidth = libraryItem.defaultSpriteWidth;

        selectedObject.spriteHeight = libraryItem.defaultSpriteHeight;

        selectedObject.hitboxWidth = libraryItem.defaultHitboxWidth;

        selectedObject.hitboxHeight = libraryItem.defaultHitboxHeight;

        loadEditorObjectSprite(selectedObject.sprite);

        updateInspector();
        updateToolButtons();

        draw();
      });
    }
  }

  // -------------------------------------------------------
  // DIBUJAR REJILLA
  // -------------------------------------------------------
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 230, 0, 0.95)";
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
    const data = {
      image: currentMapImage,

      tileWidth: TILE_W,
      tileHeight: TILE_H,

      cols: cols,
      rows: rows,

      walkable: grid,

      objects: editorObjects,
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

    editorObjects = data.objects;

    selectedObject = null;

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
