// snake-sprites.js - Sistema de sprites y animación para la serpiente

class SnakeSprites {
    constructor() {
        this.sprites = {};
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        this.loaded = false;
        
        // Configuración de sprites
        this.spriteConfig = {
            head: {
                up: this.createHeadSprite('up'),
                down: this.createHeadSprite('down'),
                left: this.createHeadSprite('left'),
                right: this.createHeadSprite('right')
            },
            body: {
                horizontal: this.createBodySprite('horizontal'),
                vertical: this.createBodySprite('vertical'),
                cornerTL: this.createBodySprite('cornerTL'), // Top-Left
                cornerTR: this.createBodySprite('cornerTR'), // Top-Right
                cornerBL: this.createBodySprite('cornerBL'), // Bottom-Left
                cornerBR: this.createBodySprite('cornerBR')  // Bottom-Right
            },
            tail: {
                up: this.createTailSprite('up'),
                down: this.createTailSprite('down'),
                left: this.createTailSprite('left'),
                right: this.createTailSprite('right')
            }
        };
        
        this.loaded = true;
        Logger.log('Sistema de sprites de serpiente inicializado');
    }

    // Crear sprite para cabeza direccional
    createHeadSprite(direction) {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONFIG.CELL_SIZE;
        canvas.height = GAME_CONFIG.CELL_SIZE;
        const ctx = canvas.getContext('2d');
        
        const size = GAME_CONFIG.CELL_SIZE;
        const center = size / 2;
        
        // Base de la cabeza con gradiente sofisticado
        const baseGradient = ctx.createRadialGradient(center-2, center-2, 0, center, center, center-3);
        baseGradient.addColorStop(0, '#4FC3F7'); // Azul claro brillante
        baseGradient.addColorStop(0.5, GAME_CONFIG.COLORS.SNAKE_HEAD);
        baseGradient.addColorStop(1, '#0D47A1'); // Azul muy oscuro
        
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(center, center, center - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde brillante
        ctx.strokeStyle = '#1E88E5';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Brillo superior más sutil
        const highlight = ctx.createRadialGradient(center - 4, center - 4, 0, center, center, center/2);
        highlight.addColorStop(0, 'rgba(255,255,255,0.6)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(center, center, center - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Ojos según dirección
        this.drawEyes(ctx, direction, size);
        
        return canvas;
    }

    // Dibujar ojos direccionales mejorados
    drawEyes(ctx, direction, size) {
        const center = size / 2;
        let eyeOffset = 5;
        let pupilOffset = 1.5;
        
        // Ojos más grandes y brillantes
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 0.5;
        
        switch(direction) {
            case 'up':
                // Ojos arriba - más grandes y expresivos
                ctx.beginPath();
                ctx.arc(center - 4, center - eyeOffset, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(center + 4, center - eyeOffset, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Pupilas brillantes
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(center - 4, center - eyeOffset - pupilOffset, 2, 0, Math.PI * 2);
                ctx.arc(center + 4, center - eyeOffset - pupilOffset, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Brillo en pupilas
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center - 4 + 0.5, center - eyeOffset - pupilOffset - 0.5, 0.8, 0, Math.PI * 2);
                ctx.arc(center + 4 + 0.5, center - eyeOffset - pupilOffset - 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'down':
                // Ojos abajo - mejorados
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center - 4, center + eyeOffset, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(center + 4, center + eyeOffset, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(center - 4, center + eyeOffset + pupilOffset, 2, 0, Math.PI * 2);
                ctx.arc(center + 4, center + eyeOffset + pupilOffset, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center - 4 + 0.5, center + eyeOffset + pupilOffset + 0.5, 0.8, 0, Math.PI * 2);
                ctx.arc(center + 4 + 0.5, center + eyeOffset + pupilOffset + 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'left':
                // Ojos izquierda - mejorados
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center - eyeOffset, center - 4, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(center - eyeOffset, center + 4, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(center - eyeOffset - pupilOffset, center - 4, 2, 0, Math.PI * 2);
                ctx.arc(center - eyeOffset - pupilOffset, center + 4, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center - eyeOffset - pupilOffset - 0.5, center - 4 + 0.5, 0.8, 0, Math.PI * 2);
                ctx.arc(center - eyeOffset - pupilOffset - 0.5, center + 4 + 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'right':
                // Ojos derecha - mejorados
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center + eyeOffset, center - 4, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(center + eyeOffset, center + 4, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(center + eyeOffset + pupilOffset, center - 4, 2, 0, Math.PI * 2);
                ctx.arc(center + eyeOffset + pupilOffset, center + 4, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(center + eyeOffset + pupilOffset + 0.5, center - 4 + 0.5, 0.8, 0, Math.PI * 2);
                ctx.arc(center + eyeOffset + pupilOffset + 0.5, center + 4 + 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    // Crear sprite para segmento del cuerpo
    createBodySprite(type) {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONFIG.CELL_SIZE;
        canvas.height = GAME_CONFIG.CELL_SIZE;
        const ctx = canvas.getContext('2d');
        
        const size = GAME_CONFIG.CELL_SIZE;
        
        ctx.fillStyle = GAME_CONFIG.COLORS.SNAKE_BODY;
        ctx.strokeStyle = GAME_CONFIG.COLORS.SNAKE_BODY;
        
        switch(type) {
            case 'horizontal':
                // Segmento horizontal elegante con gradiente sutil
                const gradient1 = ctx.createLinearGradient(0, 0, 0, size);
                gradient1.addColorStop(0, GAME_CONFIG.COLORS.SNAKE_HEAD);
                gradient1.addColorStop(0.5, GAME_CONFIG.COLORS.SNAKE_BODY);
                gradient1.addColorStop(1, GAME_CONFIG.COLORS.SNAKE_HEAD);
                ctx.fillStyle = gradient1;
                this.drawRoundedRect(ctx, 1, size/4, size-2, size/2, 8);
                break;
                
            case 'vertical':
                // Segmento vertical elegante con gradiente sutil  
                const gradient2 = ctx.createLinearGradient(0, 0, size, 0);
                gradient2.addColorStop(0, GAME_CONFIG.COLORS.SNAKE_HEAD);
                gradient2.addColorStop(0.5, GAME_CONFIG.COLORS.SNAKE_BODY);
                gradient2.addColorStop(1, GAME_CONFIG.COLORS.SNAKE_HEAD);
                ctx.fillStyle = gradient2;
                this.drawRoundedRect(ctx, size/4, 1, size/2, size-2, 8);
                break;
                
            case 'cornerTL':
            case 'cornerTR':
            case 'cornerBL':
            case 'cornerBR':
                // Todas las esquinas son curvas suaves y bonitas
                const radius = size * 0.35;
                const thickness = size * 0.4;
                
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Crear una curva suave que conecta los bordes
                ctx.beginPath();
                ctx.arc(size/2, size/2, radius, 0, Math.PI * 2);
                ctx.globalAlpha = 0.8;
                ctx.fill();
                ctx.globalAlpha = 1.0;
                
                // Agregar un borde más oscuro para definición
                ctx.strokeStyle = GAME_CONFIG.COLORS.SNAKE_HEAD;
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
        }
        
        // Añadir brillo sutil al cuerpo
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        return canvas;
    }

    // Crear sprite para cola direccional
    createTailSprite(direction) {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONFIG.CELL_SIZE;
        canvas.height = GAME_CONFIG.CELL_SIZE;
        const ctx = canvas.getContext('2d');
        
        const size = GAME_CONFIG.CELL_SIZE;
        const center = size / 2;
        
        ctx.fillStyle = GAME_CONFIG.COLORS.SNAKE_BODY;
        
        // Dibujar cola direccional (forma ahusada)
        ctx.beginPath();
        switch(direction) {
            case 'up':
                ctx.moveTo(center - 8, size - 2);
                ctx.lineTo(center + 8, size - 2);
                ctx.lineTo(center, 5);
                break;
            case 'down':
                ctx.moveTo(center - 8, 2);
                ctx.lineTo(center + 8, 2);
                ctx.lineTo(center, size - 5);
                break;
            case 'left':
                ctx.moveTo(size - 2, center - 8);
                ctx.lineTo(size - 2, center + 8);
                ctx.lineTo(5, center);
                break;
            case 'right':
                ctx.moveTo(2, center - 8);
                ctx.lineTo(2, center + 8);
                ctx.lineTo(size - 5, center);
                break;
        }
        ctx.closePath();
        ctx.fill();
        
        return canvas;
    }

    // Utilidad para dibujar rectángulos redondeados
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // Obtener sprite de cabeza según dirección
    getHeadSprite(direction) {
        const dirMap = {
            [DIRECTIONS.UP]: 'up',
            [DIRECTIONS.DOWN]: 'down',
            [DIRECTIONS.LEFT]: 'left',
            [DIRECTIONS.RIGHT]: 'right'
        };
        
        const dirStr = dirMap[direction] || 'right';
        return this.spriteConfig.head[dirStr];
    }

    // Determinar tipo de segmento del cuerpo
    getBodySprite(prevSegment, currentSegment, nextSegment) {
        if (!prevSegment || !nextSegment) {
            return this.spriteConfig.body.horizontal; // Fallback
        }

        // Vectores de dirección
        const dx1 = prevSegment.x - currentSegment.x;  // Dirección hacia el segmento anterior
        const dy1 = prevSegment.y - currentSegment.y;
        const dx2 = nextSegment.x - currentSegment.x;  // Dirección hacia el siguiente segmento
        const dy2 = nextSegment.y - currentSegment.y;

        // Si es una línea recta (ambas direcciones están alineadas)
        if ((dx1 === -dx2 && dy1 === -dy2)) {
            if (dx1 === 0) return this.spriteConfig.body.vertical;   // Movimiento vertical
            else return this.spriteConfig.body.horizontal; // Movimiento horizontal
        }

        // Es una esquina - usar un sprite universal bonito
        // Como todas las esquinas ahora son círculos suaves, cualquier tipo funciona bien
        return this.spriteConfig.body.cornerTL; // Sprite universal para todas las esquinas
    }

    // Obtener sprite de cola según dirección
    getTailSprite(tailSegment, prevSegment) {
        if (!prevSegment) return this.spriteConfig.tail.right;
        
        const dx = tailSegment.x - prevSegment.x;
        const dy = tailSegment.y - prevSegment.y;
        
        if (dx === 1) return this.spriteConfig.tail.right;
        if (dx === -1) return this.spriteConfig.tail.left;
        if (dy === 1) return this.spriteConfig.tail.down;
        if (dy === -1) return this.spriteConfig.tail.up;
        
        return this.spriteConfig.tail.right; // Fallback
    }

    // Actualizar animación
    update(deltaTime) {
        this.animationFrame += this.animationSpeed * deltaTime;
        if (this.animationFrame > Math.PI * 2) {
            this.animationFrame = 0;
        }
    }

    // Obtener offset de animación para movimiento fluido
    getAnimationOffset() {
        return Math.sin(this.animationFrame) * 2; // Suave ondulación
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SnakeSprites = SnakeSprites;
}