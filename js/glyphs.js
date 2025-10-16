// glyphs.js - Mapa y gestión de glifos de ADN

class GlyphMap {
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
        
        // Reposicionar glifos existentes con el offset de centrado
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

    // Colocar un glifo en una posición
    setGlyph(x, y, glyphType) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        this.map[y][x] = glyphType;
        return true;
    }

    // Obtener el glifo en una posición
    getGlyph(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return null;
        return this.map[y][x];
    }

    // Verificar si hay un glifo en una posición
    hasGlyph(x, y) {
        return this.getGlyph(x, y) !== null;
    }

    // Verificar si hay un glifo específico en una posición
    hasGlyphType(x, y, glyphType) {
        return this.getGlyph(x, y) === glyphType;
    }

    // Remover un glifo de una posición
    removeGlyph(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        this.map[y][x] = null;
        return true;
    }

    // Verificar si una posición está libre (sin glifo)
    isFree(x, y) {
        return !this.hasGlyph(x, y);
    }

    // Obtener todas las posiciones con glifos de un tipo específico
    getGlyphPositions(glyphType) {
        const positions = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.map[y][x] === glyphType) {
                    positions.push({ x, y });
                }
            }
        }
        return positions;
    }

    // Obtener todas las posiciones con glifos
    getAllGlyphPositions() {
        const positions = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.map[y][x] !== null) {
                    positions.push({ x, y, type: this.map[y][x] });
                }
            }
        }
        return positions;
    }

    // Contar glifos de un tipo específico
    countGlyphs(glyphType) {
        let count = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.map[y][x] === glyphType) {
                    count++;
                }
            }
        }
        return count;
    }

    // Limpiar todos los glifos
    clear() {
        this.map = this.createEmptyMap(this.gridSize);
    }

    // Serializar para guardado
    serialize() {
        return {
            gridSize: this.gridSize,
            map: this.map
        };
    }

    // Deserializar desde guardado
    static deserialize(data) {
        const glyphMap = new GlyphMap(data.gridSize);
        glyphMap.map = data.map;
        return glyphMap;
    }

    // Renderizar glifos en el canvas
    render(ctx, cellSize) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const glyph = this.map[y][x];
                if (glyph !== null) {
                    this.renderGlyph(ctx, x, y, glyph, cellSize);
                }
            }
        }
    }

    // Renderizar un glifo específico
    renderGlyph(ctx, x, y, glyphType, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;

        ctx.save();

        // Establecer color según tipo de glifo
        if (glyphType === GLYPH_TYPES.COMBO) {
            ctx.fillStyle = GAME_CONFIG.GLYPH_COLORS.COMBO;
            ctx.strokeStyle = '#FFFFFF';
        } else if (glyphType === GLYPH_TYPES.CONSUMER) {
            ctx.fillStyle = GAME_CONFIG.GLYPH_COLORS.CONSUMER;
            ctx.strokeStyle = '#FFFFFF';
        }

        // Dibujar círculo base del glifo
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellSize * 0.35, 0, 2 * Math.PI);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dibujar símbolo específico del glifo
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${cellSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (glyphType === GLYPH_TYPES.COMBO) {
            ctx.fillText('◆', centerX, centerY);
        } else if (glyphType === GLYPH_TYPES.CONSUMER) {
            ctx.fillText('⚡', centerX, centerY);
        }

        ctx.restore();
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlyphMap };
}