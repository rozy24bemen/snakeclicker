# SnakeClicker (Idle Snake – Optimización Espacial)

Juego HTML5 Canvas sin dependencias: IA de serpiente, rejilla dinámica, múltiples frutas (con manzana dorada), muros estratégicos y sistema de baldosas (PC / Velocidad), con guardado local.

## Vista rápida
- Canvas + JS Vanilla (sin build).
- IA con pathfinding para recoger frutas (prioriza Manzana Dorada).
- Rejilla dinámica con expansión incremental.
- Frutas múltiples vía mejora "Cultivo".
- Manzana Dorada (~2% por aparición) con +50 PC al recoger.
- Muros: portal, repulsión, boost (inventario por mejoras).
- Baldosas: PC (+1 PC al recoger fruta sobre esa celda) y Velocidad (x1.2 mientras la cabeza está encima).
- Mini-HUD: muestra bono PC activo y multiplicador de velocidad actuales según la celda de la cabeza.
- Guardado en localStorage (stats, mejoras, muros, baldosas, inventario de baldosas).

## Controles
- Pausar/Reanudar.
- Modo Edición: activa el modo de edición del tablero.
  - Baldosas: botón "Baldosas" para activar el modo de colocación.
  - Selección de tipo: radio toggles "PC" y "SPD" (solo visibles en modo edición + colocación).
  - Click: coloca baldosas del tipo elegido (si hay inventario).
  - Shift+Click: remueve una baldosa y devuelve 1 al inventario.
  - Muros: colocar/quitar con la misma coherencia del modo edición.

## Mini-HUD (Feedback en vivo)
- PC Tile Bonus: +X actualmente aplicado (p. ej., +1 si estás sobre una baldosa PC).
- Velocidad: xY multiplicador de velocidad activo (p. ej., x1.2 al estar sobre baldosa SPEED).

## Mejoras clave
- Velocidad: incrementa la velocidad de movimiento base.
- Multiplicador de PC: aumenta PC por fruta.
- Cultivo: +1 fruta simultánea por nivel (puebla automáticamente el tablero hasta 1 + nivel).
- Expansión: +1 tamaño de rejilla por nivel (hasta 25).
- Baldosas PC (tile_pc): añade 1 baldosa PC al inventario por nivel.
- Baldosas Velocidad (tile_speed): añade 1 baldosa SPEED al inventario por nivel.
- Muros (portal/repulsión/boost): añaden piezas al inventario.

## Cómo ejecutar localmente
Opción 1 (Python):
```powershell
# En Windows PowerShell desde la carpeta del proyecto
ython -m http.server 8080
# Abrir http://localhost:8080
```

Opción 2 (VS Code Live Server / cualquier servidor estático):
- Usa Live Server o cualquier server estático apuntando al root del repo.

## Despliegue en GitHub Pages
1. Entra a Settings → Pages.
2. Source: Deploy from a branch.
3. Branch: `main`, carpeta `/` (root).
4. Guarda y espera a que se publique.

## Ajustes de balance (pistas para playtest)
- Manzana Dorada: 2% por fruta, +50 PC al recoger.
- Si el pacing se siente lento:
  - Aumenta el bonus de baldosas PC (+3 o +5 en lugar de +1).
  - Sube ligeramente la probabilidad/recompensa de Manzana Dorada.
  - Ajusta los costos de Cultivo.

## Estructura
```
index.html
styles.css
js/
  utils.js
  pathfinding.js
  tile_effects.js
  snake.js
  walls.js
  upgrades.js
  game.js
  main.js
```

## Problemas conocidos
- No hay favicon (404 inofensivo en local).
- Algunos ajustes de balance están pendientes del playtest.

## Licencia
MIT
