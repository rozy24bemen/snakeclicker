// walls.js - Sistema de muros estratégicos

class Wall {
    constructor(type, positions, id = null) {
        this.type = type;
        this.positions = positions || [];
        this.id = id || this.generateId();
        this.isActive = true;
    }

    generateId() {
        return 'wall_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Verificar si el muro está en una posición específica
    isAt(position) {
        return this.positions.some(pos => MathUtils.positionsEqual(pos, position));
    }

    // Agregar posición al muro
    addPosition(position) {
        if (!this.isAt(position)) {
            this.positions.push(MathUtils.clonePosition(position));
        }
    }

    // Remover posición del muro
    removePosition(position) {
        this.positions = this.positions.filter(pos => 
            !MathUtils.positionsEqual(pos, position)
        );
    }

    // Obtener color del muro
    getColor() {
        switch (this.type) {
            case WALL_TYPES.PORTAL:
                return this.positions.length === 1 ? 
                       GAME_CONFIG.COLORS.PORTAL_A : 
                       GAME_CONFIG.COLORS.PORTAL_B;
            case WALL_TYPES.REPULSION:
                return GAME_CONFIG.COLORS.REPULSION_WALL;
            case WALL_TYPES.BOOST:
                return GAME_CONFIG.COLORS.BOOST_WALL;
            default:
                return GAME_CONFIG.COLORS.WALL;
        }
    }

    // Verificar si el muro está completo (para portales)
    isComplete() {
        switch (this.type) {
            case WALL_TYPES.PORTAL:
                return this.positions.length === 2;
            default:
                return this.positions.length > 0;
        }
    }

    // Clonar el muro
    clone() {
        return new Wall(this.type, [...this.positions], this.id);
    }
}

class PortalWall extends Wall {
    constructor(positions, id) {
        super(WALL_TYPES.PORTAL, positions, id);
    }

    // Obtener el portal de salida para una posición de entrada
    getExitPortal(entryPosition) {
        if (this.positions.length !== 2) return null;
        
        if (MathUtils.positionsEqual(entryPosition, this.positions[0])) {
            return this.positions[1];
        } else if (MathUtils.positionsEqual(entryPosition, this.positions[1])) {
            return this.positions[0];
        }
        
        return null;
    }

    // Verificar si una posición es un portal de entrada
    isEntryPortal(position) {
        return this.isAt(position);
    }
}

class RepulsionWall extends Wall {
    constructor(positions, id, repulsionRadius = 3) {
        super(WALL_TYPES.REPULSION, positions, id);
        this.repulsionRadius = repulsionRadius;
    }

    // Verificar si una posición está dentro del radio de repulsión
    isInRepulsionRadius(position) {
        return this.positions.some(wallPos => {
            const distance = MathUtils.manhattanDistance(position, wallPos);
            return distance <= this.repulsionRadius;
        });
    }
}

class BoostWall extends Wall {
    constructor(positions, id, boostDuration = 3000) {
        super(WALL_TYPES.BOOST, positions, id);
        this.boostDuration = boostDuration;
    }
}

class WallManager {
    constructor() {
        this.walls = [];
        this.wallInventory = new Map();
        this.placementMode = null;
        this.currentWallBeingPlaced = null;
        this.initializeInventory();
    }

    // Inicializar inventario de muros
    initializeInventory() {
        this.wallInventory.set(WALL_TYPES.PORTAL, 0);
        this.wallInventory.set(WALL_TYPES.REPULSION, 0);
        this.wallInventory.set(WALL_TYPES.BOOST, 0);
    }

    // Agregar muro al inventario
    addToInventory(wallType, quantity = 1) {
        const current = this.wallInventory.get(wallType) || 0;
        this.wallInventory.set(wallType, current + quantity);
        Logger.log(`Agregado ${quantity} ${wallType} al inventario. Total: ${current + quantity}`);
    }

    // Usar muro del inventario
    useFromInventory(wallType, quantity = 1) {
        const current = this.wallInventory.get(wallType) || 0;
        if (current >= quantity) {
            this.wallInventory.set(wallType, current - quantity);
            return true;
        }
        return false;
    }

    // Verificar disponibilidad en inventario
    hasInInventory(wallType, quantity = 1) {
        const current = this.wallInventory.get(wallType) || 0;
        return current >= quantity;
    }

    // Iniciar modo de colocación
    startPlacement(wallType) {
        if (!this.hasInInventory(wallType, 1)) {
            Logger.warn(`No hay ${wallType} disponibles en el inventario`);
            return false;
        }

        this.placementMode = wallType;
        this.currentWallBeingPlaced = this.createWall(wallType, []);
        Logger.log(`Iniciando colocación de ${wallType}`);
        return true;
    }

    // Cancelar colocación actual
    cancelPlacement() {
        this.placementMode = null;
        this.currentWallBeingPlaced = null;
        Logger.log('Colocación cancelada');
    }

    // Colocar parte del muro en una posición
    placePart(position, snake, fruit) {
        if (!this.placementMode || !this.currentWallBeingPlaced) {
            return false;
        }

        // Verificar que la posición esté libre
        if (this.isPositionOccupied(position) || 
            snake.isPositionOccupied(position) || 
            fruit.isAt(position)) {
            Logger.warn('La posición está ocupada');
            return false;
        }

        this.currentWallBeingPlaced.addPosition(position);
        Logger.log(`Parte del muro colocada en (${position.x}, ${position.y})`);

        // Verificar si el muro está completo
        if (this.currentWallBeingPlaced.isComplete()) {
            return this.finalizePlacement();
        }

        return true;
    }

    // Finalizar colocación del muro
    finalizePlacement() {
        if (!this.currentWallBeingPlaced || !this.currentWallBeingPlaced.isComplete()) {
            return false;
        }

        // Usar el muro del inventario
        this.useFromInventory(this.placementMode, 1);
        
        // Agregar el muro a la lista
        this.walls.push(this.currentWallBeingPlaced);
        
        Logger.log(`Muro ${this.currentWallBeingPlaced.type} colocado exitosamente`);
        
        // Limpiar modo de colocación
        this.placementMode = null;
        this.currentWallBeingPlaced = null;
        
        return true;
    }

    // Crear instancia de muro según el tipo
    createWall(type, positions, id) {
        switch (type) {
            case WALL_TYPES.PORTAL:
                return new PortalWall(positions, id);
            case WALL_TYPES.REPULSION:
                return new RepulsionWall(positions, id);
            case WALL_TYPES.BOOST:
                return new BoostWall(positions, id);
            default:
                return new Wall(type, positions, id);
        }
    }

    // Verificar si una posición está ocupada por algún muro
    isPositionOccupied(position) {
        return this.walls.some(wall => wall.isAt(position));
    }

    // Obtener muro en una posición específica
    getWallAt(position) {
        return this.walls.find(wall => wall.isAt(position));
    }

    // Remover muro
    removeWall(wallId) {
        const wallIndex = this.walls.findIndex(wall => wall.id === wallId);
        if (wallIndex !== -1) {
            const removedWall = this.walls.splice(wallIndex, 1)[0];
            // Devolver al inventario
            this.addToInventory(removedWall.type, 1);
            Logger.log(`Muro ${removedWall.type} removido y devuelto al inventario`);
            return true;
        }
        return false;
    }

    // Procesar interacción de la serpiente con muros
    processSnakeWallInteraction(snake) {
        const head = snake.getHead();
        const wallAtHead = this.getWallAt(head);
        
        if (!wallAtHead) return null;

        switch (wallAtHead.type) {
            case WALL_TYPES.PORTAL:
                return this.processPortalInteraction(snake, wallAtHead);
            case WALL_TYPES.BOOST:
                return this.processBoostInteraction(snake, wallAtHead);
            default:
                return null;
        }
    }

    // Procesar interacción con portal
    processPortalInteraction(snake, portal) {
        const head = snake.getHead();
        const exitPosition = portal.getExitPortal(head);
        
        if (exitPosition) {
            // Teletransportar la cabeza de la serpiente
            snake.body[0] = MathUtils.clonePosition(exitPosition);
            Logger.log(`Serpiente teletransportada a (${exitPosition.x}, ${exitPosition.y})`);
            return { type: 'teleport', position: exitPosition };
        }
        
        return null;
    }

    // Procesar interacción con muro de impulso
    processBoostInteraction(snake, boostWall) {
        snake.activateBoost(boostWall.boostDuration);
        Logger.log('Boost de velocidad activado');
        return { type: 'boost', duration: boostWall.boostDuration };
    }

    // Verificar y manejar repulsión de frutas
    checkFruitRepulsion(fruit) {
        const repulsionWalls = this.walls.filter(wall => wall.type === WALL_TYPES.REPULSION);
        
        for (const wall of repulsionWalls) {
            if (wall.isInRepulsionRadius(fruit.position)) {
                return true;
            }
        }
        
        return false;
    }

    // Obtener todas las posiciones ocupadas por muros
    getAllWallPositions() {
        const positions = [];
        this.walls.forEach(wall => {
            positions.push(...wall.positions);
        });
        return positions;
    }

    // Obtener muros por tipo
    getWallsByType(type) {
        return this.walls.filter(wall => wall.type === type);
    }

    // Limpiar todos los muros
    clearAllWalls() {
        // Devolver todos los muros al inventario
        this.walls.forEach(wall => {
            this.addToInventory(wall.type, 1);
        });
        
        this.walls = [];
        this.cancelPlacement();
        Logger.log('Todos los muros han sido removidos');
    }

    // Obtener estado del inventario
    getInventoryStatus() {
        const status = {};
        this.wallInventory.forEach((count, type) => {
            status[type] = count;
        });
        return status;
    }

    // Guardar muros
    save() {
        const wallsData = this.walls.map(wall => ({
            type: wall.type,
            positions: wall.positions,
            id: wall.id
        }));
        
        const inventoryData = {};
        this.wallInventory.forEach((count, type) => {
            inventoryData[type] = count;
        });

        StorageUtils.save('walls', wallsData);
        StorageUtils.save('wallInventory', inventoryData);
    }

    // Cargar muros
    load() {
        // Cargar muros colocados
        const wallsData = StorageUtils.load('walls', []);
        this.walls = wallsData.map(data => 
            this.createWall(data.type, data.positions, data.id)
        );

        // Cargar inventario
        const inventoryData = StorageUtils.load('wallInventory', {});
        Object.keys(inventoryData).forEach(type => {
            this.wallInventory.set(type, inventoryData[type]);
        });
    }

    // Redimensionar y recentrar muros cuando se expande el tablero
    resize(oldSize, newSize) {
        // Calcular desplazamiento para mantener elementos centrados
        const oldCenter = Math.floor(oldSize / 2);
        const newCenter = Math.floor(newSize / 2);
        const offsetX = newCenter - oldCenter;
        const offsetY = newCenter - oldCenter;
        
        // Reposicionar todos los muros existentes
        this.walls.forEach(wall => {
            const newPositions = [];
            wall.positions.forEach(pos => {
                const newX = pos.x + offsetX;
                const newY = pos.y + offsetY;
                // Solo mantener posiciones que estén dentro del nuevo tablero
                if (newX >= 0 && newX < newSize && newY >= 0 && newY < newSize) {
                    newPositions.push({ x: newX, y: newY });
                }
            });
            wall.positions = newPositions;
        });
        
        // Remover muros que perdieron todas sus posiciones
        this.walls = this.walls.filter(wall => wall.positions.length > 0);
    }

    // Reset para nueva partida (mantener inventario)
    resetForNewGame() {
        // No limpiar muros ni inventario en muerte normal
        // Solo cancelar colocación si está en progreso
        this.cancelPlacement();
    }

    // Reset completo para mutación
    resetForMutation() {
        this.clearAllWalls();
        this.initializeInventory();
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        Wall, 
        PortalWall, 
        RepulsionWall, 
        BoostWall, 
        WallManager, 
        WALL_TYPES 
    };
}