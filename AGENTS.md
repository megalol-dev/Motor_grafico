# Instrucciones del proyecto para Codex

## Alcance

Estas instrucciones se aplican a todo el repositorio. Lee también el `AGENTS.md` más cercano cuando trabajes dentro de una subcarpeta; sus reglas complementan o concretan estas.

## Objetivo del proyecto

Adventure Engine JS es un motor 2D y un prototipo de aventura gráfica point-and-click. Está construido desde cero con HTML, CSS, JavaScript clásico y Canvas, sin framework, empaquetador ni dependencias de ejecución.

El proyecto tiene dos productos conectados:

- El juego, que interpreta mapas y catálogos y ejecuta la aventura.
- El editor visual, que permite preparar colisiones, objetos, hotspots y portales y exportar cada escena a JSON.

Consulta `README.md` para la explicación extensa y las capturas. Usa el código actual como fuente de verdad cuando el README y la implementación no coincidan.

## Arquitectura resumida

- `index.html`: define portada, selección de personajes, juego y editor; también fija el orden de carga de scripts.
- `js/app.js`: controla las pantallas, la selección de tres personajes y el acceso al editor.
- `js/game.js`: orquesta recursos, estado, cambio de mapas, actualización y renderizado.
- `js/game/`: contiene gestores especializados del runtime.
- `js/editor.js`: contiene el editor visual.
- `js/catalogs/`: contiene las definiciones reutilizables de mapas, objetos, hotspots y verbos.
- `data/maps/`: contiene las instancias y la geometría de las escenas.
- `img/`: contiene fondos, sprites y capturas.
- `css/`: separa estilos generales, juego y editor.

Flujo de datos principal:

```text
catálogos + recursos gráficos
             ↓
          editor
             ↓
       data/maps/*.json
             ↓
      motor del juego
             ↓
       Canvas + interfaz
```

## Invariantes que debes preservar

- Mantén la arquitectura basada en datos: la lógica reutilizable pertenece al motor o a los catálogos, no debe duplicarse entre mapas.
- Los JSON de mapas son plantillas. Durante una partida, los cambios viven en `GameState`; el runtime no debe escribir sobre los JSON.
- `doorPair` es la identidad compartida de las dos caras de una puerta. Cambiar una puerta debe conservar la sincronización del par.
- Cada personaje conserva su propio mapa, posición, dirección e inventario. No conviertas accidentalmente estos datos en un único estado global del grupo.
- Las puertas cerradas bloquean navegación; las abiertas no se dibujan ni bloquean el paso.
- Conserva el aspecto pixel art y `imageSmoothingEnabled = false` en los Canvas.
- No introduzcas frameworks, bundlers, TypeScript, paquetes npm ni nuevas dependencias salvo petición explícita del usuario.
- No conviertas los scripts a módulos ES ni cambies el sistema de globales `window.*` de forma aislada. Una migración así exige actualizar coordinadamente el orden de carga y todos los consumidores.
- Mantén compatibles el editor, los catálogos y el runtime cuando cambies el esquema de objetos o mapas.
- Preserva los cambios no relacionados del usuario. El repositorio puede estar sucio; revisa el diff antes de editar y antes de entregar.

## Forma de trabajar

1. Lee el `AGENTS.md` aplicable y los archivos directamente relacionados con la tarea.
2. Traza productores y consumidores antes de cambiar un contrato de datos o una API global.
3. Haz cambios pequeños y coherentes con el estilo del archivo existente.
4. No aproveches una tarea concreta para reescribir sistemas completos sin autorización.
5. Si corriges un fallo del runtime, evita modificar los mapas para ocultarlo, salvo que el defecto esté realmente en los datos.
6. Si alteras arquitectura, flujo de ejecución, esquema de mapas o funciones visibles, actualiza `README.md` en la misma tarea.
7. Señala claramente las suposiciones cuando el comportamiento deseado no pueda deducirse del código o de los datos.

## Validación mínima

No existe todavía una suite automatizada ni un `package.json`. Ajusta la validación al cambio:

- JavaScript: ejecuta `node --check` sobre cada archivo modificado si Node está disponible.
- JSON: analiza todos los archivos modificados y comprueba que sus matrices tengan dimensiones coherentes.
- Documentación: ejecuta `git diff --check` y valida rutas de imágenes y archivos mencionados.
- Interfaz o gameplay: sirve el proyecto mediante HTTP y realiza una comprobación manual focalizada.

Comprobación manual recomendada para cambios amplios:

1. Abrir portada y selección de personajes.
2. Elegir tres personajes e iniciar la partida.
3. Caminar por `map1` y comprobar el A*.
4. Recoger la llave y verificar el inventario del personaje activo.
5. Usar la llave en la puerta principal y cambiar a `map2`.
6. Regresar y comprobar persistencia y sincronización.
7. Cambiar de personaje y verificar mapa, posición e inventario independientes.
8. Abrir el editor con `1`, cargar un mapa y comprobar que puede exportarse.

## Estado y límites conocidos

- `data/gameData.json` pertenece a una etapa anterior y no forma parte del flujo cargado por `index.html`. No lo uses como fuente de verdad ni lo amplíes salvo que una tarea pida recuperar ese formato.
- `Walk to` es una acción interna predeterminada y no forma parte de `VerbLibrary`.
- Varios verbos están visibles pero todavía no tienen comportamiento especializado.
- La persistencia de objetos y puertas dura solo durante la sesión actual; no existe guardado permanente de partidas.
- El editor descarga el JSON, pero la incorporación del archivo a `data/maps/` sigue siendo manual.
- El campo `portal` del editor y las casillas `interactionTileX/Y` son conceptos distintos; no presupongas que dibujar un portal modifica por sí solo el punto usado por A*.

## Comunicación

- Trabaja y explica los cambios en español salvo que el usuario solicite otro idioma.
- Al finalizar, resume qué cambió, qué se verificó y cualquier limitación restante.
- No afirmes que una función está completa si solo existe su interfaz o una implementación parcial.
