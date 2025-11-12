/**
 * Gestor de Spritesheet para Snake Clicker
 * Maneja la carga y animación de sprites desde assets.png
 */

class SpritesheetManager {
    constructor() {
        this.spritesheet = null;
        this.loaded = false;
        this.currentSnakeType = 0; // 0=naranja, 1=verde, 2=azul
        
        // Configuración específica para tu spritesheet (preparada para animaciones)
        this.config = {
            spriteSize: 32,           // Tamaño de cada sprite individual (32x32px)
            snakeTypes: 3,            // 3 serpientes: 0=naranja, 1=verde, 2=azul
            spritesPerRow: 16,        // Sprites por fila horizontal
            layout: 'horizontal',     // Layout por filas
            
            // 🎯 MAPEO DETALLADO DE POSICIONES (índice en fila, multiplicar por 32px)
            spriteMap: {
                // CABEZAS DIRECCIONALES (4 sprites) - Posiciones X: 0-128px
                head: { 
                    up: 0,        // X: 0px   - Cabeza mirando arriba
                    down: 1,      // X: 32px  - Cabeza mirando abajo  
                    left: 2,      // X: 64px  - Cabeza mirando izquierda
                    right: 3      // X: 96px  - Cabeza mirando derecha
                },
                
                // CUERPOS (6 tipos) - Posiciones X: 128-320px  
                body: { 
                    horizontal: 4,    // X: 128px - Segmento horizontal (━)
                    vertical: 5,      // X: 160px - Segmento vertical (┃)
                    cornerTL: 6,      // X: 192px - Esquina Top-Left (┏)
                    cornerTR: 7,      // X: 224px - Esquina Top-Right (┓)
                    cornerBL: 8,      // X: 256px - Esquina Bottom-Left (┗)
                    cornerBR: 9       // X: 288px - Esquina Bottom-Right (┛)
                },
                
                // COLAS DIRECCIONALES (4 sprites) - Posiciones X: 320-448px
                tail: { 
                    up: 10,       // X: 320px - Cola apuntando arriba
                    down: 11,     // X: 352px - Cola apuntando abajo
                    left: 12,     // X: 384px - Cola apuntando izquierda  
                    right: 13     // X: 416px - Cola apuntando derecha
                },
                
                // 🎬 ANIMACIONES FUTURAS - Reservado para frames adicionales
                animations: {
                    // Frames de respiración/latido para cabeza (suave pulsación)
                    headIdle: { start: 14, frames: 2 },    // X: 448px-512px
                    
                    // Frames de movimiento para cuerpo (ondulación sutil)  
                    bodyMove: { start: 16, frames: 4 },    // X: 512px-640px (si hay segunda fila de sprites)
                    
                    // Frames de brillo/destello cuando come fruta
                    bodyGlow: { start: 20, frames: 3 },    // X: 640px-736px
                    
                    // Frames de cola ondulante
                    tailWag: { start: 24, frames: 2 }      // X: 768px-832px
                }
            }
        };
        
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        this.lastFrameTime = 0;
        
        this.loadSpritesheet();
    }

    loadSpritesheet() {
        this.spritesheet = new Image();
        this.spritesheet.onload = () => {
            this.loaded = true;
            this.analyzeSpritesheetDimensions();
            Logger.log('Spritesheet cargado exitosamente:', this.spritesheet.width, 'x', this.spritesheet.height);
        };
        
        this.spritesheet.onerror = () => {
            Logger.error('Error cargando spritesheet assets.png');
        };
        
        // 🔄 Cache busting: añadir timestamp para forzar recarga
        const cacheBuster = new Date().getTime();
        this.spritesheet.src = `./assets/assets.png?v=${cacheBuster}`;
        Logger.log('Cargando spritesheet con cache buster:', cacheBuster);
    }

    analyzeSpritesheetDimensions() {
        const width = this.spritesheet.width;
        const height = this.spritesheet.height;
        
        Logger.log('Dimensiones del spritesheet:', width, 'x', height);
        
        // Calcular sprites por fila basado en las dimensiones reales
        this.config.spritesPerRow = Math.floor(width / this.config.spriteSize);
        const rowCount = Math.floor(height / this.config.spriteSize);
        
        // Verificar que tenemos al menos 3 filas para las 3 serpientes
        if (rowCount >= 3) {
            this.config.snakeTypes = Math.min(3, rowCount);
        }
        
        Logger.log('Configuración calculada:', {
            spritesPerRow: this.config.spritesPerRow,
            rowCount: rowCount,
            snakeTypes: this.config.snakeTypes
        });
    }

    // Cambiar tipo de serpiente (0, 1, 2)
    setSnakeType(type) {
        if (type >= 0 && type < this.config.snakeTypes) {
            this.currentSnakeType = type;
            Logger.log('Tipo de serpiente cambiado a:', type);
        }
    }

    // Obtener el siguiente tipo de serpiente (para ciclar)
    getNextSnakeType() {
        return (this.currentSnakeType + 1) % this.config.snakeTypes;
    }

    // Ciclar al siguiente tipo de serpiente
    cycleSnakeType() {
        this.setSnakeType(this.getNextSnakeType());
    }

    // Actualizar animación
    update(deltaTime) {
        if (!this.loaded) return;
        
        this.animationFrame += this.animationSpeed * deltaTime;
        if (this.animationFrame >= this.config.framesPerType) {
            this.animationFrame = 0;
        }
    }

    // Obtener frame actual de animación
    getCurrentFrame() {
        return Math.floor(this.animationFrame);
    }

    // 📍 Calcular posición exacta del sprite en el spritesheet (en píxeles)
    getSpritePosition(partType = 'body', direction = 'right', animationFrame = 0) {
        if (!this.loaded) return null;
        
        const spriteSize = this.config.spriteSize;
        let spriteIndex = 0;
        
        // Convertir dirección de objeto a string si es necesario
        let directionStr = direction;
        if (typeof direction === 'object' && direction !== null) {
            if (direction.x === 0 && direction.y === -1) directionStr = 'up';
            else if (direction.x === 0 && direction.y === 1) directionStr = 'down';
            else if (direction.x === -1 && direction.y === 0) directionStr = 'left';
            else if (direction.x === 1 && direction.y === 0) directionStr = 'right';
            else directionStr = 'right'; // fallback
        }
        
        // Determinar índice base del sprite según tipo y dirección
        const spriteMap = this.config.spriteMap;
        if (partType === 'head' && spriteMap.head[directionStr] !== undefined) {
            spriteIndex = spriteMap.head[directionStr];
            // 🎬 Añadir frame de animación para cabeza (respiración sutil)
            if (animationFrame > 0 && spriteMap.animations.headIdle) {
                spriteIndex += spriteMap.animations.headIdle.start + (animationFrame % spriteMap.animations.headIdle.frames);
            }
        } else if (partType === 'tail' && spriteMap.tail[directionStr] !== undefined) {
            spriteIndex = spriteMap.tail[directionStr];
            // 🎬 Añadir frame de animación para cola (ondulación)
            if (animationFrame > 0 && spriteMap.animations.tailWag) {
                spriteIndex += spriteMap.animations.tailWag.start + (animationFrame % spriteMap.animations.tailWag.frames);
            }
        } else if (partType === 'body' && spriteMap.body[directionStr] !== undefined) {
            spriteIndex = spriteMap.body[directionStr];
            // 🎬 Añadir frame de animación para cuerpo (ondulación sutil)
            if (animationFrame > 0 && spriteMap.animations.bodyMove) {
                spriteIndex += spriteMap.animations.bodyMove.start + (animationFrame % spriteMap.animations.bodyMove.frames);
            }
        } else {
            // Fallback a cuerpo horizontal
            spriteIndex = spriteMap.body.horizontal;
        }
        
        // 📐 Calcular posición exacta en píxeles
        const pixelX = (spriteIndex % this.config.spritesPerRow) * spriteSize;
        const pixelY = this.currentSnakeType * spriteSize;
        
        return {
            sx: pixelX,               // Source X en píxeles (0, 32, 64, 96...)
            sy: pixelY,               // Source Y en píxeles (0, 32, 64 para cada serpiente)
            sw: spriteSize,           // Source width (32px)
            sh: spriteSize,           // Source height (32px)
            spriteIndex: spriteIndex,
            partType: partType,
            direction: directionStr,
            pixelX: pixelX,           // Posición X exacta en píxeles
            pixelY: pixelY,           // Posición Y exacta en píxeles
            animationFrame: animationFrame
        };
    }

    // Renderizar sprite en el canvas
    drawSprite(ctx, x, y, width, height, partType = 'body', direction = 'right') {
        if (!this.loaded || !this.spritesheet) return false;
        
        const spritePos = this.getSpritePosition(partType, direction);
        if (!spritePos) return false;
        
        try {
            ctx.drawImage(
                this.spritesheet,
                spritePos.sx, spritePos.sy, spritePos.sw, spritePos.sh,  // Source
                x, y, width, height                                       // Destination
            );
            return true;
        } catch (error) {
            Logger.error('Error dibujando sprite:', error);
            return false;
        }
    }

    // Crear canvas temporal con sprite (compatible con sistema existente)
    createSpriteCanvas(partType = 'body', direction = 'right') {
        if (!this.loaded) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONFIG.CELL_SIZE;
        canvas.height = GAME_CONFIG.CELL_SIZE;
        const ctx = canvas.getContext('2d');
        
        // Renderizar el sprite escalado al tamaño de celda
        const success = this.drawSprite(
            ctx, 
            0, 0, 
            GAME_CONFIG.CELL_SIZE, 
            GAME_CONFIG.CELL_SIZE, 
            partType, 
            direction
        );
        
        return success ? canvas : null;
    }

    // Obtener información del spritesheet
    getInfo() {
        return {
            loaded: this.loaded,
            currentSnakeType: this.currentSnakeType,
            currentFrame: this.getCurrentFrame(),
            config: this.config,
            dimensions: this.spritesheet ? {
                width: this.spritesheet.width,
                height: this.spritesheet.height
            } : null
        };
    }

    // 🔄 Forzar recarga del spritesheet (útil cuando cambias assets.png)
    reloadSpritesheet() {
        Logger.log('Forzando recarga del spritesheet...');
        this.loaded = false;
        this.spritesheet = null;
        this.loadSpritesheet();
    }

    // 🗺️ Obtener mapa completo de posiciones en píxeles
    getPositionMap() {
        const map = {};
        const spriteSize = this.config.spriteSize;
        
        // Mapear todas las posiciones de cabezas
        map.heads = {};
        Object.entries(this.config.spriteMap.head).forEach(([direction, index]) => {
            map.heads[direction] = {
                index: index,
                pixelX: index * spriteSize,
                pixelY_orange: 0 * spriteSize,   // Fila 0: naranja
                pixelY_green: 1 * spriteSize,    // Fila 1: verde  
                pixelY_blue: 2 * spriteSize      // Fila 2: azul
            };
        });
        
        // Mapear todas las posiciones de cuerpos
        map.bodies = {};
        Object.entries(this.config.spriteMap.body).forEach(([type, index]) => {
            map.bodies[type] = {
                index: index,
                pixelX: index * spriteSize,
                pixelY_orange: 0 * spriteSize,
                pixelY_green: 1 * spriteSize,
                pixelY_blue: 2 * spriteSize
            };
        });
        
        // Mapear todas las posiciones de colas
        map.tails = {};
        Object.entries(this.config.spriteMap.tail).forEach(([direction, index]) => {
            map.tails[direction] = {
                index: index,
                pixelX: index * spriteSize,
                pixelY_orange: 0 * spriteSize,
                pixelY_green: 1 * spriteSize,
                pixelY_blue: 2 * spriteSize
            };
        });
        
        return map;
    }

    // 🎬 Obtener información de animaciones futuras
    getAnimationInfo() {
        return {
            available: false, // Por ahora deshabilitado hasta tener sprites de animación
            futureFrames: this.config.spriteMap.animations,
            note: "Animaciones preparadas para implementación futura"
        };
    }
}

// Instancia global
window.SpritesheetManager = SpritesheetManager;