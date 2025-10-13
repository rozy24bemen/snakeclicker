// utils.js - Utilidades y constantes del juego

// Constantes del juego
const GAME_CONFIG = {
    // Tamaño inicial base reducido para permitir expansión progresiva (V2 F1)
    INITIAL_GRID_SIZE: 5,
    INITIAL_SNAKE_LENGTH: 3,
    INITIAL_SPEED: 500, // milliseconds
    MIN_SPEED: 50,
    CELL_SIZE: 30,
    COLORS: {
        SNAKE_HEAD: '#4CAF50',
        SNAKE_BODY: '#45a049',
        FRUIT: '#FF6B6B',
        WALL: '#666666',
        PORTAL_A: '#9C27B0',
        PORTAL_B: '#E91E63',
        REPULSION_WALL: '#FF5722',
        BOOST_WALL: '#FFC107',
        BACKGROUND: '#000000',
        GRID_LINE: '#333333'
    },
    TILE_COLORS: {
        PC_MULT: '#1E88E5',
        SPEED: '#FF9800'
    }
};

// Efectos de baldosa
const TILE_EFFECTS = {
    PC_MULT: 'PC_MULT',
    SPEED: 'SPEED'
};

// Direcciones de movimiento
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Tipos de muros
const WALL_TYPES = {
    PORTAL: 'portal',
    REPULSION: 'repulsion',
    BOOST: 'boost'
};

// Utilidades matemáticas
const MathUtils = {
    // Distancia Manhattan entre dos puntos
    manhattanDistance: (pos1, pos2) => {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    },

    // Distancia euclidiana entre dos puntos
    euclideanDistance: (pos1, pos2) => {
        return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    },

    // Generar posición aleatoria válida
    getRandomPosition: (gridSize, excludePositions = []) => {
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
        } while (excludePositions.some(pos => pos.x === position.x && pos.y === position.y));
        return position;
    },

    // Verificar si una posición está dentro de los límites
    isValidPosition: (pos, gridSize) => {
        return pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize;
    },

    // Clonar posición
    clonePosition: (pos) => ({ x: pos.x, y: pos.y }),

    // Comparar posiciones
    positionsEqual: (pos1, pos2) => pos1.x === pos2.x && pos1.y === pos2.y
};

// Utilidades de array
const ArrayUtils = {
    // Remover elemento de array
    removeElement: (arr, element) => {
        const index = arr.indexOf(element);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    },

    // Obtener último elemento
    last: (arr) => arr[arr.length - 1],

    // Mezclar array (Fisher-Yates shuffle)
    shuffle: (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};

// Utilidades de localStorage
const StorageUtils = {
    // Guardar datos
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
        }
    },

    // Cargar datos
    load: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error cargando de localStorage:', e);
            return defaultValue;
        }
    },

    // Eliminar datos
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error eliminando de localStorage:', e);
        }
    },

    // Limpiar todo
    clear: () => {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Error limpiando localStorage:', e);
        }
    }
};

// Utilidades de canvas
const CanvasUtils = {
    // Limpiar canvas
    clear: (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);
    },

    // Dibujar cuadrícula
    drawGrid: (ctx, gridSize, cellSize, color = GAME_CONFIG.COLORS.GRID_LINE) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        
        // Líneas verticales
        for (let x = 0; x <= gridSize; x++) {
            const xPos = x * cellSize;
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, gridSize * cellSize);
            ctx.stroke();
        }
        
        // Líneas horizontales
        for (let y = 0; y <= gridSize; y++) {
            const yPos = y * cellSize;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(gridSize * cellSize, yPos);
            ctx.stroke();
        }
    },

    // Dibujar rectángulo con esquinas redondeadas
    drawRoundedRect: (ctx, x, y, width, height, radius, fillColor, strokeColor = null) => {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
        }
    },

    // Dibujar círculo
    drawCircle: (ctx, x, y, radius, fillColor, strokeColor = null) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
        }
    },

    // Obtener coordenadas de celda desde coordenadas del canvas
    getCellFromCanvas: (canvasX, canvasY, cellSize) => {
        return {
            x: Math.floor(canvasX / cellSize),
            y: Math.floor(canvasY / cellSize)
        };
    },

    // Obtener coordenadas del canvas desde coordenadas de celda
    getCanvasFromCell: (cellX, cellY, cellSize) => {
        return {
            x: cellX * cellSize,
            y: cellY * cellSize
        };
    }
};

// Utilidades de animación
const AnimationUtils = {
    // Interpolación lineal
    lerp: (start, end, factor) => {
        return start + (end - start) * factor;
    },

    // Easing functions
    easeInOut: (t) => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    easeOut: (t) => {
        return 1 - Math.pow(1 - t, 3);
    },

    // Crear animación simple
    animate: (duration, callback, onComplete) => {
        const startTime = Date.now();
        
        const frame = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            callback(progress);
            
            if (progress < 1) {
                requestAnimationFrame(frame);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        requestAnimationFrame(frame);
    }
};

// Utilidades de eventos
const EventUtils = {
    // Obtener posición del ratón relativa al canvas
    getMousePos: (canvas, e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    },

    // Throttle para limitar frecuencia de eventos
    throttle: (func, delay) => {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    },

    // Debounce para retrasar ejecución
    debounce: (func, delay) => {
        let timeoutId;
        
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// Utilidades de formateo
const FormatUtils = {
    // Formatear números con separadores de miles
    formatNumber: (num) => {
        return num.toLocaleString('es-ES');
    },

    // Formatear números grandes (K, M, B)
    formatLargeNumber: (num) => {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    },

    // Formatear tiempo en milisegundos
    formatTime: (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
};

// Logger para debugging
const Logger = {
    enabled: true,
    
    log: (...args) => {
        if (Logger.enabled) {
            console.log('[IdleSnake]', ...args);
        }
    },
    
    warn: (...args) => {
        if (Logger.enabled) {
            console.warn('[IdleSnake]', ...args);
        }
    },
    
    error: (...args) => {
        if (Logger.enabled) {
            console.error('[IdleSnake]', ...args);
        }
    }
};

// Exportar utilidades si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_CONFIG,
        DIRECTIONS,
        WALL_TYPES,
        MathUtils,
        ArrayUtils,
        StorageUtils,
        CanvasUtils,
        AnimationUtils,
        EventUtils,
        FormatUtils,
        Logger
    };
}