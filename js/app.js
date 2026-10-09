// -------------------------------------------------------
// REFERENCIAS A PANTALLAS DEL JUEGO
// -------------------------------------------------------
const screens = {
  title: document.getElementById('title-screen'),
  party: document.getElementById('party-screen'),
  game: document.getElementById('game-screen'),
  editor: document.getElementById('editor-screen')
};

// -------------------------------------------------------
// ELEMENTOS DE LA INTERFAZ
// -------------------------------------------------------
const titleStartBtn =
  document.getElementById('title-start-btn');

const partyStartBtn =
  document.getElementById('party-start-btn');

const selectionText =
  document.getElementById('selection-text');

const partyGrid =
  document.getElementById('party-grid');

// -------------------------------------------------------
// ESTADO GLOBAL DE LA APP
// -------------------------------------------------------
const state = {

  // ---------------------------------------------------
  // PERSONAJES ELEGIDOS PARA LA PARTIDA
  // ---------------------------------------------------
  selectedParty: [],

  // ---------------------------------------------------
  // LISTA DE PERSONAJES DISPONIBLES
  // ---------------------------------------------------
  characters: [

    { id: 1, name: 'Ryan' },
    { id: 2, name: 'April' },
    { id: 3, name: 'Milton' },
    { id: 4, name: 'Hank' },
    { id: 5, name: 'Spike' },
    { id: 6, name: 'Robin' }
  ]
};

// -------------------------------------------------------
// INICIALIZAR APP
// -------------------------------------------------------
initApp();

// -------------------------------------------------------
// ARRANQUE GENERAL
// -------------------------------------------------------
function initApp() {

  buildPartyGrid();
  bindUiEvents();

  setScreen('title');

  // ---------------------------------------------------
  // INICIALIZAR GAME MODULE
  // ---------------------------------------------------
  if (window.GameModule) {
    window.GameModule.init();
  }
}

// -------------------------------------------------------
// EVENTOS GENERALES DE UI
// -------------------------------------------------------
function bindUiEvents() {

  // ---------------------------------------------------
  // BOTÓN START
  // ---------------------------------------------------
  titleStartBtn.addEventListener('click', () => {
    setScreen('party');
  });

  // ---------------------------------------------------
  // EMPEZAR PARTIDA
  // ---------------------------------------------------
  partyStartBtn.addEventListener('click', () => {

    if (state.selectedParty.length !== 3) {
      return;
    }

    // -------------------------------------------------
    // GUARDAR PARTY ELEGIDA
    // -------------------------------------------------
    localStorage.setItem(
      'selectedParty',
      JSON.stringify(state.selectedParty)
    );

    setScreen('game');
  });

  // ---------------------------------------------------
  // ATAJOS TECLADO
  // ---------------------------------------------------
  document.addEventListener('keydown', (event) => {

    const key = event.key.toLowerCase();

    // -------------------------------------------------
    // TITLE -> PARTY
    // -------------------------------------------------
    if (
      screens.title.classList.contains('active') &&
      (key === 'enter' || key === ' ')
    ) {

      event.preventDefault();
      setScreen('party');
    }

    // -------------------------------------------------
    // PARTY -> GAME
    // -------------------------------------------------
    if (
      screens.party.classList.contains('active') &&
      key === 'enter' &&
      state.selectedParty.length === 3
    ) {

      event.preventDefault();

      localStorage.setItem(
        'selectedParty',
        JSON.stringify(state.selectedParty)
      );

      setScreen('game');
    }
  });
}

// -------------------------------------------------------
// CAMBIAR ENTRE PANTALLAS
// -------------------------------------------------------
function setScreen(name) {

  Object.entries(screens).forEach(
    ([key, screen]) => {

      screen.classList.toggle(
        'active',
        key === name
      );
    }
  );

  // ---------------------------------------------------
  // ARRANCAR / PARAR GAME LOOP
  // ---------------------------------------------------
  if (name === 'game') {

    window.GameModule.setupSelectedParty();
    if (window.GameModule) {
      window.GameModule.start();
    }
  }

  else {

    if (window.GameModule) {
      window.GameModule.stop();
    }
  }
}

// -------------------------------------------------------
// CONSTRUIR GRID DE PERSONAJES
// -------------------------------------------------------
function buildPartyGrid() {

  partyGrid.innerHTML = '';

  state.characters.forEach((character) => {

    // ---------------------------------------------------
    // CREAR TARJETA
    // ---------------------------------------------------
    const card =
      document.createElement('div');

    card.className =
      'party-card';

    card.dataset.id =
      character.id;

    // ---------------------------------------------------
    // PERSONAJE SELECCIONADO
    // ---------------------------------------------------
    if (
      state.selectedParty.includes(character.id)
    ) {

      card.classList.add('selected');
    }

    // ---------------------------------------------------
    // NOMBRES Y DESCRIPCIONES DE LOS PERSONAJES
    // ---------------------------------------------------
    const descriptions = {

      1: {
        name: 'Ryan',
        title: 'El Líder',
        desc: 'Carismático, optimista y algo arrogante. No es experto en nada, pero sabe reconocer las habilidades de los demás y orientar al grupo. Su especialidad es dar pistas y detectar quién podría resolver un problema.',
        selectionDesc: 'Líder carismático que sabe aprovechar las habilidades del grupo.'
      },

      2: {
        name: 'April',
        title: 'La Artista',
        desc: 'Creativa, observadora, perfeccionista y bastante tiquismiquis. Apasionada del arte y la estética. Experta en colores, materiales, composición y detalles que otros personajes pasan por alto.',
        selectionDesc: 'Artista observadora, experta en colores, materiales y detalles.'
      },

      3: {
        name: 'Milton',
        title: 'El Empollón',
        desc: 'Inteligente, metódico, tímido y pedante. Experto en informática, electrónica y ciencia. Le encanta dar explicaciones técnicas, incluso cuando nadie se las pide.',
        selectionDesc: 'Genio de la informática, la electrónica y la ciencia.'
      },

      4: {
        name: 'Hank',
        title: 'El Forzudo',
        desc: 'Musculoso, competitivo, directo y leal. Prefiere las soluciones físicas a las complicaciones intelectuales. Parece un bruto, pero a veces sorprende con su sensibilidad y sentido común.',
        selectionDesc: 'Fuerte y leal, prefiere resolver los problemas con músculo.'
      },

      5: {
        name: 'Spike',
        title: 'El Punky',
        desc: 'Rebelde, sarcástico, impulsivo y algo borrachín. Conoce los trucos de la calle y detesta las normas. Especialista en soluciones poco convencionales, cerraduras y sistemas de seguridad.',
        selectionDesc: 'Rebelde callejero, experto en cerraduras y trucos poco convencionales.'
      },

      6: {
        name: 'Robin',
        title: 'La Vegana',
        desc: 'Hippie, pacifista, idealista y amante de los animales y la naturaleza. Empática, espiritual y algo excéntrica. Especialista en plantas, animales, ecología y remedios naturales.',
        selectionDesc: 'Pacifista y amante de la naturaleza, experta en plantas y animales.'
      }
    };

    // ---------------------------------------------------
    // DATOS PERSONAJE
    // ---------------------------------------------------
    const info =
      descriptions[character.id];

    // ---------------------------------------------------
    // HTML INTERNO
    // ---------------------------------------------------
    card.innerHTML = `

      <div class="party-card-main">

        <div class="party-sprite-box">
          <img
            src="./img/personajes/SELE${character.id}.png"
            alt="${info.name}"
          >
        </div>

        <div class="party-info-box">

          <div class="party-character-name">
            ${info.name}
          </div>

          <div class="party-character-role">
            ${info.title}
          </div>

          <div class="party-character-description">
            ${info.selectionDesc}
          </div>

        </div>

      </div>

      <button class="party-select-btn">

        ${state.selectedParty.includes(character.id)
        ? 'Elegido'
        : 'Elegir'
      }

      </button>
    `;

    // ---------------------------------------------------
    // CLICK EN BOTÓN DE SELECCIÓN
    // ---------------------------------------------------
    card.querySelector('.party-select-btn').addEventListener(
      'click',
      () => toggleCharacter(character.id)
    );

    partyGrid.appendChild(card);
  });

  updatePartyUi();
}

// -------------------------------------------------------
// SELECCIONAR / QUITAR PERSONAJES
// -------------------------------------------------------
function toggleCharacter(id) {

  const alreadySelected =
    state.selectedParty.includes(id);

  // ---------------------------------------------------
  // QUITAR PERSONAJE
  // ---------------------------------------------------
  if (alreadySelected) {

    state.selectedParty =
      state.selectedParty.filter(
        (charId) => charId !== id
      );
  }

  // ---------------------------------------------------
  // AÑADIR PERSONAJE
  // ---------------------------------------------------
  else {

    // máximo 3 personajes
    if (state.selectedParty.length >= 3) {
      return;
    }

    state.selectedParty.push(id);
  }

  updatePartyUi();
}

// -------------------------------------------------------
// ACTUALIZAR UI DEL PARTY
// -------------------------------------------------------
function updatePartyUi() {

  // ---------------------------------------------------
  // MARCAR TARJETAS
  // ---------------------------------------------------
  [...partyGrid.children].forEach((card) => {

    const id =
      Number(card.dataset.id);

    card.classList.toggle(
      'selected',
      state.selectedParty.includes(id)
    );
  });

  // ---------------------------------------------------
  // TEXTO PARTY
  // ---------------------------------------------------
  if (state.selectedParty.length === 0) {

    selectionText.textContent =
      'Selecciona 3 personajes';
  }

  else {

    selectionText.textContent =
      state.selectedParty
        .map((id) =>
          state.characters.find(
            (character) => character.id === id
          ).name
        )
        .join(', ');
  }

  // ---------------------------------------------------
  // ACTIVAR BOTÓN START
  // ---------------------------------------------------
  partyStartBtn.disabled =
    state.selectedParty.length !== 3;
}

// -------------------------------------------------------
// ENTRAR AL EDITOR GRÁFICO
// -------------------------------------------------------
document.addEventListener('keydown', (e) => {

  if (
    !window.CONFIG ||
    !window.CONFIG.DEV_MODE
  ) return;

  // SOLO EN TITLE SCREEN
  if (
    !screens.title.classList.contains('active')
  ) return;

  // ---------------------------------------------------
  // TECLA 1 -> EDITOR
  // ---------------------------------------------------
  if (e.key === '1') {

    setScreen('editor');

    if (window.EditorModule) {
      window.EditorModule.start();
    }
  }
});
