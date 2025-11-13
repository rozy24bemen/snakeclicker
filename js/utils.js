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
        SNAKE_HEAD: '#FFFFFF',      // Blanco puro para la cabeza
        SNAKE_BODY: '#F5F5F5',      // Blanco ligeramente grisáceo para el cuerpo
        FRUIT: '#FF6B6B',
        FRUIT_GOLDEN: '#FFD700',     // Dorada existente
        FRUIT_DARK: '#551A8B',       // Wall 3: Manzana Oscura (púrpura oscuro)
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
    },
    GLYPH_COLORS: {
        COMBO: '#9C27B0',        // Púrpura para resonancia
        CONSUMER: '#E91E63',     // Rosa para consumidor
        REDIRECT: '#FF5722'      // Wall 3: Naranja oscuro para desvío
    },
    ECONOMY: {
        PRESTIGE_MONEY_THRESHOLD: 10000,   // Threshold en $ para prestigio
        GOLDEN_FRUIT_CHANCE_BASE: 0.01,    // 1% tras prestigio
        GOLDEN_FRUIT_MULTIPLIER_BASE: 10,  // x10 tras prestigio
        
        // Wall 3: Manzana Oscura (El Dictador) 
        DARK_FRUIT_CHANCE_BASE: 0.005,     // 0.5% - muy rara
        DARK_FRUIT_MONEY_REWARD: 2000,     // $2,000 - valor real viene de ADN+COMBO
        DARK_FRUIT_DNA_REWARD: 1           // 1 ADN Puro garantizado
    }
};

// Efectos de baldosa
const TILE_EFFECTS = {
    PC_MULT: 'PC_MULT',
    SPEED: 'SPEED'
};

// Tipos de glifos de ADN
const GLYPH_TYPES = {
    COMBO: 'GLYPH_COMBO',      // Resonancia: acumula multiplicador por segmentos
    CONSUMER: 'GLYPH_CONSUMER', // Sacrificio: consume longitud por dinero
    REDIRECT: 'GLYPH_REDIRECT'  // Wall 3: Desvío: anula IA y fuerza dirección
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
        // FIX: Prevenir bucle infinito cuando el tablero está lleno
        const maxAttempts = gridSize * gridSize; // Máximo una vez por cada celda
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
            attempts++;
            
            // Si hemos intentado demasiado, el tablero está probablemente lleno
            if (attempts >= maxAttempts) {
                console.error('[MathUtils] getRandomPosition: Máximo de intentos alcanzado, tablero posiblemente lleno');
                // Retornar cualquier posición libre que podamos encontrar
                for (let x = 0; x < gridSize; x++) {
                    for (let y = 0; y < gridSize; y++) {
                        const candidate = { x, y };
                        if (!excludePositions.some(pos => pos.x === x && pos.y === y)) {
                            console.log(`[MathUtils] Posición libre encontrada en exhaustive search: (${x}, ${y})`);
                            return candidate;
                        }
                    }
                }
                // Si llegamos aquí, no hay posiciones libres en absoluto
                console.error('[MathUtils] NO HAY POSICIONES LIBRES DISPONIBLES!');
                return null; // Esto indicará al llamador que no se pudo generar posición
            }
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

// Utilidades de color (HSL/Hex) para renderizado procedural
const ColorUtils = {
    // Convertir HSL a RGB
    hslToRgb: (h, s, l) => {
        h = (h % 360 + 360) % 360; // normalizar
        s = Math.min(Math.max(s, 0), 1);
        l = Math.min(Math.max(l, 0), 1);
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const hp = h / 60;
        const x = c * (1 - Math.abs((hp % 2) - 1));
        let r = 0, g = 0, b = 0;
        if (hp >= 0 && hp < 1) { r = c; g = x; }
        else if (hp < 2) { r = x; g = c; }
        else if (hp < 3) { g = c; b = x; }
        else if (hp < 4) { g = x; b = c; }
        else if (hp < 5) { r = x; b = c; }
        else { r = c; b = x; }
        const m = l - c / 2;
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return { r, g, b };
    },
    rgbToHex: ({ r, g, b }) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''),
    hslToHex: (h, s, l) => {
        return ColorUtils.rgbToHex(ColorUtils.hslToRgb(h, s, l));
    },
    adjustL: (hex, delta) => {
        // Ajustar luminancia simple convirtiendo a HSL aproximado
        const rgb = ColorUtils.hexToRgb(hex);
        if (!rgb) return hex;
        let { h, s, l } = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
        l = Math.min(Math.max(l + delta, 0), 1);
        return ColorUtils.hslToHex(h, s, l);
    },
    hexToRgb: (hex) => {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!m) return null;
        return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    },
    rgbToHsl: (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s; const l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h *= 60;
        }
        return { h, s, l };
    }
};

// Configuración visual procedural para serpiente
const PROC_VISUAL_CONFIG = {
    // Paleta azul eléctrica
    SNAKE_BASE_H: 210,          // Azul (H)
    SNAKE_BASE_S: 0.85,         // Saturación alta para brillo tecnológico
    SNAKE_BASE_L: 0.62,         // Luminosidad inicial (cabeza)
    // Nuevos parámetros de degradado y taper
    SIZE_DECAY_TOTAL: 0.75,     // Proporción de reducción desde cabeza a cola (más notorio)
    MIN_SIZE_RATIO: 0.18,       // Grosor mínimo en la cola (cola muy fina)
    TAIL_DARKEN: 0.60,          // Cola mucho más oscura
    // Legacy (se ignorarán algunos en nueva función, mantenidos por compatibilidad)
    SIZE_DECAY_FACTOR: 0.0025,
    LUMINANCE_DECAY: 0.25 / 100,
    // Glow combo
    GLOW_DURATION_MS: 1200,
    GLOW_EXTRA_L: 0.15,
    // Colores auxiliares
    COMBO_RING_COLOR: '#9C27B0',
    CONSUMER_FLASH_COLOR: '#FF1744',
    REDIRECT_ARROW_COLOR: '#FF5722'
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