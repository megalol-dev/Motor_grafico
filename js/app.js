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

    { id: 1, name: 'PJ1' },
    { id: 2, name: 'PJ2' },
    { id: 3, name: 'PJ3' },
    { id: 4, name: 'PJ4' },
    { id: 5, name: 'PJ5' },
    { id: 6, name: 'PJ6' }
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
    // NOMBRES Y DESCRIPCIONES TEMPORALES
    // ---------------------------------------------------
    const descriptions = {

      1: {
        name: 'Alex',
        desc: 'Un chico valiente con gran curiosidad.'
      },

      2: {
        name: 'Luna',
        desc: 'Una chica inteligente amante de la ciencia.'
      },

      3: {
        name: 'Rex',
        desc: 'Un joven rebelde experto en tecnología.'
      },

      4: {
        name: 'Victor',
        desc: 'Un deportista fuerte y competitivo.'
      },

      5: {
        name: 'Neo',
        desc: 'Un chico callado con gran intuición.'
      },

      6: {
        name: 'Sara',
        desc: 'Una artista creativa con gran imaginación.'
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

      <div class="party-card-left">

        <img
          src="./img/personajes/SELE${character.id}.png"
          alt="${info.name}"
        >

        <div class="party-info-box">

          <div class="party-character-name">
            ${info.name}
          </div>

          <div class="party-character-description">
            ${info.desc}
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
    // CLICK EN TARJETA
    // ---------------------------------------------------
    card.addEventListener(
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
        .map((id) => `PJ${id}`)
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