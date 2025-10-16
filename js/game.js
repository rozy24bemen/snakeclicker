// game.js - Clase principal del juego que maneja toda la lógica

class IdleSnakeGame {
    constructor() {
        // Elementos del DOM
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.pauseBtn = document.getElementById('pause-btn');
    this.editModeBtn = document.getElementById('edit-mode-btn');
    this.tilePlaceBtn = document.getElementById('tile-place-btn');
    this.basketPlaceBtn = document.getElementById('basket-place-btn');
    this.glyphPlaceBtn = document.getElementById('glyph-place-btn');
    this.tileTypeControls = document.getElementById('tile-type-controls');
    this.tileTypePcRadio = document.getElementById('tile-type-pc');
    this.tileTypeSpdRadio = document.getElementById('tile-type-spd');
    this.tileInvText = document.getElementById('tile-inv-text');
    this.glyphTypeControls = document.getElementById('glyph-type-controls');
    this.glyphTypeComboRadio = document.getElementById('glyph-type-combo');
    this.glyphTypeConsumerRadio = document.getElementById('glyph-type-consumer');
    this.glyphInvText = document.getElementById('glyph-inv-text');
        
    // Elementos de estadísticas
        this.moneyCounter = document.getElementById('money-counter');
        this.lengthCounter = document.getElementById('length-counter');
        this.maxLengthCounter = document.getElementById('max-length-counter');
        this.dnaCounter = document.getElementById('dna-counter');
    this.pcTileBonusEl = document.getElementById('pc-tile-bonus');
    this.speedMultEl = document.getElementById('speed-mult');
    // Mini-HUD
    this.miniHud = document.getElementById('mini-hud');
    this.miniHudPc = document.getElementById('mini-hud-pc');
    this.miniHudSpd = document.getElementById('mini-hud-speed');
    this.miniHudCombo = document.getElementById('mini-hud-combo'); // Wall 2: multiplicador glifos

        // Estado del juego
        this.isPaused = false;
    this.isEditMode = false;
    this.tilePlacementMode = false;
    this.basketPlacementMode = false;
    this.glyphPlacementMode = false;         // Nuevo: modo colocación glifos
    this.selectedGlyphType = GLYPH_TYPES.COMBO; // Tipo de glifo seleccionado
    
    // Wall 2: Glifos de Combo - Sistema Acumulativo
    this.currentComboMultiplier = 0.0;       // Multiplicador acumulado por serpiente en GLYPH_COMBO
    this.tilePlacementType = (typeof TILE_EFFECTS !== 'undefined' && TILE_EFFECTS.PC_MULT) ? TILE_EFFECTS.PC_MULT : 'PC_MULT';
    this.tileInventory = { PC_MULT: 0, SPEED: 0 };
    this.gameLoopId = null;
    this.lastUpdateTime = 0;
    // Prestigio
    this.prestigeReady = false;

        // Inicializar sistemas del juego
        this.initializeGame();
        this.setupEventListeners();
        this.loadGameState();
        
        // Iniciar el bucle del juego
        this.startGameLoop();
    }

    // Inicializar todos los sistemas del juego
    initializeGame() {
        this.stats = new GameStats();
        this.upgradeManager = new UpgradeManager();
        this.wallManager = new WallManager();
    this.pathfindingAI = new PathfindingAI();
    this.tileEffects = new TileEffectMap(this.gridSize);
        this.glyphMap = new GlyphMap(this.gridSize);  // Sistema de glifos de ADN
        
        // Inicializar tamaño de cuadrícula (arranca siempre en base y expansión futura ajustará)
    this.gridSize = GAME_CONFIG.INITIAL_GRID_SIZE; // expansión futura modificará via resetGame()
        this.updateCanvasSize();
    // Inicializar cestas
    this.basketMap = new BasketMap(this.gridSize);
        
        // Inicializar entidades principales
        this.snake = new Snake(this.gridSize);
        // Recolocar cuerpo centrado explícitamente para robustez
        const center = Math.floor(this.gridSize / 2);
        this.snake.body[0] = { x: center, y: center };
        this.snake.body[1] = { x: center - 1, y: center };
        this.snake.body[2] = { x: center - 2, y: center };
    // Multi-frutas (Fase 2): iniciar arreglo
    this.fruits = [];
    this.ensureFruitPopulation();
        
        // Inicializar UI
        this.upgradeUI = new UpgradeUI(this.upgradeManager);
        this.upgradeUI.setUpgradePurchaseCallback((upgradeId) => {
            this.purchaseUpgrade(upgradeId);
        });

        Logger.log('Juego inicializado correctamente');
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botón de pausa
        this.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });

        // Botón de modo edición
        this.editModeBtn.addEventListener('click', () => {
            this.toggleEditMode();
        });
        if (this.tilePlaceBtn) {
            this.tilePlaceBtn.addEventListener('click', () => {
                if (!this.isEditMode) this.toggleEditMode();
                const totalInv = (this.tileInventory.PC_MULT + this.tileInventory.SPEED);
                if (totalInv <= 0) return;
                this.tilePlacementMode = !this.tilePlacementMode;
                // Al activar, seleccionar el tipo según disponibilidad si el actual no tiene stock
                if (this.tilePlacementMode) {
                    if (this.tilePlacementType === TILE_EFFECTS.PC_MULT && this.tileInventory.PC_MULT <= 0 && this.tileInventory.SPEED > 0) {
                        this.tilePlacementType = TILE_EFFECTS.SPEED;
                    } else if (this.tilePlacementType === TILE_EFFECTS.SPEED && this.tileInventory.SPEED <= 0 && this.tileInventory.PC_MULT > 0) {
                        this.tilePlacementType = TILE_EFFECTS.PC_MULT;
                    }
                }
                this.syncTileTypeRadios();
                this.updateUI();
            });
        }
        if (this.basketPlaceBtn) {
            this.basketPlaceBtn.addEventListener('click', () => {
                if (!this.isEditMode) this.toggleEditMode();
                if (!this.stats.getHasPrestiged()) return;
                this.basketPlacementMode = !this.basketPlacementMode;
                this.updateUI();
            });
        }
        
        // Botón de colocación de glifos
        if (this.glyphPlaceBtn) {
            this.glyphPlaceBtn.addEventListener('click', () => {
                if (!this.isEditMode) this.toggleEditMode();
                if (!this.stats.getHasPrestiged()) return;
                const totalGlyphs = (this.stats.glyphInventory?.combo || 0) + (this.stats.glyphInventory?.consumer || 0);
                if (totalGlyphs <= 0) return;
                this.glyphPlacementMode = !this.glyphPlacementMode;
                // Al activar, seleccionar el tipo según disponibilidad
                if (this.glyphPlacementMode) {
                    if (this.selectedGlyphType === GLYPH_TYPES.COMBO && (this.stats.glyphInventory?.combo || 0) <= 0 && (this.stats.glyphInventory?.consumer || 0) > 0) {
                        this.selectedGlyphType = GLYPH_TYPES.CONSUMER;
                    } else if (this.selectedGlyphType === GLYPH_TYPES.CONSUMER && (this.stats.glyphInventory?.consumer || 0) <= 0 && (this.stats.glyphInventory?.combo || 0) > 0) {
                        this.selectedGlyphType = GLYPH_TYPES.COMBO;
                    }
                }
                this.syncGlyphTypeRadios();
                this.updateUI();
            });
        }

        // Radio change handlers
        if (this.tileTypePcRadio) {
            this.tileTypePcRadio.addEventListener('change', () => {
                if (this.tileTypePcRadio.checked) this.tilePlacementType = TILE_EFFECTS.PC_MULT;
                this.updateUI();
            });
        }
        if (this.tileTypeSpdRadio) {
            this.tileTypeSpdRadio.addEventListener('change', () => {
                if (this.tileTypeSpdRadio.checked) this.tilePlacementType = TILE_EFFECTS.SPEED;
                this.updateUI();
            });
        }
        
        // Radio change handlers para glifos
        if (this.glyphTypeComboRadio) {
            this.glyphTypeComboRadio.addEventListener('change', () => {
                if (this.glyphTypeComboRadio.checked) this.selectedGlyphType = GLYPH_TYPES.COMBO;
                this.updateUI();
            });
        }
        if (this.glyphTypeConsumerRadio) {
            this.glyphTypeConsumerRadio.addEventListener('change', () => {
                if (this.glyphTypeConsumerRadio.checked) this.selectedGlyphType = GLYPH_TYPES.CONSUMER;
                this.updateUI();
            });
        }

        // Clicks en el canvas
        this.canvas.addEventListener('click', (e) => {
            if (this.isEditMode) {
                this.handleCanvasClick(e);
            }
        });

        // Guardar automáticamente cada 30 segundos
        setInterval(() => {
            this.saveGameState();
        }, 30000);

        // Guardar antes de cerrar la página
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });

        Logger.log('Event listeners configurados');
    }

    // Manejar clicks en el canvas durante modo edición
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const cellPosition = CanvasUtils.getCellFromCanvas(
            canvasX, 
            canvasY, 
            GAME_CONFIG.CELL_SIZE
        );

        if (!MathUtils.isValidPosition(cellPosition, this.gridSize)) return;
        // Colocación de Cestas (click normal para colocar, Shift+Click para remover)
        if (this.basketPlacementMode && this.stats.getHasPrestiged()) {
            const x = cellPosition.x, y = cellPosition.y;
            const removing = e.shiftKey === true;
            if (removing) {
                if (this.basketMap.isBasket(x, y)) {
                    this.basketMap.removeBasket(x, y);
                    this.stats.addBasket(1);
                    this.updateUI();
                    this.saveGameState();
                }
                return;
            }
            if (!this.basketMap.isBasket(x, y) && this.stats.basketInventory > 0 && !this.snake.isPositionOccupied(cellPosition) && !this.wallManager.isPositionOccupied(cellPosition)) {
                if (this.stats.useBasket()) {
                    this.basketMap.setBasket(x, y);
                    this.updateUI();
                    this.saveGameState();
                }
            }
            return;
        }
        
        // Colocación de Glifos (click normal para colocar, Shift+Click para remover)
        if (this.glyphPlacementMode && this.stats.getHasPrestiged()) {
            const x = cellPosition.x, y = cellPosition.y;
            const removing = e.shiftKey === true;
            
            if (removing) {
                // Remover glifo y devolver al inventario
                const glyphType = this.glyphMap.getGlyph(x, y);
                if (glyphType) {
                    this.glyphMap.removeGlyph(x, y);
                    if (glyphType === GLYPH_TYPES.COMBO) {
                        this.stats.addGlyph('combo', 1);
                    } else if (glyphType === GLYPH_TYPES.CONSUMER) {
                        this.stats.addGlyph('consumer', 1);
                    }
                    this.updateUI();
                    this.saveGameState();
                }
                return;
            }
            
            // Colocar glifo
            if (!this.glyphMap.hasGlyph(x, y) && 
                !this.snake.isPositionOccupied(cellPosition) && 
                !this.wallManager.isPositionOccupied(cellPosition) &&
                !this.basketMap.isBasket(x, y)) {
                
                const hasInventory = (this.selectedGlyphType === GLYPH_TYPES.COMBO && (this.stats.glyphInventory?.combo || 0) > 0) ||
                                   (this.selectedGlyphType === GLYPH_TYPES.CONSUMER && (this.stats.glyphInventory?.consumer || 0) > 0);
                
                if (hasInventory) {
                    this.glyphMap.setGlyph(x, y, this.selectedGlyphType);
                    // Remover del inventario
                    if (this.selectedGlyphType === GLYPH_TYPES.COMBO) {
                        this.stats.useGlyph('combo', 1);
                    } else if (this.selectedGlyphType === GLYPH_TYPES.CONSUMER) {
                        this.stats.useGlyph('consumer', 1);
                    }
                    this.updateUI();
                    this.saveGameState();
                }
            }
            return;
        }
        
        if (this.tilePlacementMode) {
            const remove = e.shiftKey === true;
            this.placeOrRemoveTileEffect(cellPosition.x, cellPosition.y, remove);
            return;
        }
        if (this.wallManager.placementMode) {
            this.placeWallPart(cellPosition);
        } else {
            this.selectWallForRemoval(cellPosition);
        }
    }

    // Colocar parte de muro
    placeWallPart(position) {
        const success = this.wallManager.placePart(position, this.snake, this.fruit);
        
        if (success) {
            // Si el muro se completó, salir del modo de colocación
            if (!this.wallManager.currentWallBeingPlaced) {
                this.showWallPlacementComplete();
            }
        } else {
            this.showWallPlacementError();
        }
    }

    // Seleccionar muro para remover
    selectWallForRemoval(position) {
        const wall = this.wallManager.getWallAt(position);
        if (wall) {
            if (confirm(`¿Remover ${wall.type}? Se devolverá al inventario.`)) {
                this.wallManager.removeWall(wall.id);
                this.updateUI();
            }
        }
    }

    // Bucle principal del juego
    gameLoop(currentTime) {
        if (this.isPaused) {
            this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }

        // Calcular delta time para movimiento basado en tiempo
        const deltaTime = currentTime - this.lastUpdateTime;
        let moveSpeed = this.snake.isBoostActive() ? 
                         this.upgradeManager.getCurrentSpeed() / 3 : 
                         this.upgradeManager.getCurrentSpeed();
        // Aplicar baldosa de velocidad (SPEED) en la celda de la cabeza
        const headForSpeed = this.snake.getHead();
        if (this.tileEffects && headForSpeed && typeof getSpeedMultiplierForCell === 'function') {
            const mult = getSpeedMultiplierForCell(this.tileEffects, headForSpeed.x, headForSpeed.y);
            if (mult && mult > 0) moveSpeed = moveSpeed / mult;
        }

        if (deltaTime >= moveSpeed) {
            this.update();
            this.lastUpdateTime = currentTime;
        }

        this.render();
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Actualizar lógica del juego
    update() {
        if (!this.snake.isSnakeAlive()) return;

        // Obtener dirección de la IA
        const targetFruit = this.chooseTargetFruit();
        const aiDirection = this.pathfindingAI.getNextDirection(
            this.snake,
            targetFruit,
            this.wallManager.walls,
            this.gridSize
        );

        if (aiDirection) {
            this.snake.setDirection(aiDirection);
        }

        // Mover serpiente
        if (!this.snake.move()) return;

        // Verificar colisiones fatales
        const hitWall = this.snake.checkWallCollision();
        const hitSelf = !hitWall && this.snake.checkSelfCollision();
        if (hitWall || hitSelf) {
            // Snapshot debug antes de muerte
            if (typeof window !== 'undefined') {
                window.LAST_DEATH_SNAPSHOT = {
                    reason: hitWall ? 'wall' : 'self',
                    snakeHead: { ...this.snake.getHead() },
                    length: this.snake.body.length,
                    ai: window.DEBUG_AI || null,
                    pathCache: this.pathfindingAI.currentPath ? [...this.pathfindingAI.currentPath] : null
                };
                console.log('[IdleSnake][DeathSnapshot]', window.LAST_DEATH_SNAPSHOT);
            }
            this.handleSnakeDeath();
            return;
        }

        // Wall 2: Verificar si la cabeza activó un glifo CONSUMER
        this.checkGlyphConsumerActivation();

        // Procesar interacciones con muros
        const wallInteraction = this.wallManager.processSnakeWallInteraction(this.snake);
        if (wallInteraction) {
            this.handleWallInteraction(wallInteraction);
        }

        // Verificar si comió fruta
        // Verificar frutas comidas
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            if (this.snake.isHeadAt(this.fruits[i].position)) {
                this.handleFruitEaten(this.fruits[i]);
                this.fruits.splice(i, 1);
            }
        }
        // Reponer población de frutas si falta
        this.ensureFruitPopulation();

        // Wall 2: Calcular multiplicador acumulativo por glifos
        this.calculateComboMultiplier();

        // Actualizar estadísticas
        this.stats.updateCurrentLength(this.snake.length);
        this.updateUI();
    }

    // Wall 2: Calcular multiplicador acumulativo de glifos COMBO
    calculateComboMultiplier() {
        this.currentComboMultiplier = 0.0;

        // Si no hay mapa de glifos, no calcular
        if (!this.glyphMap) return;

        // Iterar sobre todos los segmentos de la serpiente
        for (const segment of this.snake.body) {
            const glyph = this.glyphMap.getGlyph(segment.x, segment.y);
            if (glyph === GLYPH_TYPES.COMBO) {
                // Cada segmento en un glifo COMBO añade +0.5 al multiplicador
                this.currentComboMultiplier += 0.5;
            }
        }
    }

    // Wall 2: Verificar activación de glifos CONSUMER (sacrificio)
    checkGlyphConsumerActivation() {
        // Si no hay mapa de glifos, no verificar
        if (!this.glyphMap) return;

        // Obtener posición de la cabeza de la serpiente
        const head = this.snake.getHead();
        if (!head) return;

        // Verificar si hay un glifo CONSUMER en la posición de la cabeza
        const glyph = this.glyphMap.getGlyph(head.x, head.y);
        if (glyph === GLYPH_TYPES.CONSUMER) {
            this.activateGlyphConsumer();
        }
    }

    // Wall 2: Activar efecto de glifo CONSUMER (sacrificio estratégico)
    activateGlyphConsumer() {
        // Protección: no sacrificar si la longitud ya es mínima (3 segmentos)
        if (this.snake.length <= 3) return;

        // Realizar el sacrificio: reducir longitud en 1 segmento
        this.snake.body.pop(); // Remover último segmento (cola)
        
        // Calcular recompensa monetaria (equivalente a ~3 frutas doradas)
        const rewardAmount = 500; // Base fija por sacrificio
        this.stats.addMoney(rewardAmount);
        
        // Log del evento para debug
        Logger.log(`Glifo CONSUMER activado: -1 longitud, +$${rewardAmount}`);
        
        // Mostrar feedback visual
        this.showSacrificeNotification(rewardAmount);
    }

    // Wall 2: Mostrar notificación visual del sacrificio
    showSacrificeNotification(rewardAmount) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'sacrifice-notification';
        notification.innerHTML = `
            <div class="sacrifice-content">
                <span class="sacrifice-icon">⚡</span>
                <span class="sacrifice-text">¡Glifo de Sacrificio!</span>
                <span class="sacrifice-effect">Longitud -1, +$${rewardAmount}</span>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Animar y remover después de 3 segundos
        setTimeout(() => {
            notification.classList.add('sacrifice-fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 2500);
    }

    // Manejar muerte de la serpiente
    handleSnakeDeath() {
        Logger.log('Serpiente murió');
        
        this.snake.kill();
        this.stats.snakeDeath();
        this.pathfindingAI.reset();
        
        // Reiniciar después de un breve delay
        setTimeout(() => {
            this.restartRun();
        }, 1000);
    }

    // Reiniciar partida (mantener mejoras y $)
    restartRun() {
        // Mantener mejoras pero reiniciar entidades sobre el tamaño actual
        this.resetGame(this.gridSize, { preserveStats: true });
        Logger.log('Partida reiniciada (resetGame)');
    }

    // Manejar interacción con muro
    handleWallInteraction(interaction) {
        switch (interaction.type) {
            case 'teleport':
                Logger.log(`Teletransporte a (${interaction.position.x}, ${interaction.position.y})`);
                break;
            case 'boost':
                Logger.log(`Boost activado por ${interaction.duration}ms`);
                break;
        }
    }

    // Manejar cuando se come una fruta
    handleFruitEaten(fruit) {
        this.snake.grow();
        // Base: multiplicador de upgrades + bonus por baldosa en la celda de la fruta
        const baseMult = this.upgradeManager.getCurrentMoneyMultiplier();
        const pos = fruit.position;
        let tileBonus = 0;
        const effect = this.tileEffects ? this.tileEffects.getEffect(pos.x, pos.y) : null;
        if (effect === TILE_EFFECTS.PC_MULT) tileBonus += 1;
        let reward = baseMult + tileBonus;
        // Cesta: multiplicador si hay cesta en la celda
        if (this.stats.getHasPrestiged() && this.basketMap && this.basketMap.isBasket(pos.x, pos.y)) {
            reward = Math.floor(reward * (this.stats.basketMultiplier || 1));
        }
        // Dorada post-prestigio: multiplicador global
        if (this.stats.getHasPrestiged() && fruit.type === 'golden') {
            const gm = this.upgradeManager.getCurrentGoldenMultiplier();
            reward = Math.floor(reward * gm);
        }
        
        // Wall 2: Aplicar multiplicador acumulativo de glifos COMBO
        if (this.currentComboMultiplier > 0) {
            const comboBonus = 1 + this.currentComboMultiplier;
            reward = Math.floor(reward * comboBonus);
        }
        
        this.stats.eatFruit(reward);
        if (fruit.type === 'golden') Logger.log('Golden Apple consumida');
        Logger.log(`Fruta comida (${fruit.type}). $ ganados: ${reward}`);
    }

    // Generar nueva fruta
    // Multi-frutas: asegurar población acorde a cultivo
    ensureFruitPopulation() {
        const cultivo = this.upgradeManager.getUpgrade('cultivo');
        const extra = cultivo ? cultivo.currentLevel : 0;
        const desired = 1 + extra; // base 1
        while (this.fruits.length < desired) {
            const fruit = this.createFruit();
            if (fruit) this.fruits.push(fruit); else break;
        }
    }

    createFruit() {
        let attempts = 0; const maxAttempts = 100;
        while (attempts < maxAttempts) {
            const f = new Fruit(this.gridSize);
            // Doradas solo tras prestigio
            if (this.stats.getHasPrestiged()) {
                const goldenChance = this.upgradeManager.getCurrentGoldenChance();
                if (Math.random() < goldenChance) f.setType('golden');
            }
            const exclude = [
                ...this.snake.getOccupiedPositions(),
                ...this.wallManager.getAllWallPositions(),
                ...this.fruits?.map(fr => fr.position) || []
            ];
            // Viés hacia cestas: 70% si hay cestas libres
            let candidate = null;
            if (this.stats.getHasPrestiged() && this.basketMap) {
                const baskets = this.basketMap.getAllBasketPositions();
                const free = baskets.filter(p => !exclude.some(ep => ep.x === p.x && ep.y === p.y));
                if (free.length > 0 && Math.random() < 0.7) {
                    candidate = free[Math.floor(Math.random() * free.length)];
                }
            }
            if (candidate) {
                f.position = { x: candidate.x, y: candidate.y };
            } else {
                f.generateNewPosition(exclude);
            }
            // Validar repulsión
            if (!this.wallManager.checkFruitRepulsion || !this.wallManager.checkFruitRepulsion(f)) {
                return f;
            }
            attempts++;
        }
        Logger.warn('No se pudo generar nueva fruta multi-intento');
        return null;
    }

    // Renderizar el juego
    render() {
        // Limpiar canvas
        CanvasUtils.clear(this.ctx, this.canvas.width, this.canvas.height);
        
        // Dibujar fondo
        this.ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar cuadrícula
        CanvasUtils.drawGrid(this.ctx, this.gridSize, GAME_CONFIG.CELL_SIZE);
        
    // Dibujar muros
    this.renderWalls();
    // Dibujar efectos de baldosas (debajo de frutas y serpiente)
    this.renderTileEffects();
        
        // Dibujar fruta
    if (this.fruits) this.renderFruits();
        // Dibujar cestas (debajo de serpiente)
        this.renderBaskets();
        
        // Dibujar glifos de ADN (debajo de serpiente)
        this.renderGlyphs();
        
        // Dibujar serpiente
        this.renderSnake();
        
        // Dibujar overlay para modo edición
        if (this.isEditMode) {
            this.renderEditModeOverlay();
        }

        // Actualizar y posicionar Mini-HUD cerca de la cabeza
        this.updateMiniHUDPositionAndValues();
    }

    // Renderizar muros
    renderWalls() {
        this.wallManager.walls.forEach(wall => {
            wall.positions.forEach(pos => {
                const canvasPos = CanvasUtils.getCanvasFromCell(
                    pos.x, 
                    pos.y, 
                    GAME_CONFIG.CELL_SIZE
                );
                
                CanvasUtils.drawRoundedRect(
                    this.ctx,
                    canvasPos.x + 2,
                    canvasPos.y + 2,
                    GAME_CONFIG.CELL_SIZE - 4,
                    GAME_CONFIG.CELL_SIZE - 4,
                    5,
                    wall.getColor()
                );
            });
        });

        // Dibujar muro siendo colocado
        if (this.wallManager.currentWallBeingPlaced) {
            this.wallManager.currentWallBeingPlaced.positions.forEach(pos => {
                const canvasPos = CanvasUtils.getCanvasFromCell(
                    pos.x, 
                    pos.y, 
                    GAME_CONFIG.CELL_SIZE
                );
                
                CanvasUtils.drawRoundedRect(
                    this.ctx,
                    canvasPos.x + 2,
                    canvasPos.y + 2,
                    GAME_CONFIG.CELL_SIZE - 4,
                    GAME_CONFIG.CELL_SIZE - 4,
                    5,
                    this.wallManager.currentWallBeingPlaced.getColor(),
                    '#ffffff'
                );
            });
        }
    }

    // Renderizar efectos de baldosas
    renderTileEffects() {
        if (!this.tileEffects) return;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const eff = this.tileEffects.getEffect(x, y);
                if (!eff) continue;
                const color = GAME_CONFIG.TILE_COLORS[eff] || '#555555';
                const canvasPos = CanvasUtils.getCanvasFromCell(x, y, GAME_CONFIG.CELL_SIZE);
                CanvasUtils.drawRoundedRect(
                    this.ctx,
                    canvasPos.x + 6,
                    canvasPos.y + 6,
                    GAME_CONFIG.CELL_SIZE - 12,
                    GAME_CONFIG.CELL_SIZE - 12,
                    6,
                    color
                );
            }
        }
    }

    // Renderizar fruta
    renderFruit() { /* obsoleto mantenido temporalmente */ }

    renderFruits() {
        this.fruits.forEach(fruit => {
            const canvasPos = CanvasUtils.getCanvasFromCell(
                fruit.position.x,
                fruit.position.y,
                GAME_CONFIG.CELL_SIZE
            );
            CanvasUtils.drawCircle(
                this.ctx,
                canvasPos.x + GAME_CONFIG.CELL_SIZE / 2,
                canvasPos.y + GAME_CONFIG.CELL_SIZE / 2,
                (GAME_CONFIG.CELL_SIZE / 2) - (fruit.type === 'golden' ? 1 : 3),
                fruit.getColor(),
                fruit.type === 'golden' ? '#FFFFFF' : null
            );
            if (fruit.type === 'golden') {
                // Dibujar símbolo '$' para identificar Manzana Dorada
                this.ctx.fillStyle = '#2b2b2b';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('$', canvasPos.x + GAME_CONFIG.CELL_SIZE / 2, canvasPos.y + GAME_CONFIG.CELL_SIZE / 2 + 1);
            }
        });
    }

    renderBaskets() {
        if (!this.basketMap) return;
        const positions = this.basketMap.getAllBasketPositions();
        positions.forEach(pos => {
            const canvasPos = CanvasUtils.getCanvasFromCell(
                pos.x,
                pos.y,
                GAME_CONFIG.CELL_SIZE
            );
            CanvasUtils.drawRoundedRect(
                this.ctx,
                canvasPos.x + 8,
                canvasPos.y + 8,
                GAME_CONFIG.CELL_SIZE - 16,
                GAME_CONFIG.CELL_SIZE - 16,
                6,
                'rgba(255,215,0,0.18)',
                '#FFD700'
            );
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('C', canvasPos.x + GAME_CONFIG.CELL_SIZE / 2, canvasPos.y + GAME_CONFIG.CELL_SIZE / 2);
        });
    }

    // Renderizar glifos de ADN
    renderGlyphs() {
        if (!this.glyphMap) return;
        this.glyphMap.render(this.ctx, GAME_CONFIG.CELL_SIZE);
    }

    // Renderizar serpiente
    renderSnake() {
        this.snake.body.forEach((segment, index) => {
            const canvasPos = CanvasUtils.getCanvasFromCell(
                segment.x,
                segment.y,
                GAME_CONFIG.CELL_SIZE
            );
            
            const isHead = index === 0;
            const color = isHead ? 
                         GAME_CONFIG.COLORS.SNAKE_HEAD : 
                         GAME_CONFIG.COLORS.SNAKE_BODY;
            
            CanvasUtils.drawRoundedRect(
                this.ctx,
                canvasPos.x + 1,
                canvasPos.y + 1,
                GAME_CONFIG.CELL_SIZE - 2,
                GAME_CONFIG.CELL_SIZE - 2,
                isHead ? 8 : 4,
                color
            );
        });

        // Efecto visual para boost
        if (this.snake.isBoostActive()) {
            const head = this.snake.getHead();
            const canvasPos = CanvasUtils.getCanvasFromCell(
                head.x,
                head.y,
                GAME_CONFIG.CELL_SIZE
            );
            
            CanvasUtils.drawCircle(
                this.ctx,
                canvasPos.x + GAME_CONFIG.CELL_SIZE / 2,
                canvasPos.y + GAME_CONFIG.CELL_SIZE / 2,
                GAME_CONFIG.CELL_SIZE / 2 + 5,
                null,
                '#FFC107'
            );
        }
    }

    // Renderizar overlay del modo edición
    renderEditModeOverlay() {
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Mostrar instrucciones
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';

        let y = 30;
        // Instrucciones de colocación de muros
        if (this.wallManager.placementMode) {
            this.ctx.fillText(`Colocando ${this.wallManager.placementMode}. Haz clic para colocar.`, this.canvas.width / 2, y);
            y += 20;
        } else {
            this.ctx.fillText('Modo Edición: Haz clic en muros para remover.', this.canvas.width / 2, y);
            y += 20;
        }

        // Instrucciones de baldosas
        const invText = `$ ${this.tileInventory.PC_MULT} | SPD ${this.tileInventory.SPEED}`;
        if (this.tilePlacementMode) {
            const typeText = this.tilePlacementType === TILE_EFFECTS.SPEED ? 'SPD' : '$';
            this.ctx.fillText(`Baldosas: Click para colocar [${typeText}] • Shift+Click para remover • Inv: ${invText}`, this.canvas.width / 2, y);
            y += 20;
        } else {
            if ((this.tileInventory.PC_MULT + this.tileInventory.SPEED) > 0) {
                this.ctx.fillText(`Baldosas disponibles (${invText}). Usa el botón Baldosas para activar y alternar tipo.`, this.canvas.width / 2, y);
                y += 20;
            }
        }
    }

    // Actualizar tamaño del canvas
    updateCanvasSize() {
        const size = this.gridSize * GAME_CONFIG.CELL_SIZE;
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Actualizar objetos del juego
        if (this.snake) {
            this.snake.updateGridSize(this.gridSize);
        }
        if (this.fruit) {
            this.fruit.updateGridSize(this.gridSize, this.snake ? this.snake.getOccupiedPositions() : []);
        }
    }

    // Actualizar UI
    updateUI() {
        const stats = this.stats.getDisplayStats();
        
        this.moneyCounter.textContent = `$${FormatUtils.formatNumber(stats.money)}`;
        this.lengthCounter.textContent = FormatUtils.formatNumber(stats.currentLength);
        this.maxLengthCounter.textContent = FormatUtils.formatNumber(stats.maxLength);
        this.dnaCounter.textContent = FormatUtils.formatNumber(stats.pureDNA);

        // Mini-HUD: efectos activos en la celda de la cabeza
        let tileBonus = 0;
        let speedMultTile = 1.0;
        const head = this.snake ? this.snake.getHead() : null;
        if (head && this.tileEffects) {
            const eff = this.tileEffects.getEffect(head.x, head.y);
            if (eff === TILE_EFFECTS.PC_MULT) tileBonus += 1; // ajustar si se cambia diseño de bonus
            if (typeof getSpeedMultiplierForCell === 'function') {
                speedMultTile = getSpeedMultiplierForCell(this.tileEffects, head.x, head.y) || 1.0;
            }
        }
    if (this.pcTileBonusEl) this.pcTileBonusEl.textContent = `+${tileBonus}`;
    // Mostrar multiplicador total de velocidad (upgrades * tile * boost)
    const baseSpeed = GAME_CONFIG.INITIAL_SPEED;
    const currentSpeed = this.upgradeManager.getCurrentSpeed();
    const baseMult = Math.max(0.1, baseSpeed / currentSpeed);
    const boostMult = this.snake && this.snake.isBoostActive() ? 3 : 1;
    const totalSpeedMult = baseMult * speedMultTile * boostMult;
    if (this.speedMultEl) this.speedMultEl.textContent = `x${totalSpeedMult.toFixed(1)}`;
    // Mini-HUD texto
    if (this.miniHudPc) this.miniHudPc.textContent = `+${tileBonus} $`;
    if (this.miniHudSpd) this.miniHudSpd.textContent = `x${speedMultTile.toFixed(1)} SPD`;
    
    // Wall 2: Mostrar multiplicador de glifos COMBO si hay actividad
    if (this.miniHudCombo) {
        const comboSep = document.getElementById('mini-hud-combo-sep');
        if (this.currentComboMultiplier > 0) {
            const totalComboMult = 1 + this.currentComboMultiplier;
            this.miniHudCombo.textContent = `x${totalComboMult.toFixed(1)} ◆`;
            this.miniHudCombo.style.display = 'inline';
            if (comboSep) comboSep.style.display = 'inline';
        } else {
            this.miniHudCombo.style.display = 'none';
            if (comboSep) comboSep.style.display = 'none';
        }
    }
        
        // Actualizar mejoras (pasar tamaño actual del grid)
        this.upgradeUI.updateUI(this.stats, this.gridSize);
        // Gestionar visibilidad/estado de Prestigio (para la carta en tienda)
        const prestigeSection = document.querySelector('.prestige-section');
        const moneyThreshold = (GAME_CONFIG.ECONOMY && GAME_CONFIG.ECONOMY.PRESTIGE_MONEY_THRESHOLD) ? GAME_CONFIG.ECONOMY.PRESTIGE_MONEY_THRESHOLD : 10000;
        const gridCap = this.stats.getHasPrestiged() ? 15 : 10;
        this.prestigeReady = (this.gridSize >= gridCap) && (this.stats.money >= moneyThreshold);
        if (prestigeSection) {
            const showPrestige = this.stats.getHasPrestiged() || (this.gridSize >= gridCap);
            prestigeSection.style.display = showPrestige ? 'block' : 'none';
        }
        
        // Actualizar botón de modo edición
        this.editModeBtn.disabled = this.wallManager.getInventoryStatus().portal === 0 && 
                                    this.wallManager.getInventoryStatus().repulsion === 0 && 
                                    this.wallManager.getInventoryStatus().boost === 0 &&
                                    this.wallManager.walls.length === 0 &&
                                    (this.tileInventory.PC_MULT + this.tileInventory.SPEED) === 0;
        const totalInv = (this.tileInventory.PC_MULT + this.tileInventory.SPEED);
        if (this.tilePlaceBtn) {
            const invText = `$ ${this.tileInventory.PC_MULT} | SPD ${this.tileInventory.SPEED}`;
            this.tilePlaceBtn.textContent = this.tilePlacementMode ? `Salir Baldosas (${invText})` : `Baldosas (${invText})`;
            this.tilePlaceBtn.disabled = totalInv <= 0;
        }
        // Mostrar/ocultar y habilitar radios según modo e inventario
        if (this.tileTypeControls) {
            this.tileTypeControls.style.display = (this.isEditMode && this.tilePlacementMode) ? 'flex' : 'none';
            if (this.tileInvText) this.tileInvText.textContent = `$ ${this.tileInventory.PC_MULT} | SPD ${this.tileInventory.SPEED}`;
            if (this.tileTypePcRadio) {
                this.tileTypePcRadio.disabled = this.tileInventory.PC_MULT <= 0;
                this.tileTypePcRadio.checked = (this.tilePlacementType === TILE_EFFECTS.PC_MULT);
            }
            if (this.tileTypeSpdRadio) {
                this.tileTypeSpdRadio.disabled = this.tileInventory.SPEED <= 0;
                this.tileTypeSpdRadio.checked = (this.tilePlacementType === TILE_EFFECTS.SPEED);
            }
        }
        // Botón de Cestas
        if (this.basketPlaceBtn) {
            const enabled = this.stats.getHasPrestiged() && (this.stats.basketInventory > 0);
            this.basketPlaceBtn.disabled = !enabled;
            this.basketPlaceBtn.textContent = enabled ? `Cestas (${this.stats.basketInventory})` : 'Cestas';
        }
        
        // Botón de Glifos
        if (this.glyphPlaceBtn) {
            const comboCount = this.stats.glyphInventory?.combo || 0;
            const consumerCount = this.stats.glyphInventory?.consumer || 0;
            const totalGlyphs = comboCount + consumerCount;
            const enabled = this.stats.getHasPrestiged() && totalGlyphs > 0;
            this.glyphPlaceBtn.disabled = !enabled;
            this.glyphPlaceBtn.style.display = this.stats.getHasPrestiged() && this.gridSize > 10 ? 'inline-block' : 'none';
            this.glyphPlaceBtn.textContent = enabled ? `🧬 Glifos (🔮${comboCount} ⚡${consumerCount})` : '🧬 Glifos';
        }
        
        // Mostrar/ocultar controles de glifos
        if (this.glyphTypeControls) {
            this.glyphTypeControls.style.display = (this.isEditMode && this.glyphPlacementMode) ? 'flex' : 'none';
            this.syncGlyphTypeRadios();
        }
    }

    // La carta de Prestigio ahora vive en la tienda; no necesitamos un botón separado aquí

    performPrestige() {
        if (!this.prestigeReady) return false;
        // Recompensa
        this.stats.pureDNA += 1;
        this.stats.setHasPrestiged(true);
        // Reset de mejoras e inventarios del run
        this.upgradeManager.resetForMutation();
        this.wallManager.resetForMutation();
        // Reset cestas iniciales post-prestigio
        if (typeof BasketMap !== 'undefined') {
            this.basketMap = new BasketMap(GAME_CONFIG.INITIAL_GRID_SIZE);
        }
        // Recalcular inventario base de cestas y multiplicador según upgrades permanentes
        const basketCountLevel = this.upgradeManager?.getUpgrade?.('basket_count')?.currentLevel || 0;
        const basketPowerLevel = this.upgradeManager?.getUpgrade?.('basket_power')?.currentLevel || 0;
        this.stats.basketInventory = 1 + basketCountLevel; // base 1 + niveles permanentes
        // Multiplicador base: nivel 0 = x5, nivel 1 = x8, etc.
        this.stats.basketMultiplier = Math.max(5, (basketPowerLevel * 3) + 5);
        // Reiniciar juego a 5x5
        const oldSize = this.gridSize; // Guardar el tamaño anterior
        this.gridSize = GAME_CONFIG.INITIAL_GRID_SIZE;
        this.updateCanvasSize();
        this.resetGame(this.gridSize, { preserveStats: false });
        // $ y longitudes base
        this.stats.money = 0;
        this.stats.currentLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        this.stats.maxLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        // Guardar y refrescar
        this.saveGameState();
        this.updateUI();
        alert('¡Prestigio realizado! +1 Célula Mutante. Se han desbloqueado Cestas y Manzanas Doradas.');
        return true;
    }

    // Actualiza la posición del Mini-HUD para que siga a la cabeza y su visibilidad
    updateMiniHUDPositionAndValues() {
        if (!this.miniHud || !this.snake) return;
        const head = this.snake.getHead();
        if (!head) {
            this.miniHud.style.display = 'none';
            return;
        }
        // Mostrar Mini-HUD siempre que la serpiente esté viva
        this.miniHud.style.display = this.snake.isSnakeAlive() ? 'block' : 'none';

        const canvasPos = CanvasUtils.getCanvasFromCell(head.x, head.y, GAME_CONFIG.CELL_SIZE);
        // Posicionar el Mini-HUD relativo al canvas
        const rect = this.canvas.getBoundingClientRect();
        const hudX = rect.left + window.scrollX + canvasPos.x + GAME_CONFIG.CELL_SIZE / 2;
        const hudY = rect.top + window.scrollY + canvasPos.y;
        this.miniHud.style.position = 'absolute';
        this.miniHud.style.left = `${hudX}px`;
        this.miniHud.style.top = `${hudY}px`;
    }

    // Comprar mejora
    purchaseUpgrade(upgradeId) {
        // Manejo especial: 'prestige' como item de tienda
        if (upgradeId === 'prestige') {
            const pcThreshold = (GAME_CONFIG.ECONOMY && GAME_CONFIG.ECONOMY.PRESTIGE_MONEY_THRESHOLD) ? GAME_CONFIG.ECONOMY.PRESTIGE_MONEY_THRESHOLD : 10000;
            const canAfford = this.stats.money >= pcThreshold;
            const cap = this.stats.getHasPrestiged() ? 15 : 10;
            const atMaxBoard = this.gridSize >= cap;
            if (atMaxBoard && canAfford) {
                // Gastar el coste de prestigio ($)
                this.stats.spendMoney(pcThreshold);
                this.performPrestige();
            } else {
                Logger.warn('No cumples requisitos para prestigiar.');
            }
            // No continuar con flujo normal de upgrades
            return;
        }
        // Bloqueo preventivo: no permitir comprar expansión más allá del cap según prestigio
        if (upgradeId === 'expansion') {
            const cap = this.stats.getHasPrestiged() ? 15 : 10;
            const exp = this.upgradeManager.getUpgrade('expansion');
            const currentLevel = exp ? exp.currentLevel : 0;
            const maxAllowedLevel = cap - GAME_CONFIG.INITIAL_GRID_SIZE;
            if (currentLevel >= maxAllowedLevel) {
                Logger.warn('Expansión al máximo permitido actualmente.');
                return false;
            }
        }
        const success = this.upgradeManager.purchaseUpgrade(
            upgradeId, 
            this.stats, 
            this.wallManager
        );
        
        if (success) {
            if (upgradeId === 'expansion') {
                // Nuevo tamaño incremental: +1 por nivel hasta 10
                const targetSize = GAME_CONFIG.INITIAL_GRID_SIZE + this.upgradeManager.getUpgrade('expansion').currentLevel;
                const cap = this.stats.getHasPrestiged() ? 15 : 10;
                if (targetSize <= cap) {
                    this.resetGame(targetSize, { preserveStats: true });
                    // Después del primer prestigio, cada expansión otorga 1 ADN Puro
                    if (this.stats.getHasPrestiged()) {
                        this.stats.addPureDNA(1);
                        Logger.log('¡Ganaste 1 ADN Puro por expandir el tablero!');
                    }
                }
            } else if (upgradeId === 'cultivo') {
                this.ensureFruitPopulation();
            } else if (upgradeId === 'tile_pc') {
                this.tileInventory.PC_MULT = (this.tileInventory.PC_MULT || 0) + 1;
            } else if (upgradeId === 'tile_speed') {
                this.tileInventory.SPEED = (this.tileInventory.SPEED || 0) + 1;
            }
            
            this.updateUI();
            this.saveGameState();
            
            Logger.log(`Mejora ${upgradeId} comprada exitosamente`);
        }
        
        return success;
    }

    // Iniciar colocación de muro
    startWallPlacement(wallType) {
        if (this.wallManager.startPlacement(wallType)) {
            this.isEditMode = true;
            this.canvas.classList.add('edit-mode-active');
            this.updateEditModeButton();
            return true;
        }
        return false;
    }

    // Toggle pausa
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Reanudar' : 'Pausar';
        Logger.log(this.isPaused ? 'Juego pausado' : 'Juego reanudado');
    }

    // Toggle modo edición
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        if (!this.isEditMode) {
            this.wallManager.cancelPlacement();
        }
        
    this.canvas.classList.toggle('edit-mode-active', this.isEditMode);
    this.updateEditModeButton();
    if (!this.isEditMode && this.tilePlacementMode) this.tilePlacementMode = false;
    }

    // Actualizar botón de modo edición
    updateEditModeButton() {
        this.editModeBtn.textContent = this.isEditMode ? 'Salir Edición' : 'Modo Edición';
    }

    // Iniciar bucle del juego
    startGameLoop() {
        if (!this.gameLoopId) {
            this.lastUpdateTime = 0;
            this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
            Logger.log('Bucle del juego iniciado');
        }
    }

    // Detener bucle del juego
    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
            Logger.log('Bucle del juego detenido');
        }
    }

    // Mostrar que la mutación está disponible
    showMutationAvailable() {
        // Mostrar sección de prestigio
        const prestigeSection = document.querySelector('.prestige-section');
        if (prestigeSection) {
            prestigeSection.style.display = 'block';
        }
        
        Logger.log('¡Mutación disponible!');
    }

    // Realizar mutación
    performMutation() {
        if (this.stats.performMutation()) {
            this.upgradeManager.resetForMutation();
            this.wallManager.resetForMutation();
            
            // Reiniciar juego
            this.gridSize = this.upgradeManager.getCurrentGridSize();
            this.updateCanvasSize();
            this.restartRun();
            
            this.updateUI();
            this.saveGameState();
            
            Logger.log('¡Mutación realizada exitosamente!');
            return true;
        }
        
        return false;
    }

    // Mostrar completación de colocación de muro
    showWallPlacementComplete() {
        Logger.log('Muro colocado exitosamente');
        // Aquí se podría mostrar una notificación visual
    }

    // Mostrar error de colocación de muro
    showWallPlacementError() {
        Logger.warn('No se pudo colocar el muro en esa posición');
        // Aquí se podría mostrar una notificación visual
    }

    // Guardar estado del juego
    saveGameState() {
        this.stats.save();
        this.upgradeManager.save();
        this.wallManager.save();
        Logger.log('Estado del juego guardado');
        if (this.tileEffects) StorageUtils.save('tileEffects', this.tileEffects.serialize());
        StorageUtils.save('tileInventory', this.tileInventory);
    if (this.basketMap) StorageUtils.save('basketMap', this.basketMap.serialize());
        if (this.glyphMap) StorageUtils.save('glyphMap', this.glyphMap.serialize());
    }

    // Cargar estado del juego
    loadGameState() {
        this.stats.load();
        this.upgradeManager.load();
        this.wallManager.load();
        // Mantener grid inicial base (expansiones futuras usarán resetGame)
        this.gridSize = GAME_CONFIG.INITIAL_GRID_SIZE;
        this.updateCanvasSize();
        const te = StorageUtils.load('tileEffects', null);
        if (te) {
            this.tileEffects = TileEffectMap.deserialize(te);
        } else {
            this.tileEffects = new TileEffectMap(this.gridSize);
        }
    this.tileInventory = StorageUtils.load('tileInventory', { PC_MULT: 0, SPEED: 0 });
        const bm = StorageUtils.load('basketMap', null);
        this.basketMap = bm ? BasketMap.deserialize(bm) : new BasketMap(this.gridSize);
        const gm = StorageUtils.load('glyphMap', null);
        this.glyphMap = gm ? GlyphMap.deserialize(gm) : new GlyphMap(this.gridSize);
        // Recalcular inventario y multiplicador de cestas según upgrades permanentes si ya prestigió
        if (this.stats.getHasPrestiged()) {
            const basketCountLevel = this.upgradeManager?.getUpgrade?.('basket_count')?.currentLevel || 0;
            const basketPowerLevel = this.upgradeManager?.getUpgrade?.('basket_power')?.currentLevel || 0;
            // Si el save tiene menos inventario que el mínimo por upgrades, elevarlo al mínimo
            const minInv = 1 + basketCountLevel;
            if ((this.stats.basketInventory || 0) < minInv) this.stats.basketInventory = minInv;
            // Alinear multiplicador al menos con el permanente
            const minMult = 2 + basketPowerLevel;
            if ((this.stats.basketMultiplier || 0) < minMult) this.stats.basketMultiplier = minMult;
        }
        this.updateUI();
        Logger.log('Estado del juego cargado');
    }

    /**
     * Reinicia el estado dinámico del juego ajustando opcionalmente el tamaño de la cuadrícula.
     * @param {number} newSize - Nuevo tamaño de la cuadrícula. Si se omite, se reutiliza el actual.
     * @param {object} options - Opciones de reinicio.
     * @param {boolean} options.preserveStats - Si true, mantiene money, mutaciones y totales.
     */
    resetGame(newSize, options = {}) {
        const { preserveStats = false } = options;
        const oldSize = this.gridSize;
        if (typeof newSize === 'number' && newSize > 0 && newSize !== this.gridSize) {
            this.gridSize = newSize;
        }
        this.updateCanvasSize();
        // Re-centrar serpiente
        if (!this.snake) this.snake = new Snake(this.gridSize); else this.snake.gridSize = this.gridSize;
        const center = Math.floor(this.gridSize / 2);
        this.snake.body = [
            { x: center, y: center },
            { x: center - 1, y: center },
            { x: center - 2, y: center }
        ];
        this.snake.direction = DIRECTIONS.RIGHT;
        this.snake.nextDirection = DIRECTIONS.RIGHT;
        this.snake.length = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        this.snake.isAlive = true;
        this.snake.firstMoveDone = false;
    // Frutas múltiples
        this.fruits = [];
        this.ensureFruitPopulation();
    // Redimensionar efectos de baldosa con recentrado
    if (this.tileEffects) this.tileEffects.resize(this.gridSize); else this.tileEffects = new TileEffectMap(this.gridSize);
    
    // Redimensionar mapa de glifos con recentrado
    if (preserveStats) {
        if (this.glyphMap) this.glyphMap.resize(this.gridSize); else this.glyphMap = new GlyphMap(this.gridSize);
    } else {
        this.glyphMap = new GlyphMap(this.gridSize);
    }
    
    // Cestas: preservar en muerte/expansión (preserveStats=true), limpiar solo en resets totales
    if (preserveStats) {
        if (this.basketMap) this.basketMap.resize(this.gridSize); else this.basketMap = new BasketMap(this.gridSize);
    } else {
        this.basketMap = new BasketMap(this.gridSize);
    }
    
    // Muros: redimensionar y recentrar si el tamaño cambió
    if (this.wallManager) {
        if (oldSize !== this.gridSize && preserveStats) {
            this.wallManager.resize(oldSize, this.gridSize);
        } else {
            this.wallManager.resetForNewGame();
        }
    }
    
    // Limpiar pathfinding
    if (this.pathfindingAI) this.pathfindingAI.reset();
        // Stats
        if (!preserveStats) {
            this.stats.currentLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        } else {
            this.stats.currentLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH; // (en esta fase igual)
        }
        this.stats.maxLength = Math.max(this.stats.maxLength, this.stats.currentLength);
        this.updateUI();
        Logger.log(`resetGame aplicado. gridSize=${this.gridSize}`);
    }

    // Obtener información de debug
    getDebugInfo() {
        return {
            gameState: {
                isPaused: this.isPaused,
                isEditMode: this.isEditMode,
                gridSize: this.gridSize
            },
            snake: this.snake.getDebugInfo(),
            stats: this.stats.getDisplayStats(),
            upgrades: this.upgradeManager.getDebugInfo(),
            walls: this.wallManager.getInventoryStatus()
        };
    }

    // Seleccionar fruta objetivo para la IA: prioridad golden; si no hay, la más cercana por Manhattan
    chooseTargetFruit() {
        if (!this.fruits || this.fruits.length === 0) return { position: this.snake.getHead() }; // fallback
        const golden = this.fruits.find(f => f.type === 'golden');
        if (golden) return golden;
        const head = this.snake.getHead();
        let best = null; let bestDist = Infinity;
        for (const f of this.fruits) {
            const d = Math.abs(f.position.x - head.x) + Math.abs(f.position.y - head.y);
            if (d < bestDist) { bestDist = d; best = f; }
        }
        return best || this.fruits[0];
    }

    toggleTilePlacementMode() {
        if ((this.tileInventory.PC_MULT + this.tileInventory.SPEED) <= 0) {
            this.tilePlacementMode = false;
            this.updateUI();
            return;
        }
        this.tilePlacementMode = !this.tilePlacementMode;
        this.syncTileTypeRadios();
        this.updateUI();
    }

    placeOrRemoveTileEffect(x, y, remove = false) {
        // Política de remoción: el juego no descuenta $ al colocar baldosas; por lo tanto,
        // al remover (Shift+Click) devolvemos la baldosa completa al inventario y no hay reembolso de $.
        const existing = this.tileEffects.getEffect(x, y);
        if (remove) {
            if (!existing) return;
            if (this.tileEffects.removeEffect(x, y)) {
                // Devolución: recuperar al inventario 1 unidad del tipo removido
                if (existing === TILE_EFFECTS.PC_MULT) this.tileInventory.PC_MULT = (this.tileInventory.PC_MULT || 0) + 1;
                if (existing === TILE_EFFECTS.SPEED) this.tileInventory.SPEED = (this.tileInventory.SPEED || 0) + 1;
                this.updateUI();
            }
            return;
        }
        if (existing) return; // no sobrescribir
        if (this.tilePlacementType === TILE_EFFECTS.SPEED) {
            if (this.tileInventory.SPEED <= 0) return;
            if (this.tileEffects.setEffect(x, y, TILE_EFFECTS.SPEED)) {
                this.tileInventory.SPEED--;
            }
        } else {
            if (this.tileInventory.PC_MULT <= 0) return;
            if (this.tileEffects.setEffect(x, y, TILE_EFFECTS.PC_MULT)) {
                this.tileInventory.PC_MULT--;
            }
        }
        this.updateUI();
    }

    syncTileTypeRadios() {
        if (!this.tileTypeControls) return;
        if (this.tileInvText) this.tileInvText.textContent = `$ ${this.tileInventory.PC_MULT} | SPD ${this.tileInventory.SPEED}`;
        if (this.tileTypePcRadio) {
            this.tileTypePcRadio.disabled = this.tileInventory.PC_MULT <= 0;
            this.tileTypePcRadio.checked = (this.tilePlacementType === TILE_EFFECTS.PC_MULT);
        }
        if (this.tileTypeSpdRadio) {
            this.tileTypeSpdRadio.disabled = this.tileInventory.SPEED <= 0;
            this.tileTypeSpdRadio.checked = (this.tilePlacementType === TILE_EFFECTS.SPEED);
        }
    }

    syncGlyphTypeRadios() {
        if (!this.glyphTypeControls) return;
        const comboCount = this.stats.glyphInventory?.combo || 0;
        const consumerCount = this.stats.glyphInventory?.consumer || 0;
        
        if (this.glyphInvText) {
            this.glyphInvText.textContent = `🔮 ${comboCount} | ⚡ ${consumerCount}`;
        }
        if (this.glyphTypeComboRadio) {
            this.glyphTypeComboRadio.disabled = comboCount <= 0;
            this.glyphTypeComboRadio.checked = (this.selectedGlyphType === GLYPH_TYPES.COMBO);
        }
        if (this.glyphTypeConsumerRadio) {
            this.glyphTypeConsumerRadio.disabled = consumerCount <= 0;
            this.glyphTypeConsumerRadio.checked = (this.selectedGlyphType === GLYPH_TYPES.CONSUMER);
        }
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IdleSnakeGame };
}