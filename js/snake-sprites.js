// snake-sprites.js - Sistema de sprites y animación para la serpiente

class SnakeSprites {
    constructor() {
        this.sprites = {};
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        this.loaded = false;
        this.useSpritesheetMode = false;
        
        // Inicializar el gestor de spritesheet
        this.spritesheetManager = new SpritesheetManager();
        
        // Configuración de sprites generados (fallback)
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
        
        // Verificar periódicamente si el spritesheet está listo
        this.checkSpritesheetInterval = setInterval(() => {
            if (this.spritesheetManager.loaded && !this.useSpritesheetMode) {
                this.useSpritesheetMode = true;
                Logger.log('Cambiando a modo spritesheet');
                clearInterval(this.checkSpritesheetInterval);
            }
        }, 100);
    }

    // Crear sprite para cabeza direccional
    createHeadSprite(direction) {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_CONFIG.CELL_SIZE;
        canvas.height = GAME_CONFIG.CELL_SIZE;
        const ctx = canvas.getContext('2d');
        
        const size = GAME_CONFIG.CELL_SIZE;
        const center = size / 2;
        
        // Base de la cabeza con gradiente sofisticado en blanco
        const baseGradient = ctx.createRadialGradient(center-2, center-2, 0, center, center, center-3);
        baseGradient.addColorStop(0, '#FFFFFF'); // Blanco puro brillante
        baseGradient.addColorStop(0.5, '#F5F5F5'); // Blanco ligeramente grisáceo
        baseGradient.addColorStop(1, '#E0E0E0'); // Gris claro para el borde
        
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(center, center, center - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde gris sutil
        ctx.strokeStyle = '#BDBDBD';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Brillo superior más sutil
        const highlight = ctx.createRadialGradient(center - 4, center - 4, 0, center, center, center/2);
        highlight.addColorStop(0, 'rgba(255,255,255,0.8)');
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
        
        // Ojos más grandes y brillantes con mejor contraste
        ctx.fillStyle = '#000000'; // Fondo negro para mejor contraste
        ctx.strokeStyle = '#757575'; // Gris medio
        ctx.lineWidth = 0.5;
        
        switch(direction) {
            case 'up':
                // Ojos arriba - fondo blanco con borde gris
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(center - 4, center - eyeOffset, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(center + 4, center - eyeOffset, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Pupilas negras
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
                // Ojos abajo - fondo blanco con borde gris
                ctx.fillStyle = '#FFFFFF';
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
                // Ojos izquierda - fondo blanco con borde gris
                ctx.fillStyle = '#FFFFFF';
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
                // Ojos derecha - fondo blanco con borde gris
                ctx.fillStyle = '#FFFFFF';
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
                // Segmento horizontal elegante con gradiente blanco
                const gradient1 = ctx.createLinearGradient(0, 0, 0, size);
                gradient1.addColorStop(0, '#E0E0E0'); // Gris claro
                gradient1.addColorStop(0.5, GAME_CONFIG.COLORS.SNAKE_BODY); // Blanco del cuerpo
                gradient1.addColorStop(1, '#E0E0E0'); // Gris claro
                ctx.fillStyle = gradient1;
                this.drawRoundedRect(ctx, 1, size/4, size-2, size/2, 8);
                break;
                
            case 'vertical':
                // Segmento vertical elegante con gradiente blanco  
                const gradient2 = ctx.createLinearGradient(0, 0, size, 0);
                gradient2.addColorStop(0, '#E0E0E0'); // Gris claro
                gradient2.addColorStop(0.5, GAME_CONFIG.COLORS.SNAKE_BODY); // Blanco del cuerpo
                gradient2.addColorStop(1, '#E0E0E0'); // Gris claro
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
        // Si el spritesheet está disponible, úsalo
        if (this.isUsingSpritesheetMode()) {
            const canvas = this.spritesheetManager.createSpriteCanvas('head', direction);
            if (canvas) return canvas;
        }
        
        // Fallback a sprites generados
        // Comparar las propiedades del objeto dirección
        if (direction.x === 0 && direction.y === -1) return this.spriteConfig.head.up;    // UP
        if (direction.x === 0 && direction.y === 1) return this.spriteConfig.head.down;   // DOWN
        if (direction.x === -1 && direction.y === 0) return this.spriteConfig.head.left;  // LEFT
        if (direction.x === 1 && direction.y === 0) return this.spriteConfig.head.right;  // RIGHT
        
        // Fallback
        Logger.log('Dirección no reconocida:', direction);
        return this.spriteConfig.head.right;
    }

    // Determinar tipo de segmento del cuerpo
    getBodySprite(prevSegment, currentSegment, nextSegment) {
        let bodyType = 'horizontal'; // Default
        
        if (prevSegment && nextSegment) {
            // Vectores de dirección
            const dx1 = prevSegment.x - currentSegment.x;  // Dirección hacia el segmento anterior
            const dy1 = prevSegment.y - currentSegment.y;
            const dx2 = nextSegment.x - currentSegment.x;  // Dirección hacia el siguiente segmento
            const dy2 = nextSegment.y - currentSegment.y;

            // Si es una línea recta (ambas direcciones están alineadas)
            if ((dx1 === -dx2 && dy1 === -dy2)) {
                if (dx1 === 0) bodyType = 'vertical';   // Movimiento vertical
                else bodyType = 'horizontal'; // Movimiento horizontal
            } else {
                // Es una esquina - determinar qué tipo
                bodyType = 'cornerTL'; // Simplificado por ahora
            }
        }
        
        // Si el spritesheet está disponible, úsalo
        if (this.isUsingSpritesheetMode()) {
            const canvas = this.spritesheetManager.createSpriteCanvas('body', bodyType);
            if (canvas) return canvas;
        }

        // Fallback a sprites generados
        switch(bodyType) {
            case 'vertical': return this.spriteConfig.body.vertical;
            case 'horizontal': return this.spriteConfig.body.horizontal;
            default: return this.spriteConfig.body.cornerTL; // Sprite universal para esquinas
        }
    }

    // Obtener sprite de cola según dirección
    getTailSprite(tailSegment, prevSegment) {
        let tailDirection = 'right'; // Default
        
        if (prevSegment && tailSegment) {
            const dx = tailSegment.x - prevSegment.x;
            const dy = tailSegment.y - prevSegment.y;
            
            if (dx === 1) tailDirection = 'right';
            else if (dx === -1) tailDirection = 'left';
            else if (dy === 1) tailDirection = 'down';
            else if (dy === -1) tailDirection = 'up';
        }
        
        // Si el spritesheet está disponible, úsalo
        if (this.isUsingSpritesheetMode()) {
            const canvas = this.spritesheetManager.createSpriteCanvas('tail', tailDirection);
            if (canvas) return canvas;
        }
        
        // Fallback a sprites generados
        switch(tailDirection) {
            case 'up': return this.spriteConfig.tail.up;
            case 'down': return this.spriteConfig.tail.down;
            case 'left': return this.spriteConfig.tail.left;
            case 'right': return this.spriteConfig.tail.right;
            default: return this.spriteConfig.tail.right;
        }
    }

    // Actualizar animación
    update(deltaTime) {
        this.animationFrame += this.animationSpeed * deltaTime;
        if (this.animationFrame > Math.PI * 2) {
            this.animationFrame = 0;
        }
        
        // Actualizar también el spritesheet manager
        if (this.spritesheetManager) {
            this.spritesheetManager.update(deltaTime);
        }
    }

    // Obtener offset de animación para movimiento fluido
    getAnimationOffset() {
        return Math.sin(this.animationFrame) * 2; // Suave ondulación
    }

    // Métodos para manejar el spritesheet
    isUsingSpritesheetMode() {
        return this.useSpritesheetMode && this.spritesheetManager && this.spritesheetManager.loaded;
    }

    // Cambiar tipo de serpiente (0, 1, 2)
    setSnakeType(type) {
        if (this.spritesheetManager) {
            this.spritesheetManager.setSnakeType(type);
        }
    }

    // Ciclar al siguiente tipo de serpiente
    cycleSnakeType() {
        if (this.spritesheetManager) {
            this.spritesheetManager.cycleSnakeType();
            Logger.log('Cambiado a serpiente tipo:', this.spritesheetManager.currentSnakeType);
        }
    }

    // Obtener sprite de spritesheet o fallback
    getSprite(partType, direction) {
        if (this.isUsingSpritesheetMode()) {
            // Usar spritesheet
            const canvas = this.spritesheetManager.createSpriteCanvas(partType, direction);
            if (canvas) return canvas;
        }
        
        // Fallback a sprites generados
        switch (partType) {
            case 'head':
                return this.getHeadSprite(direction);
            case 'body':
                return this.spriteConfig.body.horizontal; // Simplificado para demo
            case 'tail':
                return this.getTailSprite(null, {x: 0, y: 0}); // Simplificado
            default:
                return this.spriteConfig.body.horizontal;
        }
    }

    // Métodos mejorados que usan el spritesheet cuando está disponible
    getHeadSpriteEnhanced(direction) {
        return this.getSprite('head', direction);
    }

    getBodySpriteEnhanced(bodyType = 'horizontal') {
        return this.getSprite('body', bodyType);
    }

    getTailSpriteEnhanced(direction) {
        return this.getSprite('tail', direction);
    }

    // Obtener información del sistema
    getInfo() {
        return {
            loaded: this.loaded,
            useSpritesheetMode: this.useSpritesheetMode,
            spritesheetInfo: this.spritesheetManager ? this.spritesheetManager.getInfo() : null
        };
    }

    // Cambiar el tipo de serpiente (0=naranja, 1=verde, 2=azul)
    setSnakeType(type) {
        if (this.spritesheetManager) {
            this.spritesheetManager.setSnakeType(type);
            Logger.log(`Cambiado a serpiente tipo ${type}: ${['Naranja', 'Verde', 'Azul'][type]}`);
        }
    }

    // Obtener el tipo actual de serpiente
    getCurrentSnakeType() {
        return this.spritesheetManager ? this.spritesheetManager.currentSnakeType : 0;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SnakeSprites = SnakeSprites;
}