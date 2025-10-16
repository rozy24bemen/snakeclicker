// snake.js - Clase Snake y mecánicas básicas del juego

class Snake {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.reset();
    }

    // Reiniciar la serpiente a su estado inicial
    reset() {
        const center = Math.floor(this.gridSize / 2);
        this.body = [
            { x: center, y: center },
            { x: center - 1, y: center },
            { x: center - 2, y: center }
        ];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.length = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        this.isAlive = true;
        this.boostActive = false;
        this.boostEndTime = 0;
        this.firstMoveDone = false;
    }

    // Mover la serpiente
    move() {
        if (!this.isAlive) return false;

        // Actualizar dirección
        this.direction = this.nextDirection;
        
        // Calcular nueva posición de la cabeza
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Agregar nueva cabeza
        this.body.unshift(newHead);

        // Si la serpiente no ha crecido, remover la cola
        if (this.body.length > this.length) {
            this.body.pop();
        }

        this.firstMoveDone = true;

        return true;
    }

    // Hacer crecer la serpiente
    grow() {
        this.length++;
    }

    // Verificar colisiones con paredes
    checkWallCollision() {
        const head = this.body[0];
        return head.x < 0 || head.x >= this.gridSize || 
               head.y < 0 || head.y >= this.gridSize;
    }

    // Verificar colisiones consigo misma
    checkSelfCollision() {
        const head = this.body[0];
        
        // Verificar colisión con el cuerpo (empezando desde la segunda posición)
        for (let i = 1; i < this.body.length; i++) {
            if (MathUtils.positionsEqual(head, this.body[i])) {
                return true;
            }
        }
        
        return false;
    }

    // Verificar si la cabeza está en una posición específica
    isHeadAt(position) {
        return MathUtils.positionsEqual(this.body[0], position);
    }

    // Obtener todas las posiciones ocupadas por la serpiente
    getOccupiedPositions() {
        return [...this.body];
    }

    // Verificar si una posición está ocupada por la serpiente
    isPositionOccupied(position) {
        return this.body.some(segment => MathUtils.positionsEqual(segment, position));
    }

    // Activar boost de velocidad
    activateBoost(duration = 3000) {
        this.boostActive = true;
        this.boostEndTime = Date.now() + duration;
    }

    // Verificar si el boost está activo
    isBoostActive() {
        if (this.boostActive && Date.now() > this.boostEndTime) {
            this.boostActive = false;
        }
        return this.boostActive;
    }

    // Actualizar el tamaño de la cuadrícula
    updateGridSize(newGridSize) {
        this.gridSize = newGridSize;
        
        // Verificar si la serpiente está fuera de los nuevos límites
        const head = this.body[0];
        if (head.x >= newGridSize || head.y >= newGridSize) {
            // Mover al centro si está fuera de los límites
            this.reset();
        }
    }

    // Obtener la cabeza de la serpiente
    getHead() {
        return this.body[0];
    }

    // Obtener la cola de la serpiente
    getTail() {
        return ArrayUtils.last(this.body);
    }

    // Cambiar dirección (con validación)
    setDirection(newDirection) {
        if (!newDirection) return;
        // Bloquear reversa inmediata: comparar componentes
        if (this.direction && (this.direction.x === -newDirection.x && this.direction.y === -newDirection.y)) {
            return; // ignorar intento de reversa
        }
        // Evitar primer movimiento directo contra pared si está en borde
        if (!this.firstMoveDone) {
            const head = this.body[0];
            const nx = head.x + newDirection.x;
            const ny = head.y + newDirection.y;
            if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) {
                // intenta girar a una alternativa segura (prioridad: DOWN, UP, RIGHT, LEFT)
                const alternatives = [DIRECTIONS.DOWN, DIRECTIONS.UP, DIRECTIONS.RIGHT, DIRECTIONS.LEFT];
                for (const alt of alternatives) {
                    if (alt === newDirection) continue;
                    const ax = head.x + alt.x, ay = head.y + alt.y;
                    if (ax >= 0 && ax < this.gridSize && ay >= 0 && ay < this.gridSize) {
                        this.nextDirection = alt;
                        return;
                    }
                }
                return; // si ninguna alternativa, mantener actual
            }
        }
        this.nextDirection = newDirection;
    }

    // Matar la serpiente
    kill() {
        this.isAlive = false;
    }

    // Verificar si la serpiente está viva
    isSnakeAlive() {
        return this.isAlive;
    }

    // Obtener información de la serpiente para debugging
    getDebugInfo() {
        return {
            position: this.getHead(),
            length: this.length,
            bodyLength: this.body.length,
            direction: this.direction,
            isAlive: this.isAlive,
            boostActive: this.isBoostActive()
        };
    }
}

class Fruit {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.position = { x: 0, y: 0 };
        this.type = 'normal'; // 'normal' | 'golden'
        this.generateNewPosition();
    }

    // Generar nueva posición para la fruta
    generateNewPosition(excludePositions = []) {
        this.position = MathUtils.getRandomPosition(this.gridSize, excludePositions);
    }

    // Asignar tipo (externo decidirá golden con probabilidad)
    setType(type) {
        this.type = type;
    }

    getColor() {
        if (this.type === 'golden') return '#FFD700';
        return GAME_CONFIG.COLORS.FRUIT;
    }

    getRewardBase(multiplier) {
        // Golden otorga bono plano además del multiplicador normal
        const bonus = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.ECONOMY) ? GAME_CONFIG.ECONOMY.GOLDEN_FRUIT_BONUS_PC : 50;
        return (multiplier) + (this.type === 'golden' ? bonus : 0);
    }

    // Verificar si la fruta está en una posición específica
    isAt(position) {
        return MathUtils.positionsEqual(this.position, position);
    }

    // Actualizar el tamaño de la cuadrícula
    updateGridSize(newGridSize, excludePositions = []) {
        this.gridSize = newGridSize;
        
        // Si la fruta está fuera de los nuevos límites, reposicionarla
        if (this.position.x >= newGridSize || this.position.y >= newGridSize) {
            this.generateNewPosition(excludePositions);
        }
    }

    // Verificar si la fruta necesita ser reposicionada por muros de repulsión
    checkRepulsionWalls(walls) {
        for (const wall of walls) {
            if (wall.type === WALL_TYPES.REPULSION) {
                for (const wallPos of wall.positions) {
                    const distance = MathUtils.manhattanDistance(this.position, wallPos);
                    if (distance <= 3) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Reposicionar la fruta lejos de muros de repulsión
    repositionAwayFromRepulsion(walls, excludePositions = []) {
        let attempts = 0;
        const maxAttempts = 100;

        do {
            this.generateNewPosition(excludePositions);
            attempts++;
        } while (this.checkRepulsionWalls(walls) && attempts < maxAttempts);
    }
}

class GameStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.money = 0; // PC → $
        this.currentLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        this.maxLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
        this.pureDNA = 0; // CM → ADN Puro
        this.totalFruitsEaten = 0;
        this.totalDeaths = 0;
        this.gameStartTime = Date.now();
        this.currentRunStartTime = Date.now();
        // Prestigio
        this.hasPrestiged = StorageUtils.load('hasPrestiged', false) || false;
        // Cestas (post-prestigio)
        this.basketInventory = this.hasPrestiged ? 1 : 0;
        this.basketMultiplier = this.hasPrestiged ? 2 : 1;
        
        // Glifos de ADN (Wall 2) - Inventario de glifos colocables
        this.glyphInventory = {
            combo: 0,      // Glifos de Resonancia disponibles
            consumer: 0    // Glifos Consumidores disponibles
        };
    }

    // Ganar dinero ($)
    addMoney(amount = 1) {
        this.money += amount;
    }

    // Gastar dinero ($)
    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            return true;
        }
        return false;
    }

    // Actualizar longitud actual
    updateCurrentLength(length) {
        this.currentLength = length;
        if (length > this.maxLength) {
            this.maxLength = length;
        }
    }

    // Comer una fruta
    eatFruit(multiplier = 1) {
        this.totalFruitsEaten++;
        this.addMoney(multiplier);
    }

    // Muerte de la serpiente
    snakeDeath() {
        this.totalDeaths++;
        this.currentRunStartTime = Date.now();
        // No reseteamos PC ni max length en muerte normal
    }

    // Verificar si se puede mutar (prestige)
    canMutate() {
        return this.maxLength >= 100;
    }

    // Realizar mutación
    performMutation() {
        if (this.canMutate()) {
            this.pureDNA++;
            this.money = 0;
            this.maxLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
            this.currentLength = GAME_CONFIG.INITIAL_SNAKE_LENGTH;
            return true;
        }
        return false;
    }

    // Añadir ADN Puro
    addPureDNA(amount) {
        this.pureDNA += amount;
    }

    // Gastar ADN Puro
    spendPureDNA(amount) {
        if (this.pureDNA >= amount) {
            this.pureDNA -= amount;
            return true;
        }
        return false;
    }

    // Añadir glifo al inventario
    addGlyph(type, amount = 1) {
        if (type === 'combo') {
            this.glyphInventory.combo = Math.min(10, this.glyphInventory.combo + amount);
        } else if (type === 'consumer') {
            this.glyphInventory.consumer = Math.min(10, this.glyphInventory.consumer + amount);
        }
    }

    // Usar glifo del inventario (cuando se coloca en el tablero)
    useGlyph(type, amount = 1) {
        if (type === 'combo' && this.glyphInventory.combo >= amount) {
            this.glyphInventory.combo -= amount;
            return true;
        } else if (type === 'consumer' && this.glyphInventory.consumer >= amount) {
            this.glyphInventory.consumer -= amount;
            return true;
        }
        return false;
    }

    // Verificar si hay glifos disponibles
    hasGlyph(type) {
        if (type === 'combo') return this.glyphInventory.combo > 0;
        if (type === 'consumer') return this.glyphInventory.consumer > 0;
        return false;
    }

    // Obtener tiempo de juego total
    getTotalPlayTime() {
        return Date.now() - this.gameStartTime;
    }

    // Obtener tiempo de la partida actual
    getCurrentRunTime() {
        return Date.now() - this.currentRunStartTime;
    }

    // Obtener estadísticas para mostrar
    getDisplayStats() {
        return {
            money: this.money,
            currentLength: this.currentLength,
            maxLength: this.maxLength,
            pureDNA: this.pureDNA,
            totalFruitsEaten: this.totalFruitsEaten,
            totalDeaths: this.totalDeaths,
            totalPlayTime: this.getTotalPlayTime(),
            currentRunTime: this.getCurrentRunTime()
        };
    }

    // Guardar estadísticas
    save() {
        const data = {
            money: this.money,
            maxLength: this.maxLength,
            pureDNA: this.pureDNA,
            totalFruitsEaten: this.totalFruitsEaten,
            totalDeaths: this.totalDeaths,
            gameStartTime: this.gameStartTime,
            hasPrestiged: this.hasPrestiged,
            basketInventory: this.basketInventory,
            basketMultiplier: this.basketMultiplier,
            glyphInventory: this.glyphInventory
        };
        StorageUtils.save('gameStats', data);
    }

    // Cargar estadísticas
    load() {
        const data = StorageUtils.load('gameStats');
        if (data) {
            this.money = data.money || data.growthPoints || 0; // Mantener compatibilidad con saves antiguos
            this.maxLength = data.maxLength || GAME_CONFIG.INITIAL_SNAKE_LENGTH;
            this.pureDNA = data.pureDNA || data.mutantCells || 0; // Mantener compatibilidad con saves antiguos
            this.totalFruitsEaten = data.totalFruitsEaten || 0;
            this.totalDeaths = data.totalDeaths || 0;
            this.gameStartTime = data.gameStartTime || Date.now();
            this.hasPrestiged = data.hasPrestiged || false;
            this.basketInventory = data.basketInventory ?? (this.hasPrestiged ? 1 : 0);
            this.basketMultiplier = data.basketMultiplier ?? (this.hasPrestiged ? 2 : 1);
            this.glyphInventory = data.glyphInventory || { combo: 0, consumer: 0 };
        } else {
            // Inicializar inventario de glifos si no hay datos guardados
            this.glyphInventory = { combo: 0, consumer: 0 };
        }
        this.currentRunStartTime = Date.now();
    }

    setHasPrestiged(v) { this.hasPrestiged = !!v; }
    getHasPrestiged() { return !!this.hasPrestiged; }
    addBasket(count=1) { this.basketInventory = Math.max(0, (this.basketInventory||0) + count); }
    useBasket() { if ((this.basketInventory||0) > 0) { this.basketInventory--; return true; } return false; }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Snake, Fruit, GameStats };
}