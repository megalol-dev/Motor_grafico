# Prototipo base - aventura gráfica retro

## Qué incluye
- Pantalla de título con ENTER para comenzar.
- Pantalla de selección de 7 personajes.
- El personaje 1 queda fijado como protagonista.
- Debes elegir 2 personajes más para activar `Start Game`.
- Pantalla de prueba con:
  - escenario base
  - personaje movible
  - barra de acción
  - verbos estilo Maniac Mansion
  - 20 huecos de inventario

## Controles
- `ENTER`: avanzar en título y selección.
- `Flechas` o `WASD`: mover personaje en la sala de prueba.

## Estructura
- `img/characters/` sprites de personajes
- `img/objects/` futuros objetos
- `img/maps/` mapas y fondos
- `data/gameData.json` verbos, personajes y datos del mapa
- `js/app.js` lógica del prototipo
- `css/styles.css` interfaz visual

## Importante
Como el proyecto carga JSON con `fetch`, conviene abrirlo con un servidor local.
Ejemplo rápido:

```bash
python -m http.server 8000
```

Y luego abrir en el navegador:

```text
http://localhost:8000
```
