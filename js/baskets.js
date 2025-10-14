// baskets.js - Sistema de Cestas

class BasketMap {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.map = this.createEmptyMap(gridSize);
    }

    createEmptyMap(size) {
        const arr = new Array(size);
        for (let y = 0; y < size; y++) arr[y] = new Array(size).fill(false);
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
        
        // Reposicionar cestas existentes con el offset de centrado
        for (let y = 0; y < oldSize; y++) {
            for (let x = 0; x < oldSize; x++) {
                if (this.map[y][x]) {
                    const newX = x + offsetX;
                    const newY = y + offsetY;
                    // Solo colocar si la nueva posición está dentro del tablero
                    if (newX >= 0 && newX < newSize && newY >= 0 && newY < newSize) {
                        newMap[newY][newX] = true;
                    }
                }
            }
        }
        
        this.gridSize = newSize;
        this.map = newMap;
    }

    setBasket(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        this.map[y][x] = true;
        return true;
    }

    removeBasket(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        this.map[y][x] = false;
        return true;
    }

    isBasket(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        return !!this.map[y][x];
    }

    clear() {
        this.map = this.createEmptyMap(this.gridSize);
    }

    getAllBasketPositions() {
        const res = [];
        for (let y = 0; y < this.gridSize; y++)
            for (let x = 0; x < this.gridSize; x++)
                if (this.map[y][x]) res.push({ x, y });
        return res;
    }

    serialize() {
        return { size: this.gridSize, data: this.map };
    }

    static deserialize(obj) {
        const inst = new BasketMap(obj.size);
        inst.map = obj.data || inst.createEmptyMap(obj.size);
        return inst;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BasketMap };
}
