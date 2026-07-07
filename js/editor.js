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
    let currentTool = 'paint'; // paint | erase

    function start() {
        canvas = document.getElementById('editor-canvas');
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        bindEvents();
    }

    function bindEvents() {
        const uploadInput = document.getElementById('map-upload');
        const saveBtn = document.getElementById('save-map-btn');
        const paintBtn = document.getElementById('paint-collision-btn');
        const eraseBtn = document.getElementById('erase-mode-btn');

        if (uploadInput && !uploadInput.dataset.bound) {
            uploadInput.addEventListener('change', loadImage);
            uploadInput.dataset.bound = 'true';
        }

        if (saveBtn && !saveBtn.dataset.bound) {
            saveBtn.addEventListener('click', saveMap);
            saveBtn.dataset.bound = 'true';
        }

        if (paintBtn && !paintBtn.dataset.bound) {
            paintBtn.addEventListener('click', () => {
                currentTool = 'paint';
                updateToolButtons();
            });
            paintBtn.dataset.bound = 'true';
        }

        if (eraseBtn && !eraseBtn.dataset.bound) {
            eraseBtn.addEventListener('click', () => {
                currentTool = 'erase';
                updateToolButtons();
            });
            eraseBtn.dataset.bound = 'true';
        }

        if (canvas && !canvas.dataset.bound) {
            canvas.addEventListener('mousedown', (e) => {
                drawing = true;
                paintAtEvent(e);
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!drawing) return;
                paintAtEvent(e);
            });

            window.addEventListener('mouseup', () => {
                drawing = false;
            });

            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            canvas.dataset.bound = 'true';
        }

        updateToolButtons();
    }

    function updateToolButtons() {
        const paintBtn = document.getElementById('paint-collision-btn');
        const eraseBtn = document.getElementById('erase-mode-btn');

        if (!paintBtn || !eraseBtn) return;

        if (currentTool === 'paint') {
            paintBtn.style.outline = '3px solid #3b59ff';
            eraseBtn.style.outline = 'none';
        } else {
            eraseBtn.style.outline = '3px solid #3b59ff';
            paintBtn.style.outline = 'none';
        }
    }

    function loadImage(e) {
        const file = e.target.files[0];
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

        grid[row][col] = currentTool === 'paint' ? 1 : 0;

        draw();
    }

    function draw() {
        if (!image) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        drawCollisionOverlay();
        drawGrid();
        drawColumnNumbers();
    }

    function drawCollisionOverlay() {
        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                if (grid[row][col] === 1) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.45)';
                    ctx.fillRect(col * TILE_W, row * TILE_H, TILE_W, TILE_H);
                }
            }
        }
    }

    function drawGrid() {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 230, 0, 0.95)';
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
        ctx.fillStyle = '#ff2a2a';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let col = 0; col < cols; col += 1) {
            const x = col * TILE_W + TILE_W / 2;
            ctx.fillText(String(col + 1), x, 4);
        }

        ctx.restore();
    }

    function saveMap() {
        const data = {
            tileWidth: TILE_W,
            tileHeight: TILE_H,
            cols,
            rows,
            walkable: grid
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'map.json';
        a.click();
    }

    return { start };
})();