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
    setGlyph(x, y, glyphType, direction = null) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return false;
        
        // Para glifos redirect, almacenar tipo y dirección
        if (glyphType === GLYPH_TYPES.REDIRECT && direction) {
            this.map[y][x] = {
                type: glyphType,
                direction: direction
            };
        } else {
            // Para otros glifos, solo el tipo (compatibilidad hacia atrás)
            this.map[y][x] = glyphType;
        }
        return true;
    }

    // Obtener el glifo en una posición
    getGlyph(x, y) {
        if (!MathUtils.isValidPosition({ x, y }, this.gridSize)) return null;
        return this.map[y][x];
    }

    // Obtener solo el tipo de glifo (compatibilidad hacia atrás)
    getGlyphType(x, y) {
        const glyph = this.getGlyph(x, y);
        if (!glyph) return null;
        // Si es un objeto (glifo redirect), devolver el tipo
        if (typeof glyph === 'object' && glyph.type) {
            return glyph.type;
        }
        // Si es string (glifos antiguos), devolver directamente
        return glyph;
    }

    // Obtener la dirección de un glifo redirect
    getGlyphDirection(x, y) {
        const glyph = this.getGlyph(x, y);
        if (glyph && typeof glyph === 'object' && glyph.direction) {
            return glyph.direction;
        }
        return null;
    }

    // Verificar si hay un glifo en una posición
    hasGlyph(x, y) {
        return this.getGlyph(x, y) !== null;
    }

    // Verificar si hay un glifo específico en una posición
    hasGlyphType(x, y, glyphType) {
        return this.getGlyphType(x, y) === glyphType;
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
        // Soporte para objeto redirect { type, direction }
        const actualType = (glyphType && typeof glyphType === 'object') ? glyphType.type : glyphType;
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        const t = Date.now() * 0.001;

        ctx.save();
        const basePulse = 1 + Math.sin(t * 2.1 + (x + y) * 0.35) * 0.07;
        const baseR = cellSize * 0.33 * basePulse;

        if (actualType === GLYPH_TYPES.COMBO) {
            // Doble anillo rotatorio que marca multiplicador potencial
            const spin = t * 0.9;
            ctx.lineWidth = 2;
            for (let i = 0; i < 2; i++) {
                const phase = spin + i * Math.PI * 0.85;
                const ringR = baseR * (1 + i * 0.42);
                const alpha = 0.55 - i * 0.25;
                ctx.strokeStyle = `rgba(80,240,255,${alpha})`;
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringR, phase, phase + Math.PI * 1.35);
                ctx.stroke();
            }
            // Símbolo × con glow
            ctx.fillStyle = '#88F9FF';
            ctx.font = `${cellSize * 0.38}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#4FE8FF';
            ctx.shadowBlur = 8;
            ctx.fillText('×', centerX, centerY + 1);
        } else if (actualType === GLYPH_TYPES.CONSUMER) {
            // Núcleo naranja con flash periódico y gradiente radial
            const flash = Math.max(0, Math.sin(t * 4.1));
            const r = baseR * (1 + flash * 0.17);
            const grad = ctx.createRadialGradient(centerX, centerY, r * 0.25, centerX, centerY, r * 1.45);
            grad.addColorStop(0, '#FFB347');
            grad.addColorStop(0.4, '#FF8C1F');
            grad.addColorStop(1, 'rgba(255,140,31,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.fill();
            // Símbolo C con contorno
            ctx.font = `${cellSize * 0.30}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#241400';
            ctx.fillStyle = '#FFE1C2';
            ctx.strokeText('C', centerX, centerY + 1);
            ctx.fillText('C', centerX, centerY + 1);
        } else if (actualType === GLYPH_TYPES.REDIRECT) {
            // Flecha con brillo direccional (usa direction si existe)
            const glow = (Math.sin(t * 3.2) * 0.5 + 0.5);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(centerX, centerY, baseR * 0.3, centerX, centerY, baseR * 1.25);
            g.addColorStop(0, `rgba(220,100,255,${0.65 + glow * 0.25})`);
            g.addColorStop(1, 'rgba(150,40,200,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseR * 1.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            const arrow = '→';
            ctx.fillStyle = '#F7E9FF';
            ctx.font = `${cellSize * 0.34}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#D756FF';
            ctx.shadowBlur = 10 + glow * 12;
            ctx.fillText(arrow, centerX, centerY + 1);
        } else {
            // Fallback: círculo simple
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlyphMap };
}