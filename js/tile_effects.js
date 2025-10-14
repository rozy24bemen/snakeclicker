// tile_effects.js - Mapa y gestión de efectos de baldosas

class TileEffectMap {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.map = this.createEmptyMap(gridSize);
    }

    createEmptyMap(size) {
        const arr = new Array(size);
        for (let y = 0; y < size; y++) {
            arr[y] = new Array(size).fill(null);
        }
        return arr;
    }

    resize(newSize) {
        const oldSize = this.gridSize;
        const newMap = this.createEmptyMap(newSize);
        
        // Calcular desplazamiento para mantener elementos centrados
        const oldCenter = Math.floor(oldSize / 2);
        const newCenter = Math.floor(newSize / 2);
        const offsetX = newCenter - oldCenter;
        const offsetY = newCenter - oldCenter;
        
        // Reposicionar efectos de baldosas existentes con el offset de centrado
        for (let y = 0; y < oldSize; y++) {
            for (let x = 0; x < oldSize; x++) {
                if (this.map[y][x] !== null) {
                    const newX = x + offsetX;
                    const newY = y + offsetY;
                    // Solo colocar si la nueva posición está dentro del tablero
                    if (newX >= 0 && newX < newSize && newY >= 0 && newY < newSize) {
                        newMap[newY][newX] = this.map[y][x];
                    }
                }
            }
        }
        
        this.gridSize = newSize;
        this.map = newMap;
    }

    setEffect(x, y, effect) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        this.map[y][x] = effect;
        return true;
    }

    getEffect(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return null;
        return this.map[y][x];
    }

    removeEffect(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        this.map[y][x] = null;
        return true;
    }

    clear() {
        this.map = this.createEmptyMap(this.gridSize);
    }

    serialize() {
        return {
            size: this.gridSize,
            data: this.map
        };
    }

    static deserialize(obj) {
        const inst = new TileEffectMap(obj.size);
        inst.map = obj.data || inst.createEmptyMap(obj.size);
        return inst;
    }
}

// Utilidad: obtener multiplicador de velocidad para una celda (se pueden apilar en el futuro)
function getSpeedMultiplierForCell(tileEffects, x, y) {
    if (!tileEffects) return 1;
    const eff = tileEffects.getEffect(x, y);
    if (eff === TILE_EFFECTS.SPEED) return 1.2; // +20% de velocidad
    return 1;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TileEffectMap, getSpeedMultiplierForCell };
}
