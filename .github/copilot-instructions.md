# AI Coding Instructions for Idle Snake Game

## Project Overview
This is a vanilla JS HTML5 Canvas game - an idle/automatic snake game with AI pathfinding, strategic elements, and persistent progression. The snake moves automatically using A* pathfinding to collect fruits while players manage upgrades, walls, tiles, and other strategic elements.

## Architecture & Module Organization

### Core Game Loop (`js/game.js`)
- `IdleSnakeGame` class is the main controller managing all game systems
- Game loop runs at dynamic speed (configurable via upgrades)
- Uses `requestAnimationFrame` with delta timing for smooth performance
- All game state persists to `localStorage` automatically

### Modular System Design
Each major system is isolated in dedicated files:
- **Snake Logic**: `js/snake.js` - Snake class with movement, collision, growth mechanics
- **AI Pathfinding**: `js/pathfinding.js` - A* algorithm with stagnation detection and path caching
- **Wall System**: `js/walls.js` - Strategic walls (portals, repulsion, boost) with placement UI
- **Tile Effects**: `js/tile_effects.js` - Grid-based tile system for PC bonuses and speed multipliers  
- **Glyph System**: `js/glyphs.js` - DNA-based glyphs for combo multipliers and special effects
- **Upgrades**: `js/upgrades.js` - Two-currency system (money + pure DNA) with cost scaling
- **Utilities**: `js/utils.js` - All constants, math utils, and shared configuration

### Dynamic Grid System
- Grid starts small (5x5) and expands via "Expansion" upgrades up to 25x25
- All systems (`TileEffectMap`, `GlyphMap`, `BasketMap`, walls) auto-resize and re-center content when grid expands
- Coordinate system: `{x, y}` where (0,0) is top-left

## Key Patterns & Conventions

### State Management
```javascript
// All systems implement save/load patterns:
saveToStorage() {
    localStorage.setItem('gameKey', JSON.stringify(this.state));
}
loadFromStorage() {
    const saved = localStorage.getItem('gameKey');
    if (saved) this.state = JSON.parse(saved);
}
```

### Canvas Rendering Pipeline
1. Clear canvas with black background
2. Draw grass textures (if loaded) or fallback colors
3. Draw tile effects (blue PC tiles, orange speed tiles)  
4. Draw walls with type-specific colors
5. Draw glyphs with visual indicators
6. Draw fruits (regular red, golden, dark purple)
7. Draw snake with white head/body using sprite system
8. Update Mini-HUD with real-time bonuses

### Upgrade System Pattern
- Two currencies: money (from fruits) and pure DNA (from special events)
- Cost scaling: `baseCost * Math.pow(1.5, currentLevel)` 
- Special expansion cost: `baseCost * (gridSize / 5)` for balanced grid growth
- All upgrades use `UpgradeManager` with consistent purchase validation

### AI Pathfinding Behavior
- Uses A* with heuristic prioritization for golden fruits
- Implements path caching with "hold" mechanism to prevent jittery movement
- Stagnation detection forces greedy movement if stuck
- Collision avoidance considers walls, snake body, and grid boundaries

## Development Workflows

### Local Testing
```powershell
# Simple HTTP server for testing
python -m http.server 8080
# Then open http://localhost:8080
```

### Canvas Debugging
- Set `isDevelopmentMode()` to enable developer tools in `js/main.js`
- Use browser DevTools → Console for `Logger.log()` output
- Game state accessible via global `game` variable for runtime debugging

### Adding New Systems
1. Create isolated class file in `js/` directory
2. Implement `saveToStorage()` and `loadFromStorage()` methods
3. Add initialization in `IdleSnakeGame.initializeGame()`
4. Register in save/load pipeline in `game.js`
5. Add UI controls following existing button/modal patterns

## External Dependencies & Integration

### Assets
- Textures loaded from `assets/` directory (grass1.png, grass2.png)
- All graphics have fallback colors if textures fail to load
- No external CDN dependencies - completely self-contained

### Sprite System
- `js/snake-sprites.js` manages snake visual variations
- `js/spritesheet-manager.js` handles sprite atlas loading (if needed)
- All sprites fallback to simple colored rectangles

### Deployment
- Static files only - no build step required
- Works with GitHub Pages, any static hosting
- No server-side components or APIs

## Critical Implementation Details

### Position Validation
Always use `MathUtils.isValidPosition(pos, gridSize)` before placing objects. Grid coordinates are 0-indexed.

### Multi-Fruit Management  
Fruits stored in array `this.fruits[]` - use `ensureFruitPopulation()` to maintain target count based on "Cultivo" upgrade level.

### Edit Mode Pattern
Toggle-based UI for placing tiles/walls: `this.isEditMode` → `this.tilePlacementMode` → place on click. Always validate placement against existing objects.

### Performance Considerations
- Path recalculation is expensive - cache results in `PathfindingAI.currentPath`
- Minimize canvas redraws - only render when game state changes
- Use `Logger` for debugging instead of direct `console.log` to allow easy disable in production