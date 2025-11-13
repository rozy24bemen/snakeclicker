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
    this.glyphTypeRedirectRadio = document.getElementById('glyph-type-redirect');
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
    this.miniHudRedirect = document.getElementById('mini-hud-redirect'); // Wall 3: dirección forzada
    this.miniHudRedirectSep = document.getElementById('mini-hud-redirect-sep');

        // Estado del juego
        this.isPaused = false;
    this.isEditMode = false;
    this.tilePlacementMode = false;
    this.basketPlacementMode = false;
    this.glyphPlacementMode = false;         // Nuevo: modo colocación glifos
    this.selectedGlyphType = GLYPH_TYPES.COMBO; // Tipo de glifo seleccionado
    
    // Wall 2: Glifos de Combo - Sistema Acumulativo
    this.currentComboMultiplier = 0.0;       // Multiplicador acumulado por serpiente en GLYPH_COMBO
    this.prestigeUnlockedShown = false;      // Control para mostrar popup de prestigio solo una vez
    this.tilePlacementType = (typeof TILE_EFFECTS !== 'undefined' && TILE_EFFECTS.PC_MULT) ? TILE_EFFECTS.PC_MULT : 'PC_MULT';
    this.tileInventory = { PC_MULT: 0, SPEED: 0 };
    this.gameLoopId = null;
    this.lastUpdateTime = 0;
    // Prestigio
    this.prestigeReady = false;

        // Texturas del tablero
        this.grassTextures = {
            grass1: null,
            grass2: null,
            loaded: false
        };

        // Sistema de sprites de serpiente
        this.snakeSprites = new SnakeSprites();

        // Inicializar sistemas del juego
        this.initializeGame();
        this.loadTextures();
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

    // Cargar texturas del tablero
    loadTextures() {
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        Promise.all([
            loadImage('assets/grass1.png'),
            loadImage('assets/grass2.png')
        ]).then(([grass1, grass2]) => {
            this.grassTextures.grass1 = grass1;
            this.grassTextures.grass2 = grass2;
            this.grassTextures.loaded = true;
            Logger.log('Texturas del tablero cargadas correctamente');
        }).catch((error) => {
            Logger.warn('Error cargando texturas del tablero:', error);
            this.grassTextures.loaded = false;
        });
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
                const totalGlyphs = (this.stats.glyphInventory?.combo || 0) + (this.stats.glyphInventory?.consumer || 0) + (this.stats.glyphInventory?.redirect || 0);
                if (totalGlyphs <= 0) return;
                this.glyphPlacementMode = !this.glyphPlacementMode;
                // Al activar, seleccionar el tipo según disponibilidad
                if (this.glyphPlacementMode) {
                    const comboCount = this.stats.glyphInventory?.combo || 0;
                    const consumerCount = this.stats.glyphInventory?.consumer || 0;
                    const redirectCount = this.stats.glyphInventory?.redirect || 0;
                    
                    // Si el tipo seleccionado no está disponible, buscar uno disponible
                    if (this.selectedGlyphType === GLYPH_TYPES.COMBO && comboCount <= 0) {
                        if (consumerCount > 0) this.selectedGlyphType = GLYPH_TYPES.CONSUMER;
                        else if (redirectCount > 0) this.selectedGlyphType = GLYPH_TYPES.REDIRECT;
                    } else if (this.selectedGlyphType === GLYPH_TYPES.CONSUMER && consumerCount <= 0) {
                        if (comboCount > 0) this.selectedGlyphType = GLYPH_TYPES.COMBO;
                        else if (redirectCount > 0) this.selectedGlyphType = GLYPH_TYPES.REDIRECT;
                    } else if (this.selectedGlyphType === GLYPH_TYPES.REDIRECT && redirectCount <= 0) {
                        if (comboCount > 0) this.selectedGlyphType = GLYPH_TYPES.COMBO;
                        else if (consumerCount > 0) this.selectedGlyphType = GLYPH_TYPES.CONSUMER;
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
        if (this.glyphTypeRedirectRadio) {
            this.glyphTypeRedirectRadio.addEventListener('change', () => {
                if (this.glyphTypeRedirectRadio.checked) this.selectedGlyphType = GLYPH_TYPES.REDIRECT;
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
                const glyphType = this.glyphMap.getGlyphType(x, y);
                if (glyphType) {
                    this.glyphMap.removeGlyph(x, y);
                    if (glyphType === GLYPH_TYPES.COMBO) {
                        this.stats.addGlyph('combo', 1);
                    } else if (glyphType === GLYPH_TYPES.CONSUMER) {
                        this.stats.addGlyph('consumer', 1);
                    } else if (glyphType === GLYPH_TYPES.REDIRECT) {
                        this.stats.addGlyph('redirect', 1);
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
                                   (this.selectedGlyphType === GLYPH_TYPES.CONSUMER && (this.stats.glyphInventory?.consumer || 0) > 0) ||
                                   (this.selectedGlyphType === GLYPH_TYPES.REDIRECT && (this.stats.glyphInventory?.redirect || 0) > 0);
                
                if (hasInventory) {
                    // Caso especial: Glifo de Desvío requiere selección de dirección
                    if (this.selectedGlyphType === GLYPH_TYPES.REDIRECT) {
                        this.promptDirectionSelection(x, y);
                    } else {
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

        // Actualizar animación de sprites
        if (this.snakeSprites) {
            this.snakeSprites.update(deltaTime);
        }

        this.render();
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Actualizar lógica del juego
    update() {
        if (!this.snake.isSnakeAlive()) return;

        // Wall 3: Verificar Glifo de Desvío (anula la IA)
        let finalDirection = null;
        const head = this.snake.getHead();
        if (head && this.glyphMap) {
            const redirectDirection = this.checkRedirectGlyphOverride(head.x, head.y);
            if (redirectDirection) {
                finalDirection = redirectDirection;
                // Logger.log(`🔄 Glifo de Desvío anulando IA - Dirección forzada: ${JSON.stringify(redirectDirection)}`);
            }
        }

        // Si no hay override de glifo, usar IA normal
        if (!finalDirection) {
            const targetFruit = this.chooseTargetFruit();
            const aiDirection = this.pathfindingAI.getNextDirection(
                this.snake,
                targetFruit,
                this.wallManager.walls,
                this.gridSize
            );
            finalDirection = aiDirection;
        }

        if (finalDirection) {
            this.snake.setDirection(finalDirection);
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
            const glyphType = this.glyphMap.getGlyphType(segment.x, segment.y);
            if (glyphType === GLYPH_TYPES.COMBO) {
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
        const glyphType = this.glyphMap.getGlyphType(head.x, head.y);
        if (glyphType === GLYPH_TYPES.CONSUMER) {
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
    }

    // Wall 3: Verificar si hay Glifo de Desvío que anule la IA
    checkRedirectGlyphOverride(x, y) {
        if (!this.glyphMap) return null;
        
        // Verificar si hay un glifo REDIRECT en la posición actual
        const glyphType = this.glyphMap.getGlyphType(x, y);
        if (glyphType === GLYPH_TYPES.REDIRECT) {
            // Obtener la dirección forzada del glifo
            const redirectDirection = this.glyphMap.getGlyphDirection(x, y);
            if (redirectDirection) {
                return redirectDirection;
            }
        }
        
        return null; // No hay override de dirección
    }

    // Wall 3: Convertir dirección en nombre legible para UI
    getDirectionName(direction) {
        if (!direction) return 'Ninguno';
        
        if (direction.x === 0 && direction.y === -1) return 'Norte ⬆️';
        if (direction.x === 0 && direction.y === 1) return 'Sur ⬇️';
        if (direction.x === 1 && direction.y === 0) return 'Este ➡️';
        if (direction.x === -1 && direction.y === 0) return 'Oeste ⬅️';
        
        return 'Desconocido';
    }

    // Wall 3: Renderizar flecha de dirección forzada sobre la cabeza
    renderRedirectArrow(head, direction) {
        const canvasPos = CanvasUtils.getCanvasFromCell(
            head.x,
            head.y,
            GAME_CONFIG.CELL_SIZE
        );
        
        const centerX = canvasPos.x + GAME_CONFIG.CELL_SIZE / 2;
        const centerY = canvasPos.y + GAME_CONFIG.CELL_SIZE / 2;
        
        // Animación sutil con pulsación
        const time = Date.now() / 1000;
        const pulse = 0.8 + 0.2 * Math.sin(time * 4); // pulsación entre 0.8 y 1.0
        const arrowSize = 12 * pulse;
        const glow = (Math.sin(time * 3.2) * 0.5 + 0.5);
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Calcular ángulo de rotación según dirección
        let angle = 0;
        if (direction.x === 0 && direction.y === -1) angle = -Math.PI / 2; // Norte
        else if (direction.x === 0 && direction.y === 1) angle = Math.PI / 2; // Sur  
        else if (direction.x === 1 && direction.y === 0) angle = 0; // Este
        else if (direction.x === -1 && direction.y === 0) angle = Math.PI; // Oeste
        
        this.ctx.rotate(angle);
        
        // Glow radial ligero
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        const grad = this.ctx.createRadialGradient(0,0,arrowSize*0.3,0,0,arrowSize*1.6);
        grad.addColorStop(0, `rgba(255,120,50,${0.45 + glow*0.25})`);
        grad.addColorStop(1, 'rgba(200,50,0,0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0,0,arrowSize*1.6,0,Math.PI*2);
        this.ctx.fill();
        this.ctx.restore();

        // Dibujar flecha direccional
        this.ctx.fillStyle = '#FF6A2A';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowSize, 0);
        this.ctx.lineTo(-arrowSize*0.55, -arrowSize*0.55);
        this.ctx.lineTo(-arrowSize*0.25, 0);
        this.ctx.lineTo(-arrowSize*0.55, arrowSize*0.55);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
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

    // Mostrar número flotante al comer fruta
    showFloatingNumber(amount, position) {
        // Crear elemento de número flotante
        const floatingNumber = document.createElement('div');
        floatingNumber.className = 'floating-number';
        floatingNumber.textContent = `+${FormatUtils.formatNumber(amount)}$`;
        
        // Calcular posición en pantalla basada en posición del grid
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const cellSize = Math.min(rect.width / this.gridSize, rect.height / this.gridSize);
        
        const screenX = rect.left + (position.x * cellSize) + (cellSize / 2);
        const screenY = rect.top + (position.y * cellSize) + (cellSize / 2);
        
        floatingNumber.style.left = screenX + 'px';
        floatingNumber.style.top = screenY + 'px';
        
        // Agregar al DOM
        document.body.appendChild(floatingNumber);
        
        // Animar y remover después de la animación
        setTimeout(() => {
            if (floatingNumber.parentNode) {
                floatingNumber.parentNode.removeChild(floatingNumber);
            }
        }, 2000); // Duración de la animación CSS
    }

    // Mostrar notificación de prestigio desbloqueado
    showPrestigeUnlockedNotification() {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'prestige-unlock-notification';
        notification.innerHTML = `
            <div class="prestige-unlock-content">
                <span class="prestige-unlock-icon">🏆</span>
                <span class="prestige-unlock-title">¡PRESTIGIO DESBLOQUEADO!</span>
                <span class="prestige-unlock-description">Ahora puedes acceder a mejoras avanzadas</span>
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Animar y remover después de 4 segundos
        setTimeout(() => {
            notification.classList.add('prestige-unlock-fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3500);
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
        
        // Wall 3: Manzana Oscura - recompensa masiva base 
        if (fruit.type === 'dark') {
            // Sobrescriba todo cálculo anterior con recompensa masiva base
            reward = fruit.getRewardBase(baseMult);
        }
        
        // Wall 2: Aplicar multiplicador acumulativo de glifos COMBO
        if (this.currentComboMultiplier > 0) {
            const comboBonus = 1 + this.currentComboMultiplier;
            reward = Math.floor(reward * comboBonus);
        }
        
        this.stats.eatFruit(reward);
        
        // Wall 3: Otorgar ADN Puro si es manzana oscura
        if (fruit.type === 'dark') {
            const dnaReward = fruit.getDNAReward();
            if (dnaReward > 0) {
                this.stats.addPureDNA(dnaReward);
                Logger.log(`🍎 MANZANA OSCURA: +${dnaReward} ADN Puro otorgado!`);
                // Shockwave visual: registrar animación
                this.triggerDarkFruitShockwave(fruit.position);
            }
        }
        
        // Mostrar animación de números flotantes
        this.showFloatingNumber(reward, pos);
        
        if (fruit.type === 'golden') Logger.log('Golden Apple consumida');
        if (fruit.type === 'dark') Logger.log('🍎 MANZANA OSCURA CONSUMIDA - Recompensa masiva aplicada!');
        Logger.log(`Fruta comida (${fruit.type}). $ ganados: ${reward}`);
    }

    // Shockwave procedimental tras consumir Manzana Oscura
    triggerDarkFruitShockwave(position) {
        if (!this.darkFruitShockwaves) this.darkFruitShockwaves = [];
        // Generar partículas únicas para este shockwave
        const particleCount = 28;
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                angle: (Math.PI * 2) * (i / particleCount) + Math.random() * 0.25,
                maxDist: (this.gridSize * GAME_CONFIG.CELL_SIZE * 0.35) + Math.random() * 40,
                size: 3 + Math.random() * 2,
                lifespan: 450 + Math.random() * 250
            });
        }
        this.darkFruitShockwaves.push({
            x: position.x,
            y: position.y,
            start: Date.now(),
            particles
        });
    }

    renderDarkFruitShockwaves() {
        if (!this.darkFruitShockwaves || this.darkFruitShockwaves.length === 0) return;
        const now = Date.now();
        const cell = GAME_CONFIG.CELL_SIZE;
        const duration = 1000; // ms
        this.darkFruitShockwaves = this.darkFruitShockwaves.filter(sw => now - sw.start < duration);
        this.darkFruitShockwaves.forEach(sw => {
            const t = (now - sw.start) / duration; // 0..1
            const ease = AnimationUtils.easeOut(t);
            const maxR = this.gridSize * cell * 0.95; // cubrir casi todo tablero
            const radius = ease * maxR;
            const baseAlpha = (1 - t) * 0.35; // desvanecer
            const cx = sw.x * cell + cell / 2;
            const cy = sw.y * cell + cell / 2;

            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';

            // Disco suave base
            const grad = this.ctx.createRadialGradient(cx, cy, radius * 0.35, cx, cy, radius);
            grad.addColorStop(0, `rgba(170,90,255,${baseAlpha})`);
            grad.addColorStop(0.6, `rgba(120,40,200,${baseAlpha * 0.35})`);
            grad.addColorStop(1, 'rgba(80,20,140,0)');
            this.ctx.beginPath();
            this.ctx.fillStyle = grad;
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Anillos concéntricos (ripple rings)
            const rings = 3;
            for (let i = 1; i <= rings; i++) {
                const ringR = radius * (0.45 + i * 0.18);
                if (ringR <= 0) continue;
                this.ctx.lineWidth = 2 + (3 - i);
                this.ctx.strokeStyle = `rgba(190,120,255,${baseAlpha * (0.6 - i*0.15)})`;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Partículas (sparks) radiales
            if (sw.particles && sw.particles.length) {
                sw.particles.forEach(p => {
                    const pt = Math.min(1, (now - sw.start) / p.lifespan);
                    if (pt <= 0 || pt > 1) return;
                    const prog = AnimationUtils.easeOut(pt);
                    const px = cx + Math.cos(p.angle) * p.maxDist * prog;
                    const py = cy + Math.sin(p.angle) * p.maxDist * prog;
                    const palpha = (1 - pt) * 0.85;
                    this.ctx.fillStyle = `rgba(242,230,255,${palpha})`;
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, p.size * (1 - pt * 0.6), 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }

            this.ctx.restore();
        });
    }

    // Generar nueva fruta
    // Multi-frutas: asegurar población acorde a cultivo
    ensureFruitPopulation() {
        const cultivo = this.upgradeManager.getUpgrade('cultivo');
        const extra = cultivo ? cultivo.currentLevel : 0;
        const desired = 1 + extra; // base 1
        
        // FIX: Mejorar lógica de múltiples frutas
        let totalAttempts = 0;
        const maxTotalAttempts = desired * 10; // 10 intentos por fruta deseada
        
        while (this.fruits.length < desired && totalAttempts < maxTotalAttempts) {
            const fruit = this.createFruit();
            if (fruit) {
                this.fruits.push(fruit);
                Logger.log(`Fruta ${this.fruits.length}/${desired} generada exitosamente`);
            } else {
                // Si no se pudo crear fruta, intentar fruta forzada
                Logger.warn(`Intento ${totalAttempts + 1}: createFruit() falló, intentando fruta forzada...`);
                const forcedFruit = this.createForcedFruit();
                if (forcedFruit) {
                    this.fruits.push(forcedFruit);
                    Logger.log(`Fruta forzada ${this.fruits.length}/${desired} generada exitosamente`);
                } else {
                    Logger.warn(`No se pudo generar ni fruta normal ni forzada en intento ${totalAttempts + 1}`);
                }
            }
            totalAttempts++;
        }
        
        // Log del resultado final
        const achieved = this.fruits.length;
        if (achieved < desired) {
            Logger.warn(`Solo se pudieron generar ${achieved}/${desired} frutas tras ${totalAttempts} intentos`);
            
            // Si no se pudo generar ninguna fruta, verificar overflow
            if (achieved === 0) {
                Logger.error('No se pudo generar ninguna fruta. Verificando overflow del tablero...');
                this.handleGridOverflow();
            }
        } else {
            Logger.log(`Población de frutas completa: ${achieved}/${desired} frutas generadas`);
        }
    }

    createFruit() {
        // FIX: Aumentar límite y calcular dinámicamente según tamaño del grid
        const maxAttempts = Math.max(100, this.gridSize * 10);
        let attempts = 0; 
        
        Logger.log(`[createFruit] Intentando crear fruta. Máximo ${maxAttempts} intentos`);
        
        while (attempts < maxAttempts) {
            const f = new Fruit(this.gridSize);
            
            // FIX: Verificar si la fruta se creó con posición válida
            if (!f.valid) {
                attempts++;
                Logger.warn(`[createFruit] Intento ${attempts}: Fruit constructor falló (f.valid=false)`);
                continue; // La fruta no se pudo posicionar, tablero lleno
            }
            
            // Doradas solo tras prestigio
            if (this.stats.getHasPrestiged()) {
                const goldenChance = this.upgradeManager.getCurrentGoldenChance();
                if (Math.random() < goldenChance) f.setType('golden');
            }
            
            // Wall 3: Manzanas Oscuras solo si están desbloqueadas
            if (this.stats.darkFruitUnlocked && this.stats.getHasPrestiged()) {
                const darkChance = GAME_CONFIG.ECONOMY?.DARK_FRUIT_CHANCE_BASE ?? 0.005;
                if (Math.random() < darkChance) {
                    f.setType('dark');
                    Logger.log('🍎 ¡MANZANA OSCURA GENERADA! La IA será obsesionada...');
                }
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
                // FIX: Verificar si se pudo generar posición válida
                if (!f.generateNewPosition(exclude)) {
                    attempts++;
                    continue; // No se pudo generar posición, tablero muy lleno
                }
            }
            // Validar repulsión
            if (!this.wallManager.checkFruitRepulsion || !this.wallManager.checkFruitRepulsion(f)) {
                Logger.log(`[createFruit] Fruta creada exitosamente en intento ${attempts + 1}`);
                return f;
            }
            attempts++;
        }
        Logger.warn(`[createFruit] No se pudo generar nueva fruta tras ${maxAttempts} intentos`);
        return null;
    }

    // FIX: Manejar overflow del grid (tablero demasiado lleno)
    handleGridOverflow() {
        Logger.log('Manejando overflow del grid - tablero muy lleno');
        
        // Calcular espacio disponible
        const totalCells = this.gridSize * this.gridSize;
        const occupiedCells = this.snake.body.length + 
                             this.wallManager.getAllWallPositions().length + 
                             this.fruits.length;
        const freeSpaceRatio = (totalCells - occupiedCells) / totalCells;
        
        Logger.log(`Espacio libre: ${(freeSpaceRatio * 100).toFixed(1)}% (${totalCells - occupiedCells}/${totalCells} celdas)`);
        
        // Si queda menos del 5% de espacio libre, forzar reinicio de run
        if (freeSpaceRatio < 0.05) {
            Logger.warn('Menos del 5% de espacio libre. Forzando reinicio automático...');
            setTimeout(() => {
                this.restartRun();
            }, 1000);
        } else {
            // Intentar crear una fruta en cualquier lugar libre (sin sesgos)
            const forcedFruit = this.createForcedFruit();
            if (forcedFruit) {
                this.fruits.push(forcedFruit);
                Logger.log('Fruta forzada creada exitosamente');
            }
        }
    }

    // Crear fruta forzada en cualquier posición libre disponible
    createForcedFruit() {
        const exclude = [
            ...this.snake.getOccupiedPositions(),
            ...this.wallManager.getAllWallPositions(),
            ...this.fruits?.map(fr => fr.position) || []
        ];
        
        // Buscar todas las posiciones libres
        const freePositions = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (!exclude.some(pos => pos.x === x && pos.y === y)) {
                    freePositions.push({ x, y });
                }
            }
        }
        
        if (freePositions.length === 0) {
            Logger.error('No hay posiciones libres disponibles!');
            return null;
        }
        
        // Crear fruta en posición aleatoria libre
        const randomPos = freePositions[Math.floor(Math.random() * freePositions.length)];
        const fruit = new Fruit(this.gridSize);
        
        // Forzar la posición específica y marcar como válida
        fruit.position = randomPos;
        fruit.valid = true; // Forzar validez ya que sabemos que la posición es libre
        
        Logger.log(`Fruta forzada creada en (${randomPos.x}, ${randomPos.y})`);
        return fruit;
    }

    // Renderizar el juego
    render() {
        // Limpiar canvas
        CanvasUtils.clear(this.ctx, this.canvas.width, this.canvas.height);
        
        // Dibujar fondo de tablero de ajedrez con texturas
        this.renderChessboardBackground();
        
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

    // Shockwaves de Manzana Oscura (sobre todo)
    this.renderDarkFruitShockwaves();
        
        // Dibujar overlay para modo edición
        if (this.isEditMode) {
            this.renderEditModeOverlay();
        }

        // Actualizar y posicionar Mini-HUD cerca de la cabeza
        this.updateMiniHUDPositionAndValues();
    }

    // Renderizar fondo de tablero uniforme con grass1
    renderChessboardBackground() {
        if (this.grassTextures.loaded) {
            // Usar solo grass1 para todo el tablero
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const canvasPos = CanvasUtils.getCanvasFromCell(x, y, GAME_CONFIG.CELL_SIZE);
                    
                    // Solo grass1 para todo el tablero
                    this.ctx.drawImage(
                        this.grassTextures.grass1,
                        canvasPos.x,
                        canvasPos.y,
                        GAME_CONFIG.CELL_SIZE,
                        GAME_CONFIG.CELL_SIZE
                    );
                }
            }
        } else {
            // Fallback: color verde uniforme si las texturas no están cargadas
            this.ctx.fillStyle = '#4CAF50'; // Verde uniforme
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
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
        const time = Date.now() * 0.001;
        this.fruits.forEach(fruit => {
            const { x, y } = fruit.position;
            const cellSize = GAME_CONFIG.CELL_SIZE;
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;
            const baseR = cellSize * 0.42;

            // Pulsación para golden y dark
            let pulse = 0;
            if (fruit.type === 'golden') pulse = Math.sin(time * 3.5) * 0.08;
            if (fruit.type === 'dark') pulse = Math.sin(time * 2.2) * 0.12;
            const radius = baseR * (1 + pulse);

            // Color base
            let color = fruit.getColor();
            if (fruit.type === 'dark') {
                // Ajustar tono dinámicamente (levísimo shift para sentir energía)
                const rgb = ColorUtils.hexToRgb(color);
                if (rgb) {
                    const hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
                    color = ColorUtils.hslToHex((hsl.h + Math.sin(time * 0.5) * 10), hsl.s, hsl.l);
                }
            }

            // Gradiente interno de fruta
            const grad = this.ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, radius*0.2, cx, cy, radius);
            grad.addColorStop(0, ColorUtils.adjustL(color, 0.12));
            grad.addColorStop(0.6, color);
            grad.addColorStop(1, ColorUtils.adjustL(color, -0.15));

            // Aura para dark fruit (Dictador): pulso + deformación leve
            if (fruit.type === 'dark') {
                const auraR = radius * 1.55;
                const auraAlpha = 0.18 + 0.07 * (Math.sin(time * 2) * 0.5 + 0.5);
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                const auraGrad = this.ctx.createRadialGradient(cx, cy, radius*0.6, cx, cy, auraR);
                auraGrad.addColorStop(0, `rgba(130,50,180,${auraAlpha})`);
                auraGrad.addColorStop(1, 'rgba(80,20,120,0)');
                this.ctx.fillStyle = auraGrad;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, auraR, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.restore();
            }

            // Fruta principal
            this.ctx.save();
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Borde
            this.ctx.lineWidth = fruit.type === 'golden' ? 2.2 : 1.4;
            this.ctx.strokeStyle = fruit.type === 'golden' ? '#FFFFFF' : '#222';
            if (fruit.type === 'dark') this.ctx.strokeStyle = '#AA66EE';
            this.ctx.stroke();

            // Símbolos
            if (fruit.type === 'golden') {
                this.ctx.fillStyle = '#1A1A1A';
                this.ctx.font = `${cellSize*0.42}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('$', cx, cy + 1);
            } else if (fruit.type === 'dark') {
                // Símbolo ADN Puro (◆ estilizado)
                this.ctx.fillStyle = '#F2E6FF';
                this.ctx.font = `${cellSize*0.38}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('◆', cx, cy + 1);
            }
            this.ctx.restore();
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

    // Renderizar serpiente (procedural, sin sprites)
    renderSnake() {
        this.renderSnakeProcedural();

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

        // Wall 3: Efecto visual para Glifo de Desvío activo
        const head = this.snake.getHead();
        if (head && this.glyphMap) {
            const redirectDirection = this.checkRedirectGlyphOverride(head.x, head.y);
            if (redirectDirection) {
                this.renderRedirectArrow(head, redirectDirection);
            }
        }
    }

    // Procedural: renderizado continuo estilo "tubo" con grosor decreciente y esquinas dinámicas
    renderSnakeProcedural() {
        const baseH = PROC_VISUAL_CONFIG.SNAKE_BASE_H;
        const baseS = PROC_VISUAL_CONFIG.SNAKE_BASE_S;
        const baseL = PROC_VISUAL_CONFIG.SNAKE_BASE_L;
        const cell = GAME_CONFIG.CELL_SIZE;

        const body = this.snake.body;
        if (!body || body.length === 0) return;

        // Glow Combo: activar al pasar sobre glifo COMBO
        const headCell = this.snake.getHead();
        if (headCell && this.glyphMap && this.glyphMap.hasGlyphType(headCell.x, headCell.y, GLYPH_TYPES.COMBO)) {
            this.comboGlowUntil = Date.now() + PROC_VISUAL_CONFIG.GLOW_DURATION_MS;
        }
        const glowActive = this.comboGlowUntil && Date.now() < this.comboGlowUntil;

        // Convertir a coordenadas de canvas y preparar radios y colores por índice
        const points = body.map(seg => ({ x: seg.x * cell + cell / 2, y: seg.y * cell + cell / 2 }));
        const lastIndex = body.length - 1;
        // Taper dinámico: colas menos pequeñas en serpientes cortas; mayor afinado a medida que crece
        const lenFactor = Math.min(1, Math.max(0, (body.length - 4) / 16)); // 0 -> corta, 1 -> larga (>=20)
        const BASE_DECAY_SMALL = 0.42;      // afinado total cuando es corta (ligeramente menor)
        const BASE_MINR_SMALL  = 0.32;      // cola más gruesa al inicio
        const decayTotalDyn = BASE_DECAY_SMALL + (PROC_VISUAL_CONFIG.SIZE_DECAY_TOTAL - BASE_DECAY_SMALL) * lenFactor;
        const minRatioDyn   = BASE_MINR_SMALL + (PROC_VISUAL_CONFIG.MIN_SIZE_RATIO - BASE_MINR_SMALL) * lenFactor;

        const radii = body.map((_, i) => {
            const t = lastIndex === 0 ? 0 : (i / lastIndex); // 0 cabeza -> 1 cola
            const scale = 1 - decayTotalDyn * t;
            return (cell * 0.50) * Math.max(scale, minRatioDyn);
        });
        const colors = body.map((_, i) => {
            const t = lastIndex === 0 ? 0 : (i / lastIndex);
            // Oscurecer progresivamente hasta TAIL_DARKEN, pero con ajuste por tamaño:
            // - serpiente corta: cola más clara (menos darken)
            // - serpiente larga: cola más oscura (más darken)
            const effectiveTailDarken = PROC_VISUAL_CONFIG.TAIL_DARKEN * (0.55 + 0.45 * lenFactor);
            let l = baseL - effectiveTailDarken * t;
            l = Math.max(0.12, l);
            const glowBoost = glowActive && i < 3 ? PROC_VISUAL_CONFIG.GLOW_EXTRA_L * (1 - i / 3) : 0;
            return ColorUtils.hslToHex(baseH, baseS, Math.min(1, l + glowBoost));
        });

        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Construir un único polígono con offsets y uniones redondeadas (arcos)
        const left = [];
        const right = [];
        const lastIdx = points.length - 1;
        const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };
        const ang = (v) => Math.atan2(v.y, v.x);
        const addArc = (arr, c, r, a0, a1) => {
            // elegir delta más corto y muestrear cada ~12°
            let d = a1 - a0;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            const steps = Math.max(2, Math.ceil(Math.abs(d) / (Math.PI / 24))); // ~7.5°: un poco más redondeado
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const a = a0 + d * t;
                arr.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
            }
        };

        for (let i = 0; i <= lastIdx; i++) {
            const pi = points[i];
            const ri = radii[i];

            if (i === 0) {
                const d1 = norm(points[1].x - pi.x, points[1].y - pi.y);
                const n = { x: -d1.y, y: d1.x };
                const a = ang(n);
                left.push({ x: pi.x + n.x * ri, y: pi.y + n.y * ri });
                right.push({ x: pi.x - n.x * ri, y: pi.y - n.y * ri });
            } else if (i === lastIdx) {
                const d0 = norm(pi.x - points[i - 1].x, pi.y - points[i - 1].y);
                const n = { x: -d0.y, y: d0.x };
                left.push({ x: pi.x + n.x * ri, y: pi.y + n.y * ri });
                right.push({ x: pi.x - n.x * ri, y: pi.y - n.y * ri });
            } else {
                const pPrev = points[i - 1];
                const pNext = points[i + 1];
                const d0 = norm(pi.x - pPrev.x, pi.y - pPrev.y);
                const d1 = norm(pNext.x - pi.x, pNext.y - pi.y);
                const n0 = { x: -d0.y, y: d0.x };
                const n1 = { x: -d1.y, y: d1.x };

                const a0 = ang(n0);
                const a1 = ang(n1);
                // Arco para lado izquierdo (normales directas)
                addArc(left, pi, ri, a0, a1);
                // Arco para lado derecho (normales opuestas = +PI)
                addArc(right, pi, ri, a0 + Math.PI, a1 + Math.PI);
            }
        }

        // Rellenar cuerpo entero con gradiente cabeza→cola para continuidad de color
        const bodyGrad = ctx.createLinearGradient(points[0].x, points[0].y, points[lastIdx].x, points[lastIdx].y);
        bodyGrad.addColorStop(0, colors[0]);
        bodyGrad.addColorStop(1, colors[lastIdx]);
        ctx.fillStyle = bodyGrad;

        if (left.length > 1 && right.length > 1) {
            ctx.beginPath();
            ctx.moveTo(left[0].x, left[0].y);
            for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
            for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
            ctx.closePath();
            ctx.fill();
        }

        // Cap de cabeza (más brillante, grande)
        const headR = radii[0];
        const headHex = colors[0];
        const headGrad = ctx.createRadialGradient(points[0].x - headR * 0.2, points[0].y - headR * 0.2, headR * 0.15, points[0].x, points[0].y, headR);
        headGrad.addColorStop(0, ColorUtils.adjustL(headHex, 0.06));
        headGrad.addColorStop(0.7, headHex);
        headGrad.addColorStop(1, ColorUtils.adjustL(headHex, -0.08));
        if (glowActive) {
            ctx.shadowColor = ColorUtils.hslToHex(baseH, baseS, Math.min(1, baseL + 0.25));
            ctx.shadowBlur = 16;
        }
        ctx.beginPath();
        ctx.fillStyle = headGrad;
        ctx.arc(points[0].x, points[0].y, headR, 0, Math.PI * 2);
        ctx.fill();

        // Indicador direccional en la cabeza
        const dir = this.snake.getCurrentDirection();
        if (dir) {
            const tip = { x: points[0].x + dir.x * headR * 0.95, y: points[0].y + dir.y * headR * 0.95 };
            const side = { x: -dir.y, y: dir.x };
            ctx.fillStyle = ColorUtils.adjustL(headHex, 0.18);
            ctx.beginPath();
            ctx.moveTo(tip.x, tip.y);
            ctx.lineTo(points[0].x + side.x * headR * 0.48, points[0].y + side.y * headR * 0.48);
            ctx.lineTo(points[0].x - side.x * headR * 0.48, points[0].y - side.y * headR * 0.48);
            ctx.closePath();
            ctx.fill();
        }

        // Cap de cola (más pequeño y oscuro)
        const last = points.length - 1;
        const tailR = radii[last];
        const tailHex = colors[last];
        const tailGrad = ctx.createRadialGradient(points[last].x - tailR * 0.18, points[last].y - tailR * 0.18, tailR * 0.12, points[last].x, points[last].y, tailR);
        tailGrad.addColorStop(0, ColorUtils.adjustL(tailHex, 0.01));
        tailGrad.addColorStop(0.7, tailHex);
        tailGrad.addColorStop(1, ColorUtils.adjustL(tailHex, -0.10));
        ctx.beginPath();
        ctx.fillStyle = tailGrad;
        ctx.arc(points[last].x, points[last].y, tailR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Renderizado fallback para serpiente (sin sprites)
    renderSnakeFallback() {
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
        const prevComboDisplay = this._lastComboDisplayValue || 0;
        if (this.currentComboMultiplier > 0) {
            const totalComboMult = 1 + this.currentComboMultiplier;
            this.miniHudCombo.textContent = `x${totalComboMult.toFixed(1)} ◆`;
            this.miniHudCombo.style.display = 'inline';
            if (comboSep) comboSep.style.display = 'inline';
            // Bounce/glow si cambia valor
            if (totalComboMult !== prevComboDisplay) {
                this.triggerMiniHudComboPulse();
                this._lastComboDisplayValue = totalComboMult;
            }
        } else {
            this.miniHudCombo.style.display = 'none';
            if (comboSep) comboSep.style.display = 'none';
            this._lastComboDisplayValue = 0;
        }
    }

    

    // Wall 3: Mostrar dirección forzada próximo tick
    if (this.miniHudRedirect && this.miniHudRedirectSep) {
        const head = this.snake.getHead();
        if (head && this.glyphMap) {
            const redirectDirection = this.checkRedirectGlyphOverride(head.x, head.y);
            if (redirectDirection) {
                const dirName = this.getDirectionName(redirectDirection);
                this.miniHudRedirect.textContent = `🔄 ${dirName}`;
                // Color destacado estilo manzana oscura
                this.miniHudRedirect.style.color = '#AA66EE';
                this.miniHudRedirect.style.display = 'inline';
                this.miniHudRedirectSep.style.display = 'inline';
            } else {
                this.miniHudRedirect.style.display = 'none';
                this.miniHudRedirectSep.style.display = 'none';
            }
        } else {
            this.miniHudRedirect.style.display = 'none';
            this.miniHudRedirectSep.style.display = 'none';
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
            const wasHidden = prestigeSection.style.display === 'none';
            
            // Mostrar popup solo cuando se desbloquea por primera vez
            if (showPrestige && wasHidden && !this.stats.getHasPrestiged() && !this.prestigeUnlockedShown) {
                this.showPrestigeUnlockedNotification();
                this.prestigeUnlockedShown = true;
            }
            
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
        
        //FIX: Guardar gridSize para persistencia
        StorageUtils.save('gridSize', this.gridSize);
        
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
        
        // FIX: Cargar gridSize guardado o usar inicial por defecto
        this.gridSize = StorageUtils.load('gridSize', GAME_CONFIG.INITIAL_GRID_SIZE);
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

    // Seleccionar fruta objetivo para la IA: Wall 3 - MANZANA OSCURA es DICTADOR absoluto
    chooseTargetFruit() {
        if (!this.fruits || this.fruits.length === 0) return { position: this.snake.getHead() }; // fallback
        
        // Wall 3: 🍎 MANZANA OSCURA = PRIORIDAD ABSOLUTA (El Dictador)
        const darkApple = this.fruits.find(f => f.type === 'dark');
        if (darkApple) {
            Logger.log('🍎 IA FORZADA: Manzana Oscura detectada - PRIORIDAD ABSOLUTA activada');
            return darkApple;
        }
        
        // Prioridad normal: Dorada > Cercana
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
        const redirectCount = this.stats.glyphInventory?.redirect || 0;
        
        if (this.glyphInvText) {
            this.glyphInvText.textContent = `🔮 ${comboCount} | ⚡ ${consumerCount} | 🔄 ${redirectCount}`;
        }
        if (this.glyphTypeComboRadio) {
            this.glyphTypeComboRadio.disabled = comboCount <= 0;
            this.glyphTypeComboRadio.checked = (this.selectedGlyphType === GLYPH_TYPES.COMBO);
        }
        if (this.glyphTypeConsumerRadio) {
            this.glyphTypeConsumerRadio.disabled = consumerCount <= 0;
            this.glyphTypeConsumerRadio.checked = (this.selectedGlyphType === GLYPH_TYPES.CONSUMER);
        }
        if (this.glyphTypeRedirectRadio) {
            this.glyphTypeRedirectRadio.disabled = redirectCount <= 0;
            this.glyphTypeRedirectRadio.checked = (this.selectedGlyphType === GLYPH_TYPES.REDIRECT);
        }
    }

    // Prompts para selección de dirección al colocar Glifo de Desvío
    promptDirectionSelection(x, y) {
        const directions = [
            { key: 'N', name: 'Norte ⬆️', value: { x: 0, y: -1 } },
            { key: 'S', name: 'Sur ⬇️', value: { x: 0, y: 1 } },
            { key: 'E', name: 'Este ➡️', value: { x: 1, y: 0 } },
            { key: 'O', name: 'Oeste ⬅️', value: { x: -1, y: 0 } }
        ];
        
        let message = "🔄 Glifo de Desvío - Selecciona dirección forzada:\n\n";
        directions.forEach(dir => {
            message += `${dir.key} - ${dir.name}\n`;
        });
        message += "\nEscribe la letra (N, S, E, O):";
        
        const choice = prompt(message)?.toUpperCase().trim();
        const selectedDir = directions.find(d => d.key === choice);
        
        if (selectedDir) {
            // Colocar glifo con dirección
            this.glyphMap.setGlyph(x, y, GLYPH_TYPES.REDIRECT, selectedDir.value);
            this.stats.useGlyph('redirect', 1);
            this.updateUI();
            this.saveGameState();
            Logger.log(`🔄 Glifo de Desvío colocado en (${x},${y}) - Dirección: ${selectedDir.name}`);
        }
        // Si cancela o entrada inválida, no se coloca el glifo
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IdleSnakeGame };
}

// Definir método fuera de la clase para evitar conflictos de alcance en ediciones previas
if (typeof IdleSnakeGame !== 'undefined') {
    IdleSnakeGame.prototype.triggerMiniHudComboPulse = function () {
        if (!this.miniHudCombo) return;
        this.miniHudCombo.classList.remove('mini-hud-combo-pulse'); // reset
        void this.miniHudCombo.offsetWidth; // reflow para reiniciar animación
        this.miniHudCombo.classList.add('mini-hud-combo-pulse');
        setTimeout(() => {
            if (this.miniHudCombo) this.miniHudCombo.classList.remove('mini-hud-combo-pulse');
        }, 450);
    };
}